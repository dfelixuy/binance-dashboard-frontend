# 🔄 Comparativa: Windows IIS vs Mac

## Resumen Ejecutivo

| Aspecto | Windows IIS | Mac |
|---------|-------------|-----|
| **Complejidad** | Media-Alta | Baja |
| **Pasos de instalación** | ~10 pasos | ~3 pasos |
| **Tiempo setup** | 15-30 min | 5 min |
| **Servidor recomendado** | IIS | Nginx / Apache / npm dev |
| **Mejor para** | Servidores Windows empresariales | Desarrollo local, servidores Linux/Mac |

---

## 🎯 Método Más Rápido por Plataforma

### Windows IIS
```bash
# Requiere estos pasos críticos:
1. Instalar Node.js
2. Compilar: npm install && npm run build
3. Instalar URL Rewrite Module ⚠️
4. Configurar sitio en IIS
5. Configurar permisos (IIS_IUSRS)
6. Copiar web.config a dist/
```

### Mac (Desarrollo)
```bash
# ¡Solo esto!
npm install
npm run dev
# Abre http://localhost:5173
```

### Mac (Producción con Nginx)
```bash
# Pasos:
brew install nginx
npm run build
# Configurar nginx (ver nginx-mac.conf)
brew services start nginx
```

---

## 📊 Comparación Detallada

### 1. Instalación de Dependencias

**Windows IIS:**
- ✅ Node.js (descarga manual)
- ✅ URL Rewrite Module (descarga manual) ⚠️
- ✅ IIS (activar en Windows Features)
- ⏱️ Tiempo: ~15 min

**Mac:**
- ✅ Node.js: `brew install node`
- ✅ Nginx (opcional): `brew install nginx`
- ⏱️ Tiempo: ~5 min

### 2. Configuración del Servidor

**Windows IIS:**
```
1. Abrir IIS Manager
2. Crear nuevo sitio
3. Configurar ruta física → carpeta dist/
4. Asignar puerto
5. Configurar Application Pool
6. Agregar permisos a IIS_IUSRS y IUSR
7. Verificar web.config está en dist/
8. Reiniciar sitio
```

**Mac (Nginx):**
```
1. Editar /opt/homebrew/etc/nginx/nginx.conf
2. Agregar bloque server { ... }
3. brew services start nginx
```

**Mac (Desarrollo - ¡Más simple!):**
```
npm run dev
```

### 3. Archivos de Configuración Necesarios

**Windows IIS:**
- ✅ `web.config` (crítico - sin esto no funciona el routing)
- ✅ Permisos en carpeta física
- ✅ Application Pool configurado

**Mac:**
- ✅ `nginx.conf` (solo para producción con Nginx)
- ❌ No necesitas nada para modo desarrollo
- ❌ No hay complejidad de permisos

### 4. Manejo de Rutas (SPA Routing)

**Windows IIS:**
```xml
<!-- web.config requerido -->
<rewrite>
  <rules>
    <rule name="React Routes">
      <!-- Configuración URL Rewrite -->
    </rule>
  </rules>
</rewrite>
```

**Mac (Nginx):**
```nginx
# nginx.conf
location / {
    try_files $uri $uri/ /index.html;
}
```

**Mac (Dev Server):**
```
# Vite maneja esto automáticamente
# No necesitas configurar nada
```

### 5. Logs y Debugging

**Windows IIS:**
```
Ubicación: Event Viewer → Windows Logs → Application
También: Carpeta de logs del sitio IIS
```

**Mac (Nginx):**
```bash
# Ver logs
tail -f /opt/homebrew/var/log/nginx/error.log
tail -f /opt/homebrew/var/log/nginx/access.log
```

**Mac (Dev):**
```
# Los logs aparecen directamente en la terminal
# Mucho más conveniente para desarrollo
```

### 6. Comandos Comunes

**Windows IIS:**
```powershell
# Reiniciar IIS
iisreset

# Ver estado
Get-Website

# Iniciar/detener sitio
Start-Website -Name "BinanceDashboard"
Stop-Website -Name "BinanceDashboard"
```

