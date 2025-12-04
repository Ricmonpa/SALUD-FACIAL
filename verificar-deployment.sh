#!/bin/bash

# Script para verificar el deployment en Cloudflare Pages
# Deployment ID: cfa02289-9f62-4947-be59-baeeb4d08979

echo "🔍 Verificando deployment en Cloudflare Pages..."
echo "Deployment ID: cfa02289-9f62-4947-be59-baeeb4d08979"
echo ""

# Verificar archivos locales
echo "📁 Archivos locales que deberían estar desplegados:"
echo ""
ls -lh index.html banner.html Video_Generation_Radiant_Skin_Close_Up.mp4 _redirects 2>/dev/null | awk '{print "  ✅", $9, "(" $5 ")"}'
echo ""

echo "🌐 Para verificar el deployment:"
echo "   1. Ve a: https://dash.cloudflare.com"
echo "   2. Workers & Pages → Pages"
echo "   3. Busca el proyecto con deployment ID: cfa02289-9f62-4947-be59-baeeb4d08979"
echo "   4. Click en el proyecto para ver la URL"
echo ""
echo "📋 Archivos que DEBEN estar en el deployment:"
echo "   ✅ index.html"
echo "   ✅ banner.html"
echo "   ✅ Video_Generation_Radiant_Skin_Close_Up.mp4"
echo "   ✅ _redirects"
echo ""

