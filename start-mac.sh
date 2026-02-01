#!/bin/bash

# Script de inicio rápido para Mac
# Ejecutar: ./start-mac.sh

echo "🍎 Binance Dashboard - Inicio Rápido para Mac"
echo "=============================================="
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null
then
    echo "❌ Node.js no está instalado"
    echo ""
    echo "Por favor instala Node.js primero:"
    echo "  1. Con Homebrew: brew install node"
    echo "  2. O descarga desde: https://nodejs.org/"
    echo ""
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"
echo "✅ npm encontrado: $(npm --version)"
echo ""

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    echo ""
fi

echo "🚀 Iniciando servidor de desarrollo..."
echo ""
echo "El dashboard se abrirá en: http://localhost:5173"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo "=============================================="
echo ""

# Iniciar servidor
npm run dev
