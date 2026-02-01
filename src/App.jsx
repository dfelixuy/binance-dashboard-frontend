import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, Wallet, Bot, BarChart3, RefreshCw, AlertCircle, Wifi, WifiOff, BookOpen, PlusCircle, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// URL del backend
const API_URL = 'http://localhost:3001/api';

export default function BinanceDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({
    totalBalance: 0,
    totalPnL24h: 0,
    pnlPercentage: 0,
    futures: {
      totalMargin: 0,
      availableMargin: 0,
      unrealizedPnL: 0,
      totalWalletBalance: 0,
      positions: [],
      futuresEnabled: true,
      message: ''
    },
    spot: {
      totalValue: 0,
      holdings: [],
      pnl: {
        assets: [],
        summary: {
          totalInvested: 0,
          totalCurrentValue: 0,
          totalPnL: 0,
          totalPnLPercent: 0,
          assetsTracked: 0
        }
      }
    }
  });
  
  // Estado para valores manuales de Binance
  const [manualValues, setManualValues] = useState(() => {
    const saved = localStorage.getItem('binanceManualValues');
    return saved ? JSON.parse(saved) : {
      botsProfit: 0,
      botsInvestment: 0,
      earnProfit: 0,
      lastUpdated: null
    };
  });
  
  const [isEditingManual, setIsEditingManual] = useState(false);
  const [tempManualValues, setTempManualValues] = useState(manualValues);

  // Estado para alertas configurables
  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem('binanceAlerts');
    return saved ? JSON.parse(saved) : {
      priceDropPercent: 5, // Alerta si un activo baja más de 5%
      criticalLossPercent: 50, // Alerta si pérdida > 50%
      enabled: true
    };
  });

  // Estado para journal de trading
  const [journalEntries, setJournalEntries] = useState(() => {
    const saved = localStorage.getItem('tradingJournal');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [newJournalEntry, setNewJournalEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    asset: '',
    action: 'buy', // buy, sell, hold
    price: '',
    notes: ''
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  
  // Estados para la gráfica
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [startDate, setStartDate] = useState('2025-08-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Función para obtener datos del backend
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Verificar conexión con el backend
      const healthCheck = await fetch(`${API_URL}/health`);
      if (!healthCheck.ok) throw new Error('Backend no disponible');
      setConnected(true);

      // Obtener datos de Spot
      const spotResponse = await fetch(`${API_URL}/spot/balance`);
      const spotData = await spotResponse.json();
      
      // Obtener PnL de Spot
      const spotPnLResponse = await fetch(`${API_URL}/spot/pnl`);
      const spotPnLData = await spotPnLResponse.json();
      
      // Obtener datos de Futuros
      const futuresResponse = await fetch(`${API_URL}/futures/positions`);
      const futuresData = await futuresResponse.json();

      // Calcular balance total y PnL
      const totalSpot = spotData.data?.totalValue || 0;
      const totalFutures = futuresData.data?.totalWalletBalance || 0;
      const unrealizedPnL = futuresData.data?.totalUnrealizedPnL || 0;
      
      // Incluir valor actual de bots (inversión + ganancia)
      const botsCurrentValue = manualValues.botsInvestment + manualValues.botsProfit;
      
      const totalBalance = totalSpot + totalFutures + botsCurrentValue;
      
      // PnL total incluye: PnL de futuros + Ganancia de bots + Ganancia de Earn
      const totalPnL = unrealizedPnL + manualValues.botsProfit + manualValues.earnProfit;

      // Actualizar estado con datos reales
      setData({
        totalBalance,
        totalPnL24h: totalPnL,
        pnlPercentage: totalBalance > 0 ? (totalPnL / totalBalance) * 100 : 0,
        futures: {
          totalMargin: futuresData.data?.totalMargin || 0,
          availableMargin: futuresData.data?.availableMargin || 0,
          unrealizedPnL: futuresData.data?.totalUnrealizedPnL || 0,
          totalWalletBalance: futuresData.data?.totalWalletBalance || 0,
          positions: futuresData.data?.positions || [],
          futuresEnabled: futuresData.data?.futuresEnabled !== false,
          message: futuresData.data?.message || ''
        },
        spot: {
          totalValue: spotData.data?.totalValue || 0,
          holdings: spotData.data?.balances || [],
          pnl: spotPnLData.data || {
            assets: [],
            summary: {
              totalInvested: 0,
              totalCurrentValue: 0,
              totalPnL: 0,
              totalPnLPercent: 0,
              assetsTracked: 0
            }
          }
        }
      });

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos inicialmente y configurar actualización automática
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Actualizar cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  // Función para cargar datos de la gráfica
  const fetchChartData = async () => {
    setChartLoading(true);
    try {
      const response = await fetch(`${API_URL}/portfolio/history?startDate=${startDate}&endDate=${endDate}`);
      const result = await response.json();
      
      if (result.data && result.data.history) {
        setChartData(result.data);
      }
    } catch (error) {
      console.error('Error cargando datos de gráfica:', error);
    } finally {
      setChartLoading(false);
    }
  };

  // Cargar gráfica cuando cambia a esa tab
  useEffect(() => {
    if (activeTab === 'chart') {
      fetchChartData();
    }
  }, [activeTab, startDate, endDate]);

  // Funciones para manejar valores manuales
  const handleSaveManualValues = () => {
    const updatedValues = {
      ...tempManualValues,
      lastUpdated: new Date().toISOString()
    };
    setManualValues(updatedValues);
    localStorage.setItem('binanceManualValues', JSON.stringify(updatedValues));
    setIsEditingManual(false);
  };

  const handleCancelEdit = () => {
    setTempManualValues(manualValues);
    setIsEditingManual(false);
  };

  // Funciones para el journal
  const handleSaveJournalEntry = () => {
    if (!newJournalEntry.asset || !newJournalEntry.notes) {
      alert('Por favor completa al menos el activo y las notas');
      return;
    }

    const entry = {
      ...newJournalEntry,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };

    const updated = [entry, ...journalEntries];
    setJournalEntries(updated);
    localStorage.setItem('tradingJournal', JSON.stringify(updated));
    
    setNewJournalEntry({
      date: new Date().toISOString().split('T')[0],
      asset: '',
      action: 'buy',
      price: '',
      notes: ''
    });
    setShowJournalForm(false);
  };

  const handleDeleteJournalEntry = (id) => {
    const updated = journalEntries.filter(e => e.id !== id);
    setJournalEntries(updated);
    localStorage.setItem('tradingJournal', JSON.stringify(updated));
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '0.00%';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatNumber = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return Number(value).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  // Memorizar el array de holdings ordenado por PnL%
  const sortedHoldings = useMemo(() => {
    return [...data.spot.holdings].sort((a, b) => {
      const pnlA = data.spot.pnl.assets.find(p => p.asset === a.asset);
      const pnlB = data.spot.pnl.assets.find(p => p.asset === b.asset);
      
      // Si ambos tienen PnL, ordenar por porcentaje descendente (mayor primero)
      if (pnlA && pnlB) {
        return pnlB.pnlPercent - pnlA.pnlPercent;
      }
      
      // Si solo uno tiene PnL, ponerlo primero
      if (pnlA) return -1;
      if (pnlB) return 1;
      
      // Si ninguno tiene PnL, ordenar por valor USD descendente
      return b.valueUSD - a.valueUSD;
    });
  }, [data.spot.holdings, data.spot.pnl.assets]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent mb-2" style={{ fontFamily: '"Orbitron", monospace' }}>
              BINANCE DASHBOARD
            </h1>
            <p className="text-slate-400 text-sm flex items-center gap-2">
              {connected ? (
                <>
                  <Wifi size={14} className="text-green-400" />
                  <span className="text-green-400">Conectado</span>
                </>
              ) : (
                <>
                  <WifiOff size={14} className="text-red-400" />
                  <span className="text-red-400">Desconectado</span>
                </>
              )}
              <span className="mx-2">•</span>
              Última actualización: {lastUpdate.toLocaleTimeString()}
            </p>
            {error && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                Error: {error}
              </p>
            )}
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className={`bg-slate-800/50 backdrop-blur border border-slate-700 px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700/50'
            }`}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
        
        {/* Balance Total */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur border border-amber-500/20 rounded-2xl p-8 shadow-2xl shadow-amber-500/10 mt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm mb-2">Balance Total</p>
              <h2 className="text-5xl font-bold mb-3" style={{ fontFamily: '"Orbitron", monospace' }}>{formatCurrency(data.totalBalance)}</h2>
              <div className="flex items-center gap-2">
                {data.totalPnL24h >= 0 ? <TrendingUp className="text-green-400" size={20} /> : <TrendingDown className="text-red-400" size={20} />}
                <span className={`text-xl font-semibold ${data.totalPnL24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(data.totalPnL24h)} ({formatPercent(data.pnlPercentage)})
                </span>
                <span className="text-slate-500 text-sm">24h</span>
              </div>
            </div>
            <div className="text-right">
              <Wallet className="text-amber-400 mb-2" size={48} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2 bg-slate-900/50 backdrop-blur p-1 rounded-xl border border-slate-800">
          {[
            { id: 'overview', label: 'Vista General', icon: Activity },
            { id: 'futures', label: 'Futuros', icon: TrendingUp },
            { id: 'spot', label: 'Spot', icon: Wallet },
            { id: 'bots', label: 'Bots', icon: Bot },
            { id: 'chart', label: 'Gráfica', icon: BarChart3 },
            { id: 'journal', label: 'Journal', icon: BookOpen }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-semibold ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 shadow-lg shadow-amber-500/50' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {/* FUTURES TAB */}
        {activeTab === 'futures' && (
          <div className="space-y-6 animate-fadeIn">
            {!data.futures.futuresEnabled && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 flex items-start gap-3">
                <AlertCircle className="text-blue-400 flex-shrink-0 mt-1" size={24} />
                <div>
                  <p className="text-blue-400 font-semibold mb-2">Futuros no habilitado</p>
                  <p className="text-slate-300 text-sm">
                    {data.futures.message || 'Tu cuenta de Binance no tiene Futuros habilitado. Para habilitar Futuros, ve a Binance.com → Wallet → Futures y completa la verificación requerida.'}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <p className="text-slate-400 text-sm mb-2">Margen Total</p>
                <p className="text-3xl font-bold text-amber-400">{formatCurrency(data.futures.totalMargin)}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <p className="text-slate-400 text-sm mb-2">Margen Disponible</p>
                <p className="text-3xl font-bold text-green-400">{formatCurrency(data.futures.availableMargin)}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <p className="text-slate-400 text-sm mb-2">PnL No Realizado</p>
                <p className={`text-3xl font-bold ${data.futures.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(data.futures.unrealizedPnL)}
                </p>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="text-amber-400" />
                  Posiciones Abiertas
                </h3>
              </div>
              {data.futures.positions.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <AlertCircle className="mx-auto mb-3" size={48} />
                  <p>{!data.futures.futuresEnabled ? 'Habilita Futuros en tu cuenta de Binance para ver posiciones' : 'No tienes posiciones abiertas en Futuros'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50">
                      <tr>
                        <th className="text-left p-4 text-slate-400 font-semibold">Símbolo</th>
                        <th className="text-left p-4 text-slate-400 font-semibold">Lado</th>
                        <th className="text-right p-4 text-slate-400 font-semibold">Tamaño</th>
                        <th className="text-right p-4 text-slate-400 font-semibold">Precio Entrada</th>
                        <th className="text-right p-4 text-slate-400 font-semibold">Precio Mark</th>
                        <th className="text-right p-4 text-slate-400 font-semibold">Apalancamiento</th>
                        <th className="text-right p-4 text-slate-400 font-semibold">PnL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.futures.positions.map((pos, idx) => (
                        <tr key={idx} className="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                          <td className="p-4 font-bold text-amber-400">{pos.symbol || 'N/A'}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              pos.side === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {pos.side || 'N/A'}
                            </span>
                          </td>
                          <td className="text-right p-4">{formatNumber(pos.size, 4)}</td>
                          <td className="text-right p-4">${formatNumber(pos.entryPrice, 2)}</td>
                          <td className="text-right p-4">${formatNumber(pos.markPrice, 2)}</td>
                          <td className="text-right p-4">
                            <span className="px-2 py-1 bg-slate-700 rounded text-amber-400 font-semibold text-sm">
                              {pos.leverage || 1}x
                            </span>
                          </td>
                          <td className={`text-right p-4 font-bold ${(pos.unrealizedPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(pos.unrealizedPnL)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SPOT TAB */}
        {activeTab === 'spot' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Resumen de PnL */}
            {data.spot.pnl.summary.assetsTracked > 0 && (
              <>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3 mb-6">
                  <AlertCircle className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="text-blue-400 font-semibold mb-1">Período de Cálculo</p>
                    <p className="text-slate-300 text-sm">
                      Los cálculos de PnL consideran únicamente trades realizados desde <strong>Agosto 2025</strong> en adelante. 
                      Trades anteriores a esta fecha no se incluyen en los cálculos.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                  <p className="text-slate-400 text-sm mb-2">Invertido Total</p>
                  <p className="text-3xl font-bold text-blue-400">{formatCurrency(data.spot.pnl.summary.totalInvested)}</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                  <p className="text-slate-400 text-sm mb-2">Valor Actual</p>
                  <p className="text-3xl font-bold text-amber-400">{formatCurrency(data.spot.pnl.summary.totalCurrentValue)}</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                  <p className="text-slate-400 text-sm mb-2">Ganancia/Pérdida</p>
                  <p className={`text-3xl font-bold ${data.spot.pnl.summary.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(data.spot.pnl.summary.totalPnL)}
                  </p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                  <p className="text-slate-400 text-sm mb-2">ROI</p>
                  <p className={`text-3xl font-bold ${data.spot.pnl.summary.totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercent(data.spot.pnl.summary.totalPnLPercent)}
                  </p>
                </div>
              </div>
              </>
            )}

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <p className="text-slate-400 text-sm mb-2">Valor Total Spot</p>
              <p className="text-4xl font-bold text-amber-400">{formatCurrency(data.spot.totalValue)}</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Wallet className="text-amber-400" />
                  Holdings con PnL
                </h3>
              </div>
              {data.spot.holdings.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <AlertCircle className="mx-auto mb-3" size={48} />
                  <p>No tienes activos en Spot</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 p-6">
                  {sortedHoldings.map((holding, idx) => {
                    // Buscar datos de PnL para este asset
                    const pnlData = data.spot.pnl.assets.find(p => p.asset === holding.asset);
                    
                    return (
                      <div key={idx} className="bg-slate-900/50 border border-slate-700 rounded-xl p-5 hover:border-amber-500/50 transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-2xl font-bold text-amber-400 mb-1">{holding.asset || 'N/A'}</h4>
                            <p className="text-slate-400 text-sm">{formatNumber(holding.total, 8)} tokens</p>
                          </div>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                            (holding.change24h || 0) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            {(holding.change24h || 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span className={`text-sm font-semibold ${(holding.change24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatPercent(holding.change24h)} 24h
                            </span>
                          </div>
                        </div>

                        {pnlData ? (
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 border-t border-slate-700 pt-4">
                            <div>
                              <p className="text-slate-500 text-xs mb-1">Precio Compra</p>
                              <p className="text-base font-semibold text-slate-300">${formatNumber(pnlData.avgBuyPrice, 2)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs mb-1">Precio Actual</p>
                              <p className="text-base font-semibold text-slate-300">${formatNumber(pnlData.currentPrice, 2)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs mb-1">Invertido</p>
                              <p className="text-base font-semibold text-blue-400">{formatCurrency(pnlData.invested)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs mb-1">Valor Actual</p>
                              <p className="text-base font-semibold text-amber-400">{formatCurrency(pnlData.currentValue)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-xs mb-1">Ganancia/Pérdida</p>
                              <p className={`text-xl font-bold ${pnlData.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatCurrency(pnlData.pnl)}
                                <span className="text-sm ml-2">({formatPercent(pnlData.pnlPercent)})</span>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="border-t border-slate-700 pt-4">
                            <p className="text-2xl font-bold">{formatCurrency(holding.valueUSD)}</p>
                            <p className="text-slate-500 text-xs mt-1">Sin historial de trades para calcular PnL</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOTS TAB - Ahora es entrada manual de valores de Binance */}
        {activeTab === 'bots' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Instrucciones */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-blue-400 flex-shrink-0 mt-1" size={24} />
                <div>
                  <p className="text-blue-400 font-semibold mb-2">Valores Manuales de Binance</p>
                  <p className="text-slate-300 text-sm mb-2">
                    Copia los valores directamente desde tu cuenta de Binance y actualízalos aquí cuando quieras.
                    Los datos se guardan localmente en tu navegador.
                  </p>
                  <p className="text-slate-400 text-xs">
                    Última actualización: {manualValues.lastUpdated ? new Date(manualValues.lastUpdated).toLocaleString('es-ES') : 'Nunca'}
                  </p>
                </div>
              </div>
            </div>

            {/* Resumen de Valores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <p className="text-slate-400 text-sm mb-2">Bots - Inversión</p>
                <p className="text-3xl font-bold text-blue-400">{formatCurrency(manualValues.botsInvestment)}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <p className="text-slate-400 text-sm mb-2">Bots - Ganancia</p>
                <p className={`text-3xl font-bold ${manualValues.botsProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(manualValues.botsProfit)}
                </p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <p className="text-slate-400 text-sm mb-2">Earn - Ganancia Total</p>
                <p className={`text-3xl font-bold ${manualValues.earnProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(manualValues.earnProfit)}
                </p>
              </div>
            </div>

            {/* Formulario de Edición */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Bot className="text-amber-400" />
                  {isEditingManual ? 'Editar Valores' : 'Actualizar Valores de Binance'}
                </h3>
                {!isEditingManual && (
                  <button
                    onClick={() => setIsEditingManual(true)}
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold px-6 py-2 rounded-lg hover:shadow-lg hover:shadow-amber-500/50 transition-all"
                  >
                    Editar
                  </button>
                )}
              </div>

              {isEditingManual ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-300 text-sm mb-2 block font-semibold">
                      Trading Bots - Inversión Total (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={tempManualValues.botsInvestment}
                      onChange={(e) => setTempManualValues({...tempManualValues, botsInvestment: parseFloat(e.target.value) || 0})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500 text-lg"
                      placeholder="0.00"
                    />
                    <p className="text-slate-500 text-xs mt-1">
                      💡 Binance → Trading Bots → Total Investment
                    </p>
                  </div>

                  <div>
                    <label className="text-slate-300 text-sm mb-2 block font-semibold">
                      Trading Bots - Ganancia Total (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={tempManualValues.botsProfit}
                      onChange={(e) => setTempManualValues({...tempManualValues, botsProfit: parseFloat(e.target.value) || 0})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500 text-lg"
                      placeholder="0.00"
                    />
                    <p className="text-slate-500 text-xs mt-1">
                      💡 Binance → Trading Bots → Total PnL
                    </p>
                  </div>

                  <div>
                    <label className="text-slate-300 text-sm mb-2 block font-semibold">
                      Earn - Ganancia Total Histórica (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={tempManualValues.earnProfit}
                      onChange={(e) => setTempManualValues({...tempManualValues, earnProfit: parseFloat(e.target.value) || 0})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500 text-lg"
                      placeholder="0.00"
                    />
                    <p className="text-slate-500 text-xs mt-1">
                      💡 Binance → Earn → History → Total Profit
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveManualValues}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 bg-slate-700 text-slate-200 font-bold px-6 py-3 rounded-lg hover:bg-slate-600 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-slate-500 text-sm mb-1">Bots - Inversión</p>
                      <p className="text-2xl font-bold text-slate-200">{formatCurrency(manualValues.botsInvestment)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm mb-1">Bots - Ganancia</p>
                      <p className={`text-2xl font-bold ${manualValues.botsProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(manualValues.botsProfit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm mb-1">Earn - Ganancia</p>
                      <p className={`text-2xl font-bold ${manualValues.earnProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(manualValues.earnProfit)}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs mt-4 text-center">
                    Haz click en "Editar" para actualizar estos valores
                  </p>
                </div>
              )}
            </div>

            {/* ROI Calculado */}
            {manualValues.botsInvestment > 0 && (
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur border border-amber-500/20 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-slate-300 mb-4">Rendimiento de Trading Bots</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">ROI</p>
                    <p className={`text-3xl font-bold ${((manualValues.botsProfit / manualValues.botsInvestment) * 100) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent((manualValues.botsProfit / manualValues.botsInvestment) * 100)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Valor Actual</p>
                    <p className="text-3xl font-bold text-amber-400">
                      {formatCurrency(manualValues.botsInvestment + manualValues.botsProfit)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Resumen Futuros */}
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur border border-slate-700 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="text-amber-400" />
                  Futuros
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Posiciones Abiertas</span>
                    <span className="font-bold text-amber-400">{data.futures.positions.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Saldo de la cuenta</span>
                    <span className="font-bold">{formatCurrency(data.futures.totalWalletBalance || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">PnL No Realizado</span>
                    <span className={`font-bold ${data.futures.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(data.futures.unrealizedPnL)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resumen Spot */}
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur border border-slate-700 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Wallet className="text-amber-400" />
                  Spot
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Activos</span>
                    <span className="font-bold text-amber-400">{data.spot.holdings.filter(h => h.amount > 0).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Valor Total</span>
                    <span className="font-bold">{formatCurrency(data.spot.totalValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Top Holding</span>
                    <span className="font-bold text-green-400">BTC</span>
                  </div>
                </div>
              </div>

              {/* Resumen Bots/Earn */}
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur border border-slate-700 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Bot className="text-amber-400" />
                  Trading Bots & Earn
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Bots - Inversión</span>
                    <span className="font-bold text-blue-400">{formatCurrency(manualValues.botsInvestment)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Bots - Ganancia</span>
                    <span className={`font-bold ${manualValues.botsProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(manualValues.botsProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Earn - Ganancia</span>
                    <span className={`font-bold ${manualValues.earnProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(manualValues.earnProfit)}
                    </span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs mt-3 text-center">
                  💡 Actualiza estos valores en la pestaña "Bots"
                </p>
              </div>
            </div>

            {/* Top/Bottom Performers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Winners */}
              <div className="bg-gradient-to-br from-green-900/20 to-slate-900/80 backdrop-blur border border-green-700/30 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400">
                  🏆 Top 3 Ganancias
                </h3>
                <div className="space-y-3">
                  {sortedHoldings
                    .filter(h => {
                      const pnl = data.spot.pnl.assets.find(p => p.asset === h.asset);
                      return pnl && pnl.pnlPercent > 0;
                    })
                    .slice(0, 3)
                    .map((holding, idx) => {
                      const pnl = data.spot.pnl.assets.find(p => p.asset === holding.asset);
                      return (
                        <div key={holding.asset} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-green-700/20 hover:border-green-500/40 transition-all">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                            <div>
                              <p className="font-bold text-slate-200">{holding.asset}</p>
                              <p className="text-xs text-slate-400">{formatCurrency(holding.valueUSD)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-400">{formatPercent(pnl.pnlPercent)}</p>
                            <p className="text-xs text-green-400">{formatCurrency(pnl.pnl)}</p>
                          </div>
                        </div>
                      );
                    })}
                  {sortedHoldings.filter(h => {
                    const pnl = data.spot.pnl.assets.find(p => p.asset === h.asset);
                    return pnl && pnl.pnlPercent > 0;
                  }).length === 0 && (
                    <p className="text-slate-400 text-center py-8 text-sm">No hay posiciones con ganancias</p>
                  )}
                </div>
              </div>

              {/* Top Losers */}
              <div className="bg-gradient-to-br from-red-900/20 to-slate-900/80 backdrop-blur border border-red-700/30 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-400">
                  📉 Top 3 Pérdidas
                </h3>
                <div className="space-y-3">
                  {sortedHoldings
                    .filter(h => {
                      const pnl = data.spot.pnl.assets.find(p => p.asset === h.asset);
                      return pnl && pnl.pnlPercent < 0;
                    })
                    .slice(-3)
                    .reverse()
                    .map((holding, idx) => {
                      const pnl = data.spot.pnl.assets.find(p => p.asset === holding.asset);
                      return (
                        <div key={holding.asset} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-red-700/20 hover:border-red-500/40 transition-all">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                              <p className="font-bold text-slate-200">{holding.asset}</p>
                              <p className="text-xs text-slate-400">{formatCurrency(holding.valueUSD)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-red-400">{formatPercent(pnl.pnlPercent)}</p>
                            <p className="text-xs text-red-400">{formatCurrency(pnl.pnl)}</p>
                          </div>
                        </div>
                      );
                    })}
                  {sortedHoldings.filter(h => {
                    const pnl = data.spot.pnl.assets.find(p => p.asset === h.asset);
                    return pnl && pnl.pnlPercent < 0;
                  }).length === 0 && (
                    <p className="text-green-400 text-center py-8 text-sm">¡No hay pérdidas! 🎉</p>
                  )}
                </div>
              </div>
            </div>

            {/* Análisis de Riesgo */}
            <div className="bg-gradient-to-br from-yellow-900/20 to-slate-900/80 backdrop-blur border border-yellow-700/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-yellow-400">
                ⚠️ Análisis de Riesgo
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Posiciones con pérdida >50% */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-red-700/30">
                  <p className="text-slate-400 text-sm mb-2">Pérdidas Críticas (&gt;50%)</p>
                  <p className="text-3xl font-bold text-red-400">
                    {sortedHoldings.filter(h => {
                      const pnl = data.spot.pnl.assets.find(p => p.asset === h.asset);
                      return pnl && pnl.pnlPercent < -50;
                    }).length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">posiciones</p>
                </div>

                {/* Concentración en top 3 */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-yellow-700/30">
                  <p className="text-slate-400 text-sm mb-2">Concentración Top 3</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    {(() => {
                      const top3Value = sortedHoldings.slice(0, 3).reduce((sum, h) => sum + h.valueUSD, 0);
                      const totalValue = data.spot.totalValue;
                      return totalValue > 0 ? `${((top3Value / totalValue) * 100).toFixed(0)}%` : '0%';
                    })()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">del portfolio</p>
                </div>

                {/* Posiciones en Futuros */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-amber-700/30">
                  <p className="text-slate-400 text-sm mb-2">Posiciones Futuros</p>
                  <p className="text-3xl font-bold text-amber-400">
                    {data.futures.positions.length}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {data.futures.positions.length > 0 ? 'con apalancamiento' : 'sin riesgo'}
                  </p>
                </div>
              </div>

              {/* Alertas de Riesgo */}
              {(() => {
                const criticalLosses = sortedHoldings.filter(h => {
                  const pnl = data.spot.pnl.assets.find(p => p.asset === h.asset);
                  return pnl && pnl.pnlPercent < -50;
                }).length;

                const top3Value = sortedHoldings.slice(0, 3).reduce((sum, h) => sum + h.valueUSD, 0);
                const concentration = data.spot.totalValue > 0 ? (top3Value / data.spot.totalValue) * 100 : 0;

                if (criticalLosses > 0 || concentration > 60 || data.futures.positions.length > 3) {
                  return (
                    <div className="mt-4 p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
                      <p className="text-red-400 font-semibold mb-2">🚨 Alertas de Riesgo:</p>
                      <ul className="text-sm text-slate-300 space-y-1">
                        {criticalLosses > 0 && (
                          <li>• {criticalLosses} posición(es) con pérdidas críticas. Considera cortar pérdidas o promediar.</li>
                        )}
                        {concentration > 60 && (
                          <li>• Alta concentración en pocas posiciones ({concentration.toFixed(0)}%). Considera diversificar.</li>
                        )}
                        {data.futures.positions.length > 3 && (
                          <li>• {data.futures.positions.length} posiciones en Futuros. Monitorea de cerca el apalancamiento.</li>
                        )}
                      </ul>
                    </div>
                  );
                }
                return (
                  <div className="mt-4 p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
                    <p className="text-green-400 font-semibold">✅ Portfolio con nivel de riesgo manejable</p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* CHART TAB */}
        {activeTab === 'chart' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Filtros de fecha */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="text-amber-400" />
                Evolución del Capital
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Fecha Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Fecha Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={fetchChartData}
                    disabled={chartLoading}
                    className={`w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold px-6 py-2 rounded-lg transition-all ${
                      chartLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:shadow-amber-500/50'
                    }`}
                  >
                    {chartLoading ? 'Cargando...' : 'Actualizar'}
                  </button>
                </div>
              </div>
            </div>

            {/* Resumen */}
            {chartData.summary && chartData.history && chartData.history.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                  <p className="text-slate-400 text-sm mb-2">Capital Inicial</p>
                  <p className="text-3xl font-bold text-blue-400">{formatCurrency(chartData.summary.startCapital)}</p>
                  <p className="text-slate-500 text-xs mt-1">{chartData.summary.startDate}</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                  <p className="text-slate-400 text-sm mb-2">Capital Final</p>
                  <p className="text-3xl font-bold text-amber-400">{formatCurrency(chartData.summary.endCapital)}</p>
                  <p className="text-slate-500 text-xs mt-1">{chartData.summary.endDate}</p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                  <p className="text-slate-400 text-sm mb-2">Cambio</p>
                  <p className={`text-3xl font-bold ${chartData.summary.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(chartData.summary.change)}
                  </p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                  <p className="text-slate-400 text-sm mb-2">ROI</p>
                  <p className={`text-3xl font-bold ${chartData.summary.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatPercent(chartData.summary.changePercent)}
                  </p>
                </div>
              </div>
            )}

            {/* Gráfica */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              {chartLoading ? (
                <div className="flex items-center justify-center h-96">
                  <RefreshCw className="animate-spin text-amber-400" size={48} />
                </div>
              ) : chartData.history && chartData.history.length > 0 ? (
                <div className="w-full h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.history} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8' }}
                      />
                      <YAxis 
                        stroke="#94a3b8"
                        tick={{ fill: '#94a3b8' }}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #475569',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#94a3b8' }}
                        formatter={(value) => [`$${value.toLocaleString()}`, 'Capital']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="capital" 
                        stroke="#fbbf24" 
                        strokeWidth={3}
                        dot={{ fill: '#fbbf24', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                  <BarChart3 size={64} className="mb-4 opacity-50" />
                  <p className="text-lg font-semibold">No hay datos para el período seleccionado</p>
                  <p className="text-sm mt-2">Intenta ajustar las fechas de inicio y fin</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* JOURNAL TAB */}
        {activeTab === 'journal' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header con botón para nueva entrada */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="text-amber-400" />
                Journal de Trading
              </h2>
              <button
                onClick={() => setShowJournalForm(!showJournalForm)}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold px-6 py-2 rounded-lg hover:shadow-lg hover:shadow-amber-500/50 transition-all flex items-center gap-2"
              >
                <PlusCircle size={20} />
                Nueva Entrada
              </button>
            </div>

            {/* Formulario para nueva entrada */}
            {showJournalForm && (
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold mb-4">Agregar Entrada al Journal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-slate-400 text-sm mb-2 block">Fecha</label>
                    <input
                      type="date"
                      value={newJournalEntry.date}
                      onChange={(e) => setNewJournalEntry({...newJournalEntry, date: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm mb-2 block">Activo</label>
                    <input
                      type="text"
                      placeholder="BTC, ETH, etc."
                      value={newJournalEntry.asset}
                      onChange={(e) => setNewJournalEntry({...newJournalEntry, asset: e.target.value.toUpperCase()})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm mb-2 block">Acción</label>
                    <select
                      value={newJournalEntry.action}
                      onChange={(e) => setNewJournalEntry({...newJournalEntry, action: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="buy">Compra</option>
                      <option value="sell">Venta</option>
                      <option value="hold">Hold/Observación</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm mb-2 block">Precio (opcional)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newJournalEntry.price}
                      onChange={(e) => setNewJournalEntry({...newJournalEntry, price: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-slate-400 text-sm mb-2 block">Notas / Razón de la Decisión</label>
                  <textarea
                    placeholder="¿Por qué hiciste este trade? ¿Qué aprendiste?"
                    value={newJournalEntry.notes}
                    onChange={(e) => setNewJournalEntry({...newJournalEntry, notes: e.target.value})}
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveJournalEntry}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded-lg transition-all"
                  >
                    Guardar Entrada
                  </button>
                  <button
                    onClick={() => setShowJournalForm(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold px-6 py-2 rounded-lg transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Lista de entradas del journal */}
            {journalEntries.length === 0 ? (
              <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-12 text-center">
                <BookOpen className="mx-auto mb-4 text-slate-500" size={64} />
                <h3 className="text-xl font-bold text-slate-300 mb-2">No hay entradas aún</h3>
                <p className="text-slate-400 mb-4">
                  Empieza a documentar tus decisiones de trading para aprender y mejorar
                </p>
                <button
                  onClick={() => setShowJournalForm(true)}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-bold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-amber-500/50 transition-all"
                >
                  Crear Primera Entrada
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {journalEntries.map((entry) => (
                  <div key={entry.id} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-amber-500/50 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          entry.action === 'buy' ? 'bg-green-500/20 text-green-400' :
                          entry.action === 'sell' ? 'bg-red-500/20 text-red-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {entry.action === 'buy' ? '📈 Compra' : entry.action === 'sell' ? '📉 Venta' : '👁️ Hold'}
                        </div>
                        <div>
                          <p className="font-bold text-lg">{entry.asset}</p>
                          {entry.price && (
                            <p className="text-sm text-slate-400">${entry.price}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm">{new Date(entry.timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <button
                          onClick={() => handleDeleteJournalEntry(entry.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-300 whitespace-pre-wrap">{entry.notes}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Configuración de Alertas */}
            <div className="bg-gradient-to-br from-orange-900/20 to-slate-900/80 backdrop-blur border border-orange-700/30 rounded-xl p-6 mt-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-400">
                🔔 Configuración de Alertas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Alerta de Caída de Precio (%)</label>
                  <input
                    type="number"
                    value={alerts.priceDropPercent}
                    onChange={(e) => {
                      const updated = {...alerts, priceDropPercent: parseFloat(e.target.value) || 5};
                      setAlerts(updated);
                      localStorage.setItem('binanceAlerts', JSON.stringify(updated));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Te alertará si un activo baja más de este %</p>
                </div>
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Pérdida Crítica (%)</label>
                  <input
                    type="number"
                    value={alerts.criticalLossPercent}
                    onChange={(e) => {
                      const updated = {...alerts, criticalLossPercent: parseFloat(e.target.value) || 50};
                      setAlerts(updated);
                      localStorage.setItem('binanceAlerts', JSON.stringify(updated));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Considera cortar pérdidas en este nivel</p>
                </div>
              </div>
              
              {/* Alertas Activas */}
              <div className="mt-6 p-4 bg-slate-900/50 border border-orange-700/20 rounded-lg">
                <p className="text-orange-400 font-semibold mb-2">🚨 Alertas Activas:</p>
                <div className="space-y-2">
                  {sortedHoldings
                    .filter(h => {
                      const pnl = data.spot.pnl.assets.find(p => p.asset === h.asset);
                      return pnl && pnl.pnlPercent < -alerts.criticalLossPercent;
                    })
                    .map(h => {
                      const pnl = data.spot.pnl.assets.find(p => p.asset === h.asset);
                      return (
                        <div key={h.asset} className="flex items-center justify-between p-2 bg-red-900/20 border border-red-700/30 rounded">
                          <span className="text-red-400">⚠️ {h.asset} con pérdida crítica</span>
                          <span className="font-bold text-red-400">{formatPercent(pnl.pnlPercent)}</span>
                        </div>
                      );
                    })}
                  {sortedHoldings.filter(h => {
                    const pnl = data.spot.pnl.assets.find(p => p.asset === h.asset);
                    return pnl && pnl.pnlPercent < -alerts.criticalLossPercent;
                  }).length === 0 && (
                    <p className="text-slate-400 text-sm">No hay alertas activas 👍</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        /* Optimizaciones para móvil */
        @media (max-width: 768px) {
          body {
            font-size: 14px;
          }
          
          h1 {
            font-size: 1.75rem !important;
          }
          
          h2 {
            font-size: 1.5rem !important;
          }
          
          h3 {
            font-size: 1.25rem !important;
          }
          
          /* Tabs más compactas en móvil */
          .flex.gap-2.bg-slate-900\/50 button {
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
          }
          
          /* Cards más compactas */
          .bg-slate-800\/50 {
            padding: 1rem !important;
          }
          
          /* Números más pequeños en móvil */
          .text-5xl {
            font-size: 2.5rem !important;
          }
          
          .text-3xl {
            font-size: 1.75rem !important;
          }
          
          .text-2xl {
            font-size: 1.25rem !important;
          }
          
          /* Grids a una columna en móvil */
          .grid.md\\:grid-cols-2,
          .grid.md\\:grid-cols-3,
          .grid.md\\:grid-cols-4 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