**Mac (Nginx):**
```bash
# Iniciar
brew services start nginx

# Reiniciar
brew services restart nginx

# Detener
brew services stop nginx

# Verificar config
nginx -t
```

**Mac (Dev):**
```bash
# Iniciar
npm run dev

# Detener
Ctrl + C
```

---

## 🎯 Recomendaciones por Caso de Uso

### Para Desarrollo Local
**🏆 GANADOR: Mac con `npm run dev`**
- Más rápido de configurar
- Hot reload incluido
- Menos pasos
- Más fácil de debuggear

### Para Servidor Empresarial Windows
**🏆 GANADOR: Windows IIS**
- Integración nativa con Windows Server
- Mejor soporte empresarial
- Familiaridad del equipo IT
- Herramientas de administración visual

### Para Servidor Linux/Mac en Producción
**🏆 GANADOR: Mac/Linux con Nginx**
- Mejor rendimiento
- Menor uso de recursos
- Más flexible
- Open source

### Para Pruebas Rápidas
**🏆 GANADOR: Mac con `npm run dev` o `serve`**
- Listo en 30 segundos
- Sin configuración compleja
- Perfecto para demos

---

## 💡 Tips y Trucos

### Windows IIS
```
✅ SIEMPRE instala URL Rewrite Module primero
✅ Verifica permisos de IIS_IUSRS
✅ Usa Application Pool dedicado
✅ Monitorea uso de memoria del pool
⚠️ web.config DEBE estar en carpeta dist/
```

### Mac
```
✅ Usa Homebrew para gestionar todo
✅ En desarrollo, siempre usa npm run dev
✅ Para producción simple, usa 'serve'
✅ Para producción seria, usa Nginx
⚠️ Recuerda cambiar rutas en nginx.conf
```

---

## 🐛 Problemas Comunes

### Windows IIS

| Problema | Solución |
|----------|----------|
| 404 al navegar | Instalar URL Rewrite Module |
| 500 Internal Error | Revisar web.config, ver Event Viewer |
| Permisos denegados | Agregar IIS_IUSRS con lectura |
| Página en blanco | Verificar consola del navegador (F12) |

### Mac

| Problema | Solución |
|----------|----------|
| Puerto en uso | `lsof -i :5173` y `kill -9 PID` |
| Node no encontrado | Verificar PATH o reinstalar |
| Permission denied | `chmod +x` o `sudo chown` |
| Nginx no inicia | `nginx -t` para ver errores |

---

## 🚀 Quick Start por Plataforma

### Windows IIS (Pasos mínimos)
```bash
1. npm install
2. npm run build
3. Instalar URL Rewrite Module
4. Crear sitio IIS → apuntar a /dist
5. Dar permisos a IIS_IUSRS
```

### Mac Desarrollo (Súper rápido)
```bash
npm install && npm run dev
```

### Mac Producción con Nginx
```bash
brew install nginx
npm run build
# Editar /opt/homebrew/etc/nginx/nginx.conf
brew services start nginx
```

### Mac Producción Simple
```bash
npm install -g serve
npm run build
serve -s dist -l 8080
```

---

## 📈 Performance

| Métrica | Windows IIS | Mac (Nginx) | Mac (Dev) |
|---------|-------------|-------------|-----------|
| **Build time** | ~30s | ~30s | N/A |
| **Start time** | ~5s | ~1s | ~2s |
| **Hot reload** | ❌ | ❌ | ✅ |
| **Memory** | ~100MB | ~10MB | ~150MB |
| **CPU idle** | Bajo | Muy bajo | Medio |

---

## 🎓 Conclusión

**Para aprender/desarrollar:**
- Mac es más amigable y rápido

**Para producción empresarial Windows:**
- IIS es la opción estándar

**Para producción Linux/Mac:**
- Nginx es más eficiente

**Lo mejor de ambos mundos:**
- Desarrolla en Mac (`npm run dev`)
- Despliega en tu servidor de producción (IIS/Nginx según OS)

---

**Recomendación Final:** Si tienes ambos sistemas disponibles, desarrolla en Mac por velocidad y despliega en el servidor que uses en producción (Windows Server → IIS, Linux/Mac → Nginx).
