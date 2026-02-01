import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Binance from 'binance-api-node';
import NodeCache from 'node-cache';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Cache para evitar demasiadas requests a Binance
const cache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL) || 10 });

// Configurar CORS
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://localhost:8080',
    'https://binance-dashboard-hiypxjby1-dfelixuys-projects.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}));

app.use(express.json());

// Inicializar cliente de Binance
// La librería puede exportarse como default o named export, manejamos ambos casos
const BinanceClient = Binance.default || Binance;
const client = BinanceClient({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_API_SECRET,
  getTime: () => Date.now()
});

// ============================================
// ENDPOINTS - INFORMACIÓN GENERAL DE CUENTA
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Binance Dashboard Backend running',
    timestamp: new Date().toISOString()
  });
});

// Obtener información general de la cuenta
app.get('/api/account', async (req, res) => {
  try {
    const cacheKey = 'account_info';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json({ data: cached, cached: true });
    }

    const accountInfo = await client.accountInfo();
    cache.set(cacheKey, accountInfo);
    
    res.json({ data: accountInfo, cached: false });
  } catch (error) {
    console.error('Error obteniendo info de cuenta:', error.message);
    res.status(500).json({ 
      error: 'Error al obtener información de cuenta',
      details: error.message 
    });
  }
});

// ============================================
// ENDPOINTS - SPOT
// ============================================

// Obtener balance de Spot
app.get('/api/spot/balance', async (req, res) => {
  try {
    const cacheKey = 'spot_balance';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json({ data: cached, cached: true });
    }

    const accountInfo = await client.accountInfo();
    
    // Filtrar solo balances con cantidad > 0
    const balances = accountInfo.balances
      .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
      .map(b => ({
        asset: b.asset,
        free: parseFloat(b.free),
        locked: parseFloat(b.locked),
        total: parseFloat(b.free) + parseFloat(b.locked)
      }));

    // Obtener precios en USD para cada asset
    const prices = await client.prices();
    const balancesWithUSD = await Promise.all(
      balances.map(async (b) => {
        let valueUSD = 0;
        
        if (b.asset === 'USDT' || b.asset === 'BUSD' || b.asset === 'USD') {
          valueUSD = b.total;
        } else {
          const symbol = `${b.asset}USDT`;
          const price = parseFloat(prices[symbol] || 0);
          valueUSD = b.total * price;
        }

        // Obtener cambio 24h
        let change24h = 0;
        try {
          if (b.asset !== 'USDT' && b.asset !== 'BUSD') {
            const ticker = await client.dailyStats({ symbol: `${b.asset}USDT` });
            change24h = parseFloat(ticker.priceChangePercent || 0);
          }
        } catch (err) {
          // Si no hay par con USDT, probar con BTC
          try {
            const ticker = await client.dailyStats({ symbol: `${b.asset}BTC` });
            change24h = parseFloat(ticker.priceChangePercent || 0);
          } catch (err2) {
            change24h = 0;
          }
        }

        return {
          ...b,
          valueUSD,
          change24h
        };
      })
    );

    // Ordenar por valor USD descendente
    balancesWithUSD.sort((a, b) => b.valueUSD - a.valueUSD);

    const result = {
      balances: balancesWithUSD,
      totalValue: balancesWithUSD.reduce((sum, b) => sum + b.valueUSD, 0)
    };

    cache.set(cacheKey, result);
    res.json({ data: result, cached: false });

  } catch (error) {
    console.error('Error obteniendo balance de Spot:', error.message);
    res.status(500).json({ 
      error: 'Error al obtener balance de Spot',
      details: error.message 
    });
  }
});

