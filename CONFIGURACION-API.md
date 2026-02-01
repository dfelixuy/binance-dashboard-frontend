# 🔐 Guía de Configuración - API de Binance

## 📝 Paso 1: Obtener API Keys de Binance

### 1.1 Acceder a Binance
1. Ve a https://www.binance.com
2. Inicia sesión en tu cuenta
3. Ve a tu perfil → **API Management**

### 1.2 Crear Nueva API Key
1. Click en **Create API**
2. Nombre sugerido: "Dashboard Read Only"
3. **MUY IMPORTANTE**: Configura los siguientes permisos:

   ✅ **Enable Reading** (Habilitar Lectura)
   ❌ **Enable Spot & Margin Trading** (DESACTIVADO)
   ❌ **Enable Futures** (DESACTIVADO - solo lectura está bien)
   ❌ **Enable Withdrawals** (DESACTIVADO por seguridad)

4. Completa la verificación 2FA
5. **GUARDA** tu API Key y Secret Key inmediatamente
   - ⚠️ El Secret solo se muestra UNA VEZ
   - Copia ambos a un lugar seguro

### 1.3 Restricciones de IP (Opcional pero Recomendado)
1. En la configuración de tu API Key
2. Click en "Restrict access to trusted IPs only"
3. Agrega tu IP pública (puedes obtenerla en https://ifconfig.me)
4. Esto previene que alguien use tu API Key desde otra ubicación

---

## 🚀 Paso 2: Configurar el Backend

### 2.1 Crear archivo de configuración

```bash
# Navegar a la carpeta del backend
cd binance-dashboard-iis/backend

# Copiar el archivo de ejemplo
cp .env.example .env

# Editar el archivo .env
nano .env   # O usa tu editor favorito (code .env, vim .env, etc.)
```

### 2.2 Completar el archivo .env

Edita el archivo `.env` con tus datos:

```bash
# Tu API Key de Binance (la que copiaste en el paso 1)
BINANCE_API_KEY=tu_api_key_real_aqui

# Tu API Secret de Binance (la que copiaste en el paso 1)
BINANCE_API_SECRET=tu_secret_key_real_aqui

# Puerto del servidor backend (no cambiar a menos que 3001 esté ocupado)
PORT=3001

# Usar Testnet (true) o Producción (false)
# Recomendado: empezar con false si solo vas a LEER datos
USE_TESTNET=false

# URLs de API (no cambiar)
BINANCE_API_URL=https://api.binance.com
BINANCE_FUTURES_URL=https://fapi.binance.com

# Cache en segundos (evita hacer demasiadas peticiones)
CACHE_TTL=10
```

**Ejemplo real:**
```bash
BINANCE_API_KEY=AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
BINANCE_API_SECRET=XyZ9876543210AbCdEfGhIjKlMnOpQrSt
PORT=3001
USE_TESTNET=false
BINANCE_API_URL=https://api.binance.com
BINANCE_FUTURES_URL=https://fapi.binance.com
CACHE_TTL=10
```

### 2.3 Guardar y Verificar

```bash
# Guardar el archivo
# En nano: Ctrl+O, Enter, Ctrl+X
# En vim: Esc, :wq, Enter

# Verificar que el archivo existe
ls -la .env

# ⚠️ NUNCA subas este archivo a Git
# Ya está en .gitignore por seguridad
```

---

## 🏃 Paso 3: Instalar y Ejecutar

### 3.1 Instalar Dependencias del Backend

```bash
# Asegúrate de estar en la carpeta backend
cd binance-dashboard-iis/backend

# Instalar dependencias
npm install
```

### 3.2 Iniciar el Backend

```bash
# Opción 1: Modo normal
npm start

# Opción 2: Modo desarrollo (con auto-reload)
npm run dev
```

Deberías ver algo como:
```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Binance Dashboard Backend                            ║
║                                                            ║
║   Servidor corriendo en: http://localhost:3001            ║
║   Health check: http://localhost:3001/api/health          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### 3.3 Verificar Conexión con Binance

Abre otra terminal y prueba:

```bash
# Verificar que el backend responde
curl http://localhost:3001/api/health

# Debería responder:
# {"status":"OK","message":"Binance Dashboard Backend running","timestamp":"..."}
```

---

## 🖥️ Paso 4: Iniciar el Frontend

### 4.1 Abrir Nueva Terminal

Deja el backend corriendo y abre una nueva terminal.

### 4.2 Iniciar Frontend

```bash
# Volver a la carpeta principal
cd binance-dashboard-iis

# Iniciar frontend (si no está corriendo ya)
npm run dev
```

### 4.3 Verificar Todo Funciona

1. Abre tu navegador en `http://localhost:5173`
2. Deberías ver el indicador "Conectado" en verde
3. Los datos deberían cargar desde tu cuenta real de Binance
4. Click en "Actualizar" para refrescar datos manualmente

---

## 📊 Paso 5: Verificar Datos

### 5.1 Probar Endpoints Individualmente

```bash
# Obtener balance de Spot
curl http://localhost:3001/api/spot/balance

# Obtener posiciones de Futuros
curl http://localhost:3001/api/futures/positions

# Obtener bots (datos de ejemplo por ahora)
curl http://localhost:3001/api/bots

# Obtener precios de mercado
curl http://localhost:3001/api/prices
```

### 5.2 Revisar Logs del Backend

En la terminal donde está corriendo el backend, verás logs de:
- Peticiones recibidas
- Errores (si los hay)
- Cache hits/misses

---

## 🔧 Solución de Problemas

### Problema 1: "Backend no disponible"
**Solución:**
```bash
# Verificar que el backend está corriendo
lsof -i :3001

# Si no hay nada, iniciar backend:
cd backend && npm start
```

### Problema 2: "API key inválida" o errores 401
**Solución:**
1. Verifica que copiaste bien las keys en `.env`
2. Sin espacios extras
3. Sin comillas
4. Verifica que la API key tiene permisos de lectura habilitados

### Problema 3: "CORS error"
**Solución:**
Ya está configurado en `server.js`, pero verifica que:
- Backend esté en puerto 3001
- Frontend esté en puerto 5173
- Ambos estén corriendo

### Problema 4: Datos no aparecen
**Solución:**
1. Abre DevTools (F12) en el navegador
2. Ve a la pestaña "Console"
3. Busca errores en rojo
4. Ve a "Network" y verifica que las peticiones a `localhost:3001` se completen

### Problema 5: "Cannot find module 'binance-api-node'"
**Solución:**
```bash
cd backend
npm install
```

---

## 🔐 Mejores Prácticas de Seguridad

### ✅ HACER:
- Usa API keys con permisos de SOLO LECTURA
- Activa restricciones de IP si es posible
- Mantén el archivo `.env` en `.gitignore`
- Usa 2FA en tu cuenta de Binance
- Revisa regularmente las API keys activas
- Elimina API keys que no uses

### ❌ NO HACER:
- NO subas `.env` a Git/GitHub
- NO compartas tus API keys con nadie
- NO uses permisos de trading/withdrawal si solo necesitas leer
- NO hardcodees las keys en el código
- NO expongas el backend a internet sin autenticación adicional

---

## 📝 Estructura Final de Archivos

```
binance-dashboard-iis/
├── backend/
│   ├── .env              ← TUS API KEYS (NO SUBIR A GIT)
│   ├── .env.example      ← Plantilla
│   ├── .gitignore        ← Protege .env
│   ├── server.js         ← Servidor backend
│   ├── package.json
│   └── node_modules/
├── src/
│   ├── App.jsx           ← Dashboard actualizado
│   ├── main.jsx
│   └── index.css
├── package.json
└── ...otros archivos
```

---

## 🎯 Checklist Final

Antes de usar el dashboard, verifica:

- [ ] Tengo mis API keys de Binance
- [ ] Las API keys tienen permisos de lectura habilitados
- [ ] He creado el archivo `.env` en backend/
- [ ] He copiado mis keys al archivo `.env`
- [ ] He instalado dependencias: `npm install` en backend/
- [ ] El backend está corriendo en `http://localhost:3001`
- [ ] El frontend está corriendo en `http://localhost:5173`
- [ ] Veo "Conectado" en verde en el dashboard
- [ ] Los datos cargan correctamente

---

## 🆘 Necesitas Ayuda?

Si algo no funciona:

1. **Revisa los logs** del backend en la terminal
2. **Revisa la consola** del navegador (F12 → Console)
3. **Verifica las peticiones** en Network tab del navegador
4. **Prueba los endpoints** individualmente con `curl`

---

## 🚀 Próximos Pasos (Opcional)

Una vez que todo funcione:

1. **Personalizar** el dashboard (colores, métricas, etc.)
2. **Agregar autenticación** para proteger el acceso
3. **Configurar HTTPS** para producción
4. **Desplegar** en un servidor (AWS, DigitalOcean, etc.)
5. **Integrar bots** reales (3Commas, Pionex, etc.)

---

**¡Listo!** Ahora tienes un dashboard conectado a tu cuenta real de Binance 🎉
