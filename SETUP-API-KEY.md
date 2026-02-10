# Configuración de API Key de Gemini (producción)

La API key **nunca** debe estar en el código. Se configura como variable de entorno.

## Para Cloudflare Pages (producción)

1. Entra a [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Ve a **Workers & Pages** → tu proyecto **SALUD-FACIAL**
3. **Settings** → **Environment variables**
4. Agrega una variable:
   - **Variable name:** `GEMINI_API_KEY`
   - **Value:** (tu API key)
   - Marca como **Encrypt** (variable sensible)
5. Selecciona el ambiente: **Production** (y Preview si quieres)
6. **Save**
7. Haz un nuevo deploy para que tome efecto

## Para desarrollo local

El archivo `.dev.vars` ya está configurado (está en `.gitignore`, no se sube a git).

Para probar localmente:
```bash
npx wrangler pages dev .
```

Luego abre http://localhost:8788
