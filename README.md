# Binance Dashboard - Guía de Instalación en Windows IIS

Este proyecto es un dashboard para visualizar tu cuenta de Binance incluyendo Futuros, Spot y Bots de trading.

## 📋 Requisitos Previos

1. **Node.js** (versión 16 o superior)
   - Descargar desde: https://nodejs.org/
   - Verificar instalación: `node --version` y `npm --version`

2. **Windows Server con IIS instalado**
   - IIS 7.5 o superior
   - URL Rewrite Module instalado (muy importante)
   - Descargar desde: https://www.iis.net/downloads/microsoft/url-rewrite

## 🚀 Pasos de Instalación

### 1. Preparar el Proyecto

```bash
# Navegar a la carpeta del proyecto
cd binance-dashboard-iis

# Instalar dependencias
npm install

# Compilar el proyecto para producción
npm run build
```

Esto generará una carpeta `dist/` con todos los archivos estáticos listos para producción.

### 2. Configurar IIS

#### Opción A: Sitio Web Nuevo

1. Abrir **IIS Manager** (Administrador de IIS)
2. Click derecho en **Sites** → **Add Website**
3. Configurar:
   - **Site name**: BinanceDashboard
   - **Physical path**: Ruta a la carpeta `dist` (ejemplo: `C:\inetpub\wwwroot\binance-dashboard\dist`)
   - **Port**: 80 (o el que prefieras)
   - **Host name**: (opcional) dashboard.tudominio.com
4. Click **OK**

#### Opción B: Aplicación en Sitio Existente

1. Abrir **IIS Manager**
2. Expandir **Sites** → Click derecho en tu sitio → **Add Application**
3. Configurar:
   - **Alias**: binance
   - **Physical path**: Ruta a la carpeta `dist`
4. Click **OK**

### 3. Copiar web.config

El archivo `web.config` ya está incluido en el proyecto y se copiará automáticamente a la carpeta `dist` durante el build. Este archivo es crucial para que funcione el routing de React en IIS.

### 4. Verificar URL Rewrite Module

**MUY IMPORTANTE**: IIS necesita el módulo URL Rewrite para que funcione correctamente.

1. En IIS Manager, selecciona tu sitio
2. Busca el ícono **URL Rewrite**
3. Si no aparece, descarga e instala desde: https://www.iis.net/downloads/microsoft/url-rewrite
4. Reinicia IIS después de instalarlo

### 5. Configurar Permisos

1. Click derecho en la carpeta `dist` → **Properties** → **Security**
2. Asegúrate de que **IIS_IUSRS** y **IUSR** tienen permisos de lectura
3. Click **Edit** → **Add** → Agregar usuarios si es necesario
4. Aplicar cambios

### 6. Probar la Aplicación

1. Abre un navegador
2. Navega a: `http://localhost` (o el puerto/dominio configurado)
3. Deberías ver el dashboard de Binance

## 🔧 Comandos Útiles

```bash
# Desarrollo local (con hot-reload)
npm run dev

# Compilar para producción
npm run build

# Vista previa del build de producción
npm run preview
```

## 📁 Estructura del Proyecto

```
binance-dashboard-iis/
├── dist/              # Archivos compilados (generado por npm run build)
├── src/
│   ├── App.jsx        # Componente principal del dashboard
│   ├── main.jsx       # Punto de entrada
│   └── index.css      # Estilos globales con Tailwind
├── public/            # Archivos estáticos
├── index.html         # HTML principal
├── package.json       # Dependencias
├── vite.config.js     # Configuración de Vite
├── tailwind.config.js # Configuración de Tailwind
└── web.config         # Configuración de IIS
```

## 🔐 Próximos Pasos: Integración con Binance API

Actualmente el dashboard muestra **datos simulados**. Para conectar con datos reales:

1. **Crear API Keys en Binance**:
   - Ve a tu cuenta de Binance → API Management
   - Crea una nueva API Key
   - **IMPORTANTE**: Solo activa permisos de LECTURA (read-only) por seguridad
   - Guarda tu API Key y Secret Key de forma segura

2. **Implementar Backend Seguro**:
   - **NO expongas tus API keys en el frontend**
   - Crea un backend (Node.js/Express, ASP.NET, etc.) que:
     - Almacene las API keys de forma segura
     - Haga las llamadas a la API de Binance
     - Exponga endpoints REST para tu frontend
   
3. **Librerías Recomendadas**:
   - Para Node.js: `binance-api-node` o `ccxt`
   - Documentación oficial: https://binance-docs.github.io/apidocs/

## ⚠️ Consideraciones de Seguridad

- **NUNCA** guardes API keys en el código del frontend
- Usa HTTPS en producción
- Implementa autenticación para acceder al dashboard
- Considera usar variables de entorno para configuración sensible
- Los API keys deben tener solo permisos de lectura

## 🐛 Solución de Problemas

### Error 404 al navegar
- Verifica que URL Rewrite Module esté instalado
- Revisa que web.config esté en la carpeta dist
- Reinicia IIS

### Página en blanco
- Abre la consola del navegador (F12) para ver errores
- Verifica que todas las dependencias se instalaron: `npm install`
- Recompila el proyecto: `npm run build`

### Problemas de permisos
- Verifica que IIS_IUSRS tenga permisos de lectura en la carpeta dist
- Ejecuta IIS Manager como administrador

## 📞 Soporte

Si encuentras problemas, verifica:
1. Versión de Node.js: `node --version`
2. Logs de IIS en Event Viewer
3. Consola del navegador (F12) para errores JavaScript

## 📝 Notas Adicionales

- El dashboard es totalmente responsive y funciona en móviles
- Los datos se actualizan cada 5 segundos (simulado)
- Para personalizar colores/estilos, edita `src/App.jsx`
- Para cambiar el favicon, reemplaza el archivo en la carpeta `public/`

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2026
