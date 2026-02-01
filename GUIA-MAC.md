# 🍎 Binance Dashboard - Guía para Mac

## 🚀 Instalación y Ejecución en Mac

### Opción 1: Desarrollo Local (Recomendado para empezar)

#### 1️⃣ Instalar Node.js (si no lo tienes)

**Con Homebrew (recomendado):**
```bash
# Instalar Homebrew si no lo tienes
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Node.js
brew install node
```

**O descarga directamente:**
- https://nodejs.org/ (descarga la versión LTS)

**Verificar instalación:**
```bash
node --version
npm --version
```

#### 2️⃣ Preparar el Proyecto

```bash
# Descomprimir el archivo (si está comprimido)
tar -xzf binance-dashboard-iis.tar.gz
cd binance-dashboard-iis

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

¡Eso es todo! La aplicación se abrirá en `http://localhost:5173`

El modo desarrollo incluye:
- ✅ Hot reload (cambios en vivo)
- ✅ No necesitas compilar cada vez
- ✅ Perfecto para desarrollo y pruebas

---

### Opción 2: Compilar para Producción

```bash
# Compilar el proyecto
npm run build

# Previsualizar el build de producción
npm run preview
```

Esto generará una carpeta `dist/` con todos los archivos optimizados.

---

### Opción 3: Servidor Web en Mac (Producción)

#### A) Usando Nginx (Recomendado)

**1. Instalar Nginx:**
```bash
brew install nginx
```

**2. Compilar el proyecto:**
```bash
npm run build
```

**3. Configurar Nginx:**
```bash
# Editar configuración
sudo nano /opt/homebrew/etc/nginx/nginx.conf
```

Agregar este bloque dentro de `http { ... }`:
```nginx
server {
    listen 8080;
    server_name localhost;
    root /ruta/a/binance-dashboard-iis/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**4. Iniciar Nginx:**
```bash
# Iniciar Nginx
brew services start nginx

# O reiniciar si ya está corriendo
brew services restart nginx
```

**5. Acceder:**
Abre `http://localhost:8080`

**Comandos útiles de Nginx:**
```bash
# Detener Nginx
brew services stop nginx

# Ver logs
tail -f /opt/homebrew/var/log/nginx/error.log

# Verificar configuración
nginx -t
```

#### B) Usando Apache (si ya lo tienes)

**1. Compilar el proyecto:**
```bash
npm run build
```

**2. Copiar archivos:**
```bash
# Apache en Mac suele estar en /Library/WebServer/Documents
sudo cp -r dist/* /Library/WebServer/Documents/binance-dashboard/
```

**3. Crear .htaccess:**
```bash
sudo nano /Library/WebServer/Documents/binance-dashboard/.htaccess
```

Contenido:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /binance-dashboard/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /binance-dashboard/index.html [L]
</IfModule>
```

**4. Iniciar Apache:**
```bash
sudo apachectl start
# O reiniciar
sudo apachectl restart
```

**5. Acceder:**
`http://localhost/binance-dashboard`

#### C) Usando el servidor integrado de Python (Solo para pruebas)

```bash
# Compilar primero
npm run build

# Ir a la carpeta dist
cd dist

# Python 3
python3 -m http.server 8080

# O Python 2
python -m SimpleHTTPServer 8080
```

**Nota:** Python SimpleHTTPServer no maneja bien el routing de React, úsalo solo para pruebas rápidas.

#### D) Usando serve (Súper simple)

```bash
# Instalar serve globalmente
npm install -g serve

# Compilar el proyecto
npm run build

# Servir la carpeta dist
serve -s dist -l 8080
```

Acceder: `http://localhost:8080`

---

## 🔧 Scripts Disponibles

```bash
# Modo desarrollo (hot reload)
npm run dev

# Compilar para producción
npm run build

# Previsualizar build de producción
npm run preview

# Instalar dependencias
npm install

# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json && npm install
```

---

## 📱 Desarrollo en Mac - Tips

### Atajos útiles:
- **⌘ + Click** en la URL de la terminal para abrir en navegador
- **⌃ + C** para detener el servidor dev

### Editores recomendados:
- **VS Code** (gratis) - https://code.visualstudio.com/
- **WebStorm** (pago)
- **Cursor** (basado en VS Code con IA)

### Extensiones útiles para VS Code:
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- ESLint
- Prettier

---

## 🌐 Acceder desde otros dispositivos en tu red

Si quieres acceder desde tu teléfono o tablet:

**1. Obtener tu IP local:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**2. Ejecutar en modo dev con host expuesto:**
```bash
npm run dev -- --host
```

**3. Acceder desde otro dispositivo:**
`http://TU-IP:5173` (ejemplo: `http://192.168.1.100:5173`)

---

## 🐳 Bonus: Usando Docker (Opcional)

Si quieres usar Docker en Mac:

**1. Crear Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**2. Crear nginx.conf:**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**3. Construir y ejecutar:**
```bash
# Construir imagen
docker build -t binance-dashboard .

# Ejecutar contenedor
docker run -d -p 8080:80 binance-dashboard
```

**4. Acceder:**
`http://localhost:8080`

---

## 🔥 Recomendación para Mac

**Para desarrollo:** Usa `npm run dev` - Es lo más simple y rápido.

**Para producción local:** Usa Nginx con `brew` - Es profesional y eficiente.

**Para compartir rápidamente:** Usa `serve` - Súper simple.

---

## ⚡ Diferencias vs Windows IIS

| Característica | Mac | Windows IIS |
|---|---|---|
| **Instalación** | Más simple | Requiere URL Rewrite Module |
| **Configuración** | Menos pasos | Más pasos |
| **Servidor recomendado** | Nginx/Apache | IIS |
| **Desarrollo** | npm run dev | npm run dev |
| **Permisos** | Más simple | Requiere IIS_IUSRS |

---

## 🆘 Solución de Problemas en Mac

### Puerto ya en uso:
```bash
# Ver qué proceso usa el puerto 5173
lsof -i :5173

# Matar el proceso (reemplaza PID con el número que te dio el comando anterior)
kill -9 PID
```

### Permisos denegados:
```bash
# Dar permisos de ejecución
chmod +x node_modules/.bin/*

# Si es problema con npm
sudo chown -R $USER ~/.npm
```

### Node/npm no encontrado después de instalar:
```bash
# Agregar a PATH (en ~/.zshrc o ~/.bash_profile)
echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Limpiar caché de npm:
```bash
npm cache clean --force
```

---

## 📊 Monitoreo y Logs

```bash
# Ver logs en tiempo real (modo dev)
# Los logs aparecen automáticamente en la terminal

# Ver uso de recursos
top

# Ver procesos de Node
ps aux | grep node
```

---

## 🎯 Próximos Pasos

1. ✅ Ejecutar en modo desarrollo: `npm run dev`
2. ✅ Familiarizarte con la interfaz
3. 🔜 Personalizar colores/diseño en `src/App.jsx`
4. 🔜 Integrar API real de Binance
5. 🔜 Agregar autenticación
6. 🔜 Desplegar en producción (Vercel/Netlify/AWS)

---

**¿Dudas?** El método más rápido en Mac es simplemente:
```bash
npm install
npm run dev
```

¡Y listo! 🚀
