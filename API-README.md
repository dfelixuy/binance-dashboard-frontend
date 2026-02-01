# 🔌 API Real de Binance - README

## 🎯 ¿Qué incluye esta actualización?

Este proyecto ahora incluye integración completa con la API real de Binance:

### ✅ Backend Seguro (Node.js + Express)
- 🔐 Manejo seguro de API keys (nunca expuestas al frontend)
- 📊 Endpoints para Spot, Futuros y datos de mercado
- ⚡ Sistema de cache para optimizar peticiones
- 🛡️ CORS configurado para desarrollo local

### ✅ Frontend Actualizado
- 🔄 Conexión en tiempo real con tu cuenta de Binance
- 📡 Indicador de estado de conexión
- 🔃 Actualización automática cada 10 segundos
- 🎨 Interfaz que muestra datos reales

---

## 🚀 Inicio Rápido (3 pasos)

### 1️⃣ Configurar API Keys

```bash
cd backend
cp .env.example .env
nano .env  # O tu editor favorito
```

Completa con tus datos:
```bash
BINANCE_API_KEY=tu_api_key_aqui
BINANCE_API_SECRET=tu_secret_aqui
```

### 2️⃣ Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend (volver a carpeta principal)
cd ..
npm install
```

### 3️⃣ Ejecutar

**Opción A: Todo junto (recomendado)**
```bash
./start-all.sh
```

**Opción B: Manual (dos terminales)**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
npm run dev
```

---

## 📚 Documentación

- **[CONFIGURACION-API.md](CONFIGURACION-API.md)** - Guía paso a paso completa
- **[GUIA-MAC.md](GUIA-MAC.md)** - Instrucciones específicas para Mac
- **[README.md](README.md)** - Documentación general del proyecto

---

## 🔍 Endpoints Disponibles

El backend expone los siguientes endpoints:

### General
- `GET /api/health` - Verificar estado del servidor
- `GET /api/account` - Información general de cuenta

### Spot
- `GET /api/spot/balance` - Balance y holdings de Spot

### Futuros
- `GET /api/futures/positions` - Posiciones abiertas en Futuros

### Trading Bots
- `GET /api/bots` - Información de bots (simulado por ahora)

### Mercado
- `GET /api/prices` - Todos los precios del mercado
- `GET /api/ticker/:symbol` - Estadísticas 24h de un símbolo específico

---

## 🏗️ Arquitectura

```
Frontend (React)          Backend (Express)          Binance API
    │                          │                          │
    ├──── HTTP Request ────────>│                          │
    │                          ├──── API Call ──────────> │
    │                          │<──── Response ───────────┤
    │<──── JSON Response ───────┤                          │
    │                          │                          │
```

**Flujo de datos:**
1. Frontend hace petición a `localhost:3001/api/*`
2. Backend recibe, verifica cache
3. Si no hay cache, llama a Binance API con tus keys
4. Procesa y formatea la respuesta
5. Devuelve JSON al frontend
6. Frontend actualiza la UI

---

## 🔐 Seguridad

### ✅ Implementado
- API keys almacenadas en `.env` (no versionado)
- Keys NUNCA expuestas al navegador
- Permisos recomendados: solo lectura
- CORS configurado para localhost
- Cache para limitar peticiones a Binance

### 🔜 Para Producción (TODO)
- [ ] Autenticación de usuario
- [ ] Rate limiting
- [ ] HTTPS obligatorio
- [ ] Restricciones de IP en Binance
- [ ] Logs de auditoría
- [ ] Variables de entorno seguras en servidor

---

## 📊 Datos Disponibles

### Spot
- ✅ Balance por activo
- ✅ Valor en USD de cada holding
- ✅ Cambio porcentual 24h
- ✅ Total disponible y bloqueado

### Futuros
- ✅ Posiciones abiertas (LONG/SHORT)
- ✅ Precio de entrada y mark price
- ✅ PnL no realizado
- ✅ Apalancamiento
- ✅ Margen usado y disponible

### Bots
- ⚠️ Actualmente datos simulados
- 🔜 Requiere integración con plataforma de bots

---

## 🔧 Personalización

### Cambiar intervalo de actualización

En `src/App.jsx`, línea ~80:
```javascript
const interval = setInterval(fetchData, 10000); // 10 segundos
```

Cambia `10000` a los milisegundos que prefieras:
- 5 segundos: `5000`
- 30 segundos: `30000`
- 1 minuto: `60000`

### Cambiar tiempo de cache del backend

En `backend/.env`:
```bash
CACHE_TTL=10  # Segundos
```

### Agregar nuevos endpoints

1. Edita `backend/server.js`
2. Agrega tu nuevo endpoint
3. Usa la librería `binance-api-node` para obtener datos
4. Actualiza el frontend para consumirlo

---

## ⚠️ Limitaciones Conocidas

1. **Rate Limits de Binance**
   - Binance tiene límites de peticiones por minuto
   - El cache ayuda a mitigar esto
   - No hagas peticiones muy frecuentes

2. **Trading Bots**
   - Los datos de bots son simulados
   - Requiere integración adicional con plataformas de terceros
   - O implementar tracking propio

3. **Websockets**
   - Actualmente usa HTTP polling
   - Para datos realmente en tiempo real, considera websockets

---

## 🐛 Problemas Comunes

### "Backend no disponible"
```bash
# Verificar que está corriendo
curl http://localhost:3001/api/health

# Si no responde, iniciar backend
cd backend && npm start
```

### "Invalid API key"
1. Verifica que copiaste bien las keys en `.env`
2. Sin espacios antes/después
3. Sin comillas alrededor de las keys
4. Verifica que la API key está activa en Binance

### "CORS error"
Ya está configurado, pero verifica:
- Backend en puerto 3001
- Frontend en puerto 5173

### No aparecen datos
1. Abre DevTools (F12)
2. Ve a Console para ver errores
3. Ve a Network para ver las peticiones
4. Verifica logs del backend

---

## 📈 Próximas Mejoras

- [ ] Websockets para datos en tiempo real
- [ ] Gráficos de precio con Recharts
- [ ] Historial de trades
- [ ] Alertas de precio
- [ ] Integración con bots reales
- [ ] Modo oscuro/claro
- [ ] Exportar datos a CSV
- [ ] Notificaciones push

---

## 🤝 Contribuir

Si quieres agregar funcionalidades:

1. Las APIs de Binance están documentadas en: https://binance-docs.github.io/apidocs/
2. La librería `binance-api-node` tiene muchos más métodos disponibles
3. El frontend puede mostrar cualquier dato que el backend proporcione

---

## 📞 Soporte

Si tienes problemas:
1. Lee [CONFIGURACION-API.md](CONFIGURACION-API.md)
2. Verifica los logs del backend
3. Revisa la consola del navegador
4. Asegúrate de tener permisos de lectura en la API key

---

**¡Disfruta tu dashboard conectado a Binance! 🎉**
