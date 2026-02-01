#!/bin/bash

# Script para iniciar Backend y Frontend simultáneamente
# Ejecutar: ./start-all.sh

echo "🚀 Iniciando Binance Dashboard (Backend + Frontend)"
echo "====================================================="
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "Por favor instala Node.js: https://nodejs.org/"
    exit 1
fi

# Verificar si el archivo .env existe
if [ ! -f "backend/.env" ]; then
    echo "⚠️  ADVERTENCIA: No se encontró backend/.env"
    echo ""
    echo "Por favor configura tu API de Binance:"
    echo "  1. cd backend"
    echo "  2. cp .env.example .env"
    echo "  3. Edita .env con tus API keys"
    echo ""
    echo "Ver CONFIGURACION-API.md para instrucciones detalladas"
    echo ""
    read -p "¿Continuar de todas formas? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Función para limpiar procesos al salir
cleanup() {
    echo ""
    echo "🛑 Deteniendo servidores..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias del frontend..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Instalando dependencias del backend..."
    cd backend && npm install && cd ..
fi

echo ""
echo "🔧 Iniciando Backend (Puerto 3001)..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Esperar 2 segundos para que el backend inicie
sleep 2

echo "🎨 Iniciando Frontend (Puerto 5173)..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Servidores iniciados"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔹 Backend:  http://localhost:3001"
echo "🔹 Frontend: http://localhost:5173"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Presiona Ctrl+C para detener ambos servidores"
echo ""

# Mantener el script corriendo
wait
