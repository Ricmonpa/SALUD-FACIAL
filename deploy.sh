#!/bin/bash

# Script para deploy manual a Cloudflare Pages
# Uso: ./deploy.sh

echo "🚀 Iniciando deploy a Cloudflare Pages..."
echo ""

# Verificar que wrangler está disponible
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx no está disponible"
    exit 1
fi

# Hacer login (esto abrirá el navegador)
echo "📝 Paso 1: Autenticación en Cloudflare..."
echo "   Se abrirá tu navegador para autenticarte..."
npx wrangler login

# Deploy
echo ""
echo "📤 Paso 2: Subiendo archivos a Cloudflare Pages..."
npx wrangler pages deploy . --project-name=dove-ai-banner

echo ""
echo "✅ ¡Deploy completado!"
echo "🌐 Tu banner estará disponible en: https://dove-ai-banner.pages.dev"

