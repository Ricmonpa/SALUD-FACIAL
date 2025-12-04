# Dove AI Skin Diagnosis - Banner Rich Media Interactivo

Banner publicitario interactivo de 300×600px desarrollado para Dove con tecnología de diagnóstico de piel mediante IA.

## 🚀 Deployment en Cloudflare Pages

### Opción 1: Desde el Dashboard de Cloudflare

1. **Inicia sesión** en tu cuenta de Cloudflare
2. Ve a **Pages** en el menú lateral
3. Haz clic en **"Create a project"**
4. Conecta tu repositorio de Git (GitHub, GitLab, etc.) o sube los archivos directamente
5. Configura el proyecto:
   - **Project name**: `dove-ai-banner` (o el nombre que prefieras)
   - **Build command**: (dejar vacío, no requiere build)
   - **Build output directory**: `/` (raíz)
6. Haz clic en **"Save and Deploy"**

### Opción 2: Usando Wrangler CLI

```bash
# Instalar Wrangler CLI
npm install -g wrangler

# Iniciar sesión
wrangler login

# Deploy desde el directorio del proyecto
cd "Demo NIVEA ia"
wrangler pages deploy . --project-name=dove-ai-banner
```

### Opción 3: Subida Manual

1. Ve a **Cloudflare Pages** → **Create a project**
2. Selecciona **"Upload assets"**
3. Arrastra todos los archivos del proyecto:
   - `index.html`
   - `banner.html`
   - `Video_Generation_Radiant_Skin_Close_Up.mp4`
   - `_redirects`
4. Haz clic en **"Deploy site"**

## 📁 Estructura del Proyecto

```
Demo NIVEA ia/
├── index.html          # Página de demo principal
├── banner.html         # Banner interactivo (300×600px)
├── Video_Generation_Radiant_Skin_Close_Up.mp4  # Video de fondo
├── _redirects          # Configuración de redirecciones
└── README.md           # Este archivo
```

## 🎯 Características

### Estados del Banner

1. **Estado 1: Intro**
   - Video de fondo en loop
   - Overlay degradado para legibilidad
   - CTA principal: "Diagnóstico AI Gratuito"
   - Footer: "Powered by N3Ad Lab"

2. **Estado 2: Interacción**
   - Interfaz tipo app móvil
   - Opciones: Usar Cámara / Subir Foto
   - Animación de escaneo (2 segundos)

3. **Estado 3: Resultados**
   - Diagnóstico personalizado
   - Producto recomendado: Dove DermaSeries
   - CTA de conversión: "Comprar Ahora"

### Stack Tecnológico

- **HTML5** - Estructura semántica
- **CSS3** - Estilos y animaciones
- **Vanilla JavaScript** - Lógica de interacción
- **Sin dependencias externas** - Todo en un solo archivo

### Paleta de Colores Dove

- Blanco: `#FFFFFF`
- Azul Dove: `#00497E`
- Gris suave: `#F0F0F0`

## 🔧 Personalización

### Cambiar el Video

Reemplaza el archivo `Video_Generation_Radiant_Skin_Close_Up.mp4` o actualiza la ruta en `banner.html`:

```html
<source src="tu-video.mp4" type="video/mp4">
```

### Modificar el Enlace de Compra

En `banner.html`, línea ~842, actualiza la URL:

```javascript
const purchaseUrl = 'https://tu-url-de-compra.com';
```

### Ajustar Colores

Modifica las variables CSS en `banner.html`:

```css
:root {
    --dove-white: #FFFFFF;
    --dove-blue: #00497E;
    --dove-gray: #F0F0F0;
}
```

## 📊 Compatibilidad

- ✅ Chrome/Edge (últimas versiones)
- ✅ Firefox (últimas versiones)
- ✅ Safari (últimas versiones)
- ✅ Dispositivos móviles (iOS/Android)
- ✅ Plataformas de publicidad (Google Ads, Facebook Ads, etc.)

## 🌐 URL de Producción

Una vez desplegado, tu banner estará disponible en:

```
https://[nombre-proyecto].pages.dev
```

Y el banner directamente en:

```
https://[nombre-proyecto].pages.dev/banner.html
```

## 📝 Notas

- El video debe estar optimizado para web (formato MP4, compresión adecuada)
- Asegúrate de que el archivo de video no exceda los 5-10MB para carga rápida
- El banner es completamente responsive dentro de su contenedor fijo de 300×600px

## 👨‍💻 Desarrollo

Desarrollado por **N3Ad Lab** para Dove.

---

¿Necesitas ayuda? Contacta al equipo de desarrollo.

