# 🚀 Guía de Deployment Manual

## Opción 1: Dashboard de Cloudflare (RECOMENDADO - Más Rápido)

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click en **"Pages"** en el menú lateral
3. Click en **"Create a project"**
4. Selecciona **"Upload assets"**
5. Arrastra estos archivos:
   - ✅ `index.html`
   - ✅ `banner.html`
   - ✅ `Video_Generation_Radiant_Skin_Close_Up.mp4`
   - ✅ `_redirects`
6. Click en **"Deploy site"**
7. ¡Listo! Tu URL será: `https://[nombre-proyecto].pages.dev`

---

## Opción 2: Desde Terminal (Requiere Login)

### Paso 1: Login en Cloudflare
```bash
cd "/Users/ricardomoncadapalafox/Demo NIVEA ia"
npx wrangler login
```
Esto abrirá tu navegador para autenticarte.

### Paso 2: Deploy
```bash
npx wrangler pages deploy . --project-name=dove-ai-banner
```

O ejecuta el script:
```bash
./deploy.sh
```

---

## Opción 3: Conectar GitHub (Deploy Automático)

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. Click en **"Create a project"**
3. Selecciona **"Connect to Git"**
4. Autoriza Cloudflare a acceder a GitHub
5. Selecciona el repositorio: `Ricmonpa/SALUD-FACIAL`
6. Configuración:
   - **Build command**: (dejar vacío)
   - **Build output directory**: `/` (raíz)
7. Click en **"Save and Deploy"**

**Ventaja**: Cada vez que hagas `git push`, se desplegará automáticamente.

---

## ✅ Verificación

Una vez desplegado, verifica que:
- ✅ El banner se muestra correctamente (300×600px)
- ✅ El video se reproduce en loop
- ✅ Los 3 estados funcionan (Intro → App → Resultados)
- ✅ Los botones responden a los clics

---

## 🔗 URLs

- **Repositorio**: https://github.com/Ricmonpa/SALUD-FACIAL
- **Página Demo**: `https://[tu-proyecto].pages.dev`
- **Banner Directo**: `https://[tu-proyecto].pages.dev/banner.html`