// Obtener evolución histórica del capital
app.get('/api/portfolio/history', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const cacheKey = `portfolio_history_${startDate}_${endDate}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json({ data: cached, cached: true });
    }

    console.log(`Calculando evolución del portfolio desde ${startDate} hasta ${endDate}...`);

    // Convertir fechas a timestamps
    const start = startDate ? new Date(startDate).getTime() : new Date('2025-08-01').getTime();
    const end = endDate ? new Date(endDate).getTime() : Date.now();

    // Obtener balance actual
    const accountInfo = await client.accountInfo();
    const balances = accountInfo.balances
      .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
      .map(b => ({
        asset: b.asset,
        total: parseFloat(b.free) + parseFloat(b.locked)
      }));

    // Obtener precios actuales
    const prices = await client.prices();

    // Objeto para almacenar la evolución del capital por fecha
    const dailyCapital = {};

    // Procesar cada asset
    for (const balance of balances) {
      try {
        // Saltar stablecoins
        if (balance.asset === 'USDT' || balance.asset === 'BUSD' || balance.asset === 'USDC') {
          continue;
        }

        // Obtener trades
        let symbol = `${balance.asset}USDT`;
        let trades = [];
        
        try {
          trades = await client.myTrades({ symbol, limit: 1000 });
          trades = trades.filter(t => t.time >= start && t.time <= end);
        } catch (err) {
          try {
            symbol = `${balance.asset}BTC`;
            trades = await client.myTrades({ symbol, limit: 1000 });
            trades = trades.filter(t => t.time >= start && t.time <= end);
          } catch (err2) {
            continue;
          }
        }

        // Procesar trades para calcular holding diario
        let currentHolding = 0;
        
        for (const trade of trades) {
          const tradeDate = new Date(trade.time).toISOString().split('T')[0]; // YYYY-MM-DD
          const qty = parseFloat(trade.qty);
          const price = parseFloat(trade.price);
          
          if (trade.isBuyer) {
            currentHolding += qty;
          } else {
            currentHolding -= qty;
          }

          // Obtener precio en USD
          let priceUSD = 0;
          if (symbol.endsWith('USDT')) {
            priceUSD = price;
          } else {
            // Si es par con BTC, convertir a USD
            const btcPrice = parseFloat(prices['BTCUSDT'] || 0);
            priceUSD = price * btcPrice;
          }

          // Calcular valor del holding en esa fecha
          const valueUSD = currentHolding * priceUSD;

          if (!dailyCapital[tradeDate]) {
            dailyCapital[tradeDate] = 0;
          }
          dailyCapital[tradeDate] += valueUSD;
        }

      } catch (error) {
        console.error(`Error procesando ${balance.asset}:`, error.message);
        continue;
      }
    }

    // Convertir a array ordenado por fecha
    const history = Object.entries(dailyCapital)
      .map(([date, capital]) => ({
        date,
        capital: Math.round(capital * 100) / 100
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Si no hay datos, devolver array vacío
    if (history.length === 0) {
      return res.json({ 
        data: { 
          history: [],
          summary: {
            startDate: new Date(start).toISOString().split('T')[0],
            endDate: new Date(end).toISOString().split('T')[0],
            startCapital: 0,
            endCapital: 0,
            change: 0,
            changePercent: 0
          }
        }, 
        cached: false 
      });
    }

    // Calcular resumen
    const startCapital = history[0].capital;
    const endCapital = history[history.length - 1].capital;
    const change = endCapital - startCapital;
    const changePercent = startCapital > 0 ? (change / startCapital) * 100 : 0;

    const result = {
      history,
      summary: {
        startDate: history[0].date,
        endDate: history[history.length - 1].date,
        startCapital,
        endCapital,
        change,
        changePercent
      }
    };

    cache.set(cacheKey, result, 300); // Cache por 5 minutos
    res.json({ data: result, cached: false });

  } catch (error) {
    console.error('Error calculando evolución del portfolio:', error.message);
    res.status(500).json({ 
      error: 'Error al calcular evolución del portfolio',
      details: error.message 
    });
  }
});

// Obtener PnL de Spot basado en historial de trades
app.get('/api/spot/pnl', async (req, res) => {
  try {
    const cacheKey = 'spot_pnl';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json({ data: cached, cached: true });
    }

    console.log('Calculando PnL de Spot desde historial de trades...');

    // Obtener balance actual
    const accountInfo = await client.accountInfo();
    const balances = accountInfo.balances
      .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
      .map(b => ({
        asset: b.asset,
        total: parseFloat(b.free) + parseFloat(b.locked)
      }));

    // Obtener precios actuales
    const prices = await client.prices();

    // Calcular PnL para cada asset
    const pnlData = await Promise.all(
      balances.map(async (balance) => {
        try {
          // No calcular PnL para stablecoins
          if (balance.asset === 'USDT' || balance.asset === 'BUSD' || balance.asset === 'USDC') {
            return null;
          }

          // Obtener historial de trades para este asset
          // IMPORTANTE: Solo considerar trades desde agosto 2025 en adelante
          const startDate = new Date('2025-08-01').getTime(); // 1 de agosto 2025
          
          // Intentar con USDT primero
          let symbol = `${balance.asset}USDT`;
          let trades = [];
          
          try {
            // Obtener más trades para asegurar que tenemos suficientes desde agosto
            trades = await client.myTrades({ symbol, limit: 1000 });
            
            // Filtrar solo trades desde agosto 2025
            trades = trades.filter(t => t.time >= startDate);
            
          } catch (err) {
            // Si no existe par con USDT, intentar con BTC
            try {
              symbol = `${balance.asset}BTC`;
              trades = await client.myTrades({ symbol, limit: 1000 });
              
              // Filtrar solo trades desde agosto 2025
              trades = trades.filter(t => t.time >= startDate);
              
            } catch (err2) {
              console.log(`No se encontraron trades para ${balance.asset}`);
              return null;
            }
          }

          if (trades.length === 0) {
            console.log(`${balance.asset}: No hay trades desde agosto 2025`);
            return null;
          }

          console.log(`${balance.asset}: Procesando ${trades.length} trades desde agosto 2025`);

          // NUEVO ENFOQUE: Calcular basándose en el balance ACTUAL
          // Trabajar hacia atrás desde las compras más recientes hasta completar el balance
          
          const currentBalance = balance.total;
          let remainingToAccount = currentBalance;
          let totalCost = 0;
          
          // Ordenar trades del más reciente al más antiguo
          const sortedTrades = [...trades].sort((a, b) => b.time - a.time);
          
          // Iterar desde el trade más reciente hacia atrás
          for (const trade of sortedTrades) {
            if (remainingToAccount <= 0) break;
            
            const qty = parseFloat(trade.qty);
            const quoteQty = parseFloat(trade.quoteQty);
            
            if (trade.isBuyer) {
              // Es una compra - sumar al costo
              if (qty <= remainingToAccount) {
                // Esta compra completa está en el balance actual
                totalCost += quoteQty;
                remainingToAccount -= qty;
              } else {
                // Solo parte de esta compra está en el balance actual
                const fraction = remainingToAccount / qty;
                totalCost += quoteQty * fraction;
                remainingToAccount = 0;
              }
            } else {
              // Es una venta - significa que necesitamos contar más compras antiguas
              remainingToAccount += qty;
            }
          }
          
          // Si después de procesar todos los trades aún falta balance por contabilizar,
          // significa que parte del balance vino de transfers o trades muy antiguos
          if (remainingToAccount > currentBalance * 0.1) {
            console.log(`⚠️ ${balance.asset}: No se pudo rastrear ${remainingToAccount.toFixed(4)} tokens (${(remainingToAccount/currentBalance*100).toFixed(1)}% del balance)`);
            return null; // No podemos calcular PnL confiable
          }

          // Precio promedio de compra = Costo total / Balance actual
          const avgBuyPrice = totalCost / currentBalance;

          // Precio actual
          let currentPrice = 0;
          const priceSymbol = `${balance.asset}USDT`;
          if (prices[priceSymbol]) {
            currentPrice = parseFloat(prices[priceSymbol]);
          } else {
            // Si no hay par con USDT, usar BTC
            const btcSymbol = `${balance.asset}BTC`;
            const btcPrice = parseFloat(prices[btcSymbol] || 0);
            const btcUsdtPrice = parseFloat(prices['BTCUSDT'] || 0);
            currentPrice = btcPrice * btcUsdtPrice;
          }

          if (currentPrice === 0 || avgBuyPrice === 0) {
            return null;
          }

          // Calcular PnL basado en tu balance ACTUAL
          const invested = totalCost; // El costo total de lo que tienes ahora
          const currentValue = currentPrice * currentBalance;
          const pnl = currentValue - invested;
          const pnlPercent = (pnl / invested) * 100;

          console.log(`✅ ${balance.asset}: Invertido: $${invested.toFixed(2)}, Valor actual: $${currentValue.toFixed(2)}, PnL: $${pnl.toFixed(2)} (${trades.length} trades desde ago-2025)`);

          return {
            asset: balance.asset,
            quantity: currentBalance,
            avgBuyPrice,
            currentPrice,
            invested,
            currentValue,
            pnl,
            pnlPercent,
            tradesCount: trades.length,
            firstTradeDate: trades.length > 0 ? new Date(trades[0].time).toISOString() : null,
            lastTradeDate: trades.length > 0 ? new Date(trades[trades.length - 1].time).toISOString() : null
          };

        } catch (error) {
          console.error(`Error calculando PnL para ${balance.asset}:`, error.message);
          return null;
        }
      })
    );

    // Filtrar nulls y calcular totales
    const validPnL = pnlData.filter(p => p !== null);
    
    const totalInvested = validPnL.reduce((sum, p) => sum + p.invested, 0);
    const totalCurrentValue = validPnL.reduce((sum, p) => sum + p.currentValue, 0);
    const totalPnL = totalCurrentValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    const result = {
      assets: validPnL,
      summary: {
        totalInvested,
        totalCurrentValue,
        totalPnL,
        totalPnLPercent,
        assetsTracked: validPnL.length
      }
    };

    cache.set(cacheKey, result, 60); // Cache por 60 segundos (es un cálculo pesado)
    res.json({ data: result, cached: false });

  } catch (error) {
    console.error('Error calculando PnL de Spot:', error.message);
    res.status(500).json({ 
      error: 'Error al calcular PnL de Spot',
      details: error.message 
    });
  }
});

// ============================================
// ENDPOINTS - FUTUROS
// ============================================

// Obtener posiciones de Futuros
app.get('/api/futures/positions', async (req, res) => {
  try {
    const cacheKey = 'futures_positions';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json({ data: cached, cached: true });
    }

    // Obtener información de cuenta de futuros
    const futuresAccount = await client.futuresAccountInfo();
    
    // Filtrar solo posiciones abiertas (con cantidad > 0)
    const openPositions = futuresAccount.positions
      .filter(p => Math.abs(parseFloat(p.positionAmt)) > 0)
      .map(p => ({
        symbol: p.symbol,
        side: parseFloat(p.positionAmt) > 0 ? 'LONG' : 'SHORT',
        size: Math.abs(parseFloat(p.positionAmt)),
        entryPrice: parseFloat(p.entryPrice),
        markPrice: parseFloat(p.markPrice),
        unrealizedPnL: parseFloat(p.unrealizedProfit),
        leverage: parseInt(p.leverage),
        margin: parseFloat(p.initialMargin),
        notional: parseFloat(p.notional),
        liquidationPrice: parseFloat(p.liquidationPrice)
      }));

    const result = {
      positions: openPositions,
      totalMargin: parseFloat(futuresAccount.totalInitialMargin),
      availableMargin: parseFloat(futuresAccount.availableBalance),
      totalUnrealizedPnL: parseFloat(futuresAccount.totalUnrealizedProfit),
      totalWalletBalance: parseFloat(futuresAccount.totalWalletBalance),
      futuresEnabled: true
    };

    cache.set(cacheKey, result);
    res.json({ data: result, cached: false });

  } catch (error) {
    console.error('Error obteniendo posiciones de Futuros:', error.message);
    
    // Si el error es porque Futuros no está habilitado, devolver datos vacíos
    if (error.message.includes('Futures') || error.code === -2015 || error.code === -4001) {
      const emptyResult = {
        positions: [],
        totalMargin: 0,
        availableMargin: 0,
        totalUnrealizedPnL: 0,
        totalWalletBalance: 0,
        futuresEnabled: false,
        message: 'Futuros no está habilitado en tu cuenta de Binance'
      };
      return res.json({ data: emptyResult, cached: false });
    }
    
    res.status(500).json({ 
      error: 'Error al obtener posiciones de Futuros',
      details: error.message 
    });
  }
});

// ============================================
// ENDPOINTS - TRADING BOTS (Binance DCA)
// ============================================

// Obtener información de bots DCA de Binance
app.get('/api/bots', async (req, res) => {
  try {
    const cacheKey = 'binance_dca_bots';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json({ data: cached, cached: true });
    }

    console.log('Obteniendo bots DCA de Binance...');

    // Binance usa diferentes endpoints para Auto-Invest (DCA)
    // Necesitamos usar el endpoint de Auto-Invest Plan
    
    try {
      // Obtener planes de Auto-Invest activos
      // El endpoint es: GET /sapi/v1/lending/auto-invest/plan/list
      const autoInvestPlans = await client.futuresAccountInfo(); // Placeholder - necesitamos el endpoint correcto
      
      // Por ahora, vamos a detectar bots DCA analizando el historial de trades
      // y buscando patrones de compra repetitivos
      
      const potentialDCABots = await detectDCAPatterns();
      
      res.json({ 
        data: potentialDCABots,
        note: 'Detectando patrones DCA desde historial de trades. Para datos exactos de Binance Auto-Invest, se requiere acceso a endpoints específicos.'
      });

    } catch (error) {
      console.error('Error obteniendo bots de Binance:', error.message);
      
      // Si falla, intentar detectar desde historial
      const detectedBots = await detectDCAPatterns();
      
      res.json({ 
        data: detectedBots,
        detected: true,
        note: 'Bots detectados mediante análisis de patrones de trading'
      });
    }

  } catch (error) {
    console.error('Error obteniendo bots:', error.message);
    res.status(500).json({ 
      error: 'Error al obtener información de bots',
      details: error.message 
    });
  }
});

// Función auxiliar para detectar patrones DCA en el historial
async function detectDCAPatterns() {
  try {
    // Obtener balance actual para saber qué activos revisar
    const accountInfo = await client.accountInfo();
    const assets = accountInfo.balances
      .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
      .map(b => b.asset)
      .filter(a => a !== 'USDT' && a !== 'BUSD' && a !== 'USDC');

    const dcaBots = [];

    for (const asset of assets.slice(0, 10)) { // Limitar a primeros 10 para no saturar
      try {
        const symbol = `${asset}USDT`;
        
        // Solo considerar trades desde agosto 2025
        const startDate = new Date('2025-08-01').getTime();
        let allTrades = await client.myTrades({ symbol, limit: 1000 });
        
        // Filtrar por fecha
        const trades = allTrades.filter(t => t.time >= startDate);

        if (trades.length < 5) continue; // Necesitamos al menos 5 trades para detectar patrón

        console.log(`Analizando ${asset}: ${trades.length} trades desde agosto 2025`);

        // Analizar trades para detectar patrón DCA (compras regulares)
        const buyTrades = trades.filter(t => t.isBuyer);
        
        if (buyTrades.length < 3) continue;

        // Calcular intervalos entre compras
        const intervals = [];
        for (let i = 1; i < buyTrades.length && i < 10; i++) {
          const timeDiff = buyTrades[i].time - buyTrades[i-1].time;
          intervals.push(timeDiff);
        }

        // Si hay regularidad en las compras (intervalos similares), es probable que sea DCA
        if (intervals.length > 0) {
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          const maxDeviation = Math.max(...intervals.map(i => Math.abs(i - avgInterval)));
          
          // Si la desviación es menor al 50% del intervalo promedio, consideramos que es DCA
          if (maxDeviation < avgInterval * 0.5 && avgInterval > 3600000) { // Más de 1 hora entre compras
            
            // Calcular estadísticas del bot
            const totalInvested = buyTrades.reduce((sum, t) => sum + parseFloat(t.quoteQty), 0);
            const totalBought = buyTrades.reduce((sum, t) => sum + parseFloat(t.qty), 0);
            const avgPrice = totalInvested / totalBought;

            // Obtener precio actual
            const prices = await client.prices();
            const currentPrice = parseFloat(prices[symbol] || 0);
            const currentValue = totalBought * currentPrice;
            const profit = currentValue - totalInvested;
            const profitPercent = (profit / totalInvested) * 100;

            // Determinar frecuencia
            const avgIntervalDays = avgInterval / (1000 * 60 * 60 * 24);
            let frequency = 'Diario';
            if (avgIntervalDays > 6) frequency = 'Semanal';
            if (avgIntervalDays > 25) frequency = 'Mensual';

            dcaBots.push({
              id: `dca_${asset}`,
              name: `DCA ${asset}`,
              pair: symbol,
              status: 'active',
              type: 'dca',
              frequency,
              investment: totalInvested,
              profit,
              profitPercent,
              trades: buyTrades.length,
              avgBuyPrice: avgPrice,
              currentPrice,
              lastBuy: new Date(buyTrades[buyTrades.length - 1].time).toISOString()
            });
          }
        }

      } catch (err) {
        // Si falla para un asset específico, continuar con el siguiente
        continue;
      }
    }

    return dcaBots;

  } catch (error) {
    console.error('Error detectando patrones DCA:', error.message);
    return [];
  }
}

// ============================================
// ENDPOINTS - PRECIOS Y MERCADO
// ============================================

// Obtener precios actuales
app.get('/api/prices', async (req, res) => {
  try {
    const cacheKey = 'all_prices';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json({ data: cached, cached: true });
    }

    const prices = await client.prices();
    cache.set(cacheKey, prices);
    
    res.json({ data: prices, cached: false });
  } catch (error) {
    console.error('Error obteniendo precios:', error.message);
    res.status(500).json({ 
      error: 'Error al obtener precios',
      details: error.message 
    });
  }
});

// Obtener estadísticas 24h de un símbolo específico
app.get('/api/ticker/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `ticker_${symbol}`;
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return res.json({ data: cached, cached: true });
    }

    const ticker = await client.dailyStats({ symbol: symbol.toUpperCase() });
    cache.set(cacheKey, ticker);
    
    res.json({ data: ticker, cached: false });
  } catch (error) {
    console.error(`Error obteniendo ticker de ${req.params.symbol}:`, error.message);
    res.status(500).json({ 
      error: 'Error al obtener ticker',
      details: error.message 
    });
  }
});

// ============================================
// MANEJO DE ERRORES
// ============================================

app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    details: err.message 
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Binance Dashboard Backend                            ║
║                                                            ║
║   Servidor corriendo en: http://localhost:${PORT}            ║
║   Health check: http://localhost:${PORT}/api/health          ║
║                                                            ║
║   Endpoints disponibles:                                   ║
║   • GET /api/account          - Info general               ║
║   • GET /api/spot/balance     - Balance Spot               ║
║   • GET /api/futures/positions - Posiciones Futuros        ║
║   • GET /api/bots             - Trading Bots               ║
║   • GET /api/prices           - Todos los precios          ║
║   • GET /api/ticker/:symbol   - Ticker específico          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
