# 🚀 Guía Rápida de Despliegue en IIS

## Pasos Rápidos (5 minutos)

### 1️⃣ Instalar Node.js
- Descargar: https://nodejs.org/
- Instalar versión LTS (recomendada)

### 2️⃣ Compilar el Proyecto
```bash
cd binance-dashboard-iis
npm install
npm run build
```

### 3️⃣ Instalar URL Rewrite en IIS
- **¡MUY IMPORTANTE!** Sin esto no funcionará
- Descargar: https://www.iis.net/downloads/microsoft/url-rewrite
- Instalar y reiniciar IIS

### 4️⃣ Configurar IIS
1. Abrir **Administrador de IIS**
2. Click derecho en **Sites** → **Agregar sitio web**
3. Configurar:
   ```
   Nombre del sitio: BinanceDashboard
   Ruta física: C:\ruta\a\binance-dashboard-iis\dist
   Puerto: 80
   ```
4. Aceptar

### 5️⃣ Configurar Permisos
1. Click derecho en carpeta `dist` → Propiedades → Seguridad
2. Agregar permisos de LECTURA para:
   - IIS_IUSRS
   - IUSR

### 6️⃣ ¡Listo!
Abrir navegador: `http://localhost`

---

## ⚠️ Problemas Comunes

### "Página no encontrada" al navegar
**Solución**: Instalar URL Rewrite Module

### Página en blanco
**Solución**: 
1. Abrir consola del navegador (F12)
2. Ver qué error aparece
3. Verificar que se ejecutó `npm run build`

### Error de permisos
**Solución**: Agregar IIS_IUSRS y IUSR con permisos de lectura

---

## 📊 Características del Dashboard

✅ Vista de **Futuros** con posiciones abiertas  
✅ Vista de **Spot** con tus holdings  
✅ Vista de **Bots** con rendimiento  
✅ Responsive (funciona en móvil)  
✅ Actualización automática cada 5 seg  
✅ Diseño moderno y profesional  

## 🔜 Próximo Paso: Conectar API Real

Actualmente muestra datos de ejemplo. Para conectar con Binance:

1. Crea API Keys en Binance (SOLO lectura)
2. Implementa un backend seguro (Node.js/ASP.NET)
3. Nunca expongas las API keys en el frontend

Ver **README.md** para instrucciones completas.
