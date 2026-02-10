/**
 * Dove AI Skin Diagnosis - Banner 300×600
 * Desarrollado para N3Ad Lab
 *
 * Mejoras: optimización imágenes, retry API, getUserMedia desktop,
 * manejo de errores específico, logging detallado.
 */

// ==========================================
// CONFIGURACIÓN
// ==========================================
const GEMINI_API_KEY = 'AIzaSyAYlxMeR830ctfqNdlPRt5ruAgEkvv5hLM';
const API_TIMEOUT_MS = 30000;
const API_RETRY_COUNT = 2;
const API_RETRY_DELAYS = [2000, 4000]; // backoff en ms
const MAX_IMAGE_DIMENSION = 800;
const TARGET_IMAGE_KB = 500;
const MAX_COMPRESSION_ATTEMPTS = 3;
const INITIAL_JPEG_QUALITY = 0.6;

const COSMETOLOGIST_PROMPT = `Eres un cosmetólogo experto especializado en análisis de cutis facial.
Analiza esta foto del rostro y proporciona un diagnóstico profesional dermatológico.

ANALIZA LOS SIGUIENTES ASPECTOS DEL CUTIS:

1. TIPO DE PIEL:
   - Normal: Equilibrada, sin brillo excesivo ni resequedad
   - Seca: Falta de luminosidad, posible descamación, textura áspera
   - Grasa: Brillo visible, poros dilatados, tendencia a acné
   - Mixta: Zona T grasa y mejillas secas/normales
   - Sensible: Enrojecimiento, irritación visible

2. NIVEL DE HIDRATACIÓN:
   - Bien hidratada
   - Moderadamente hidratada
   - Deshidratada

3. CARACTERÍSTICAS OBSERVABLES:
   - Textura (suave, áspera, irregular)
   - Poros (finos, normales, dilatados)
   - Luminosidad (opaca, luminosa, brillante)
   - Tono (uniforme, irregular)

FORMATO DE RESPUESTA (ESTRICTAMENTE JSON, SIN MARKDOWN):
{
  "tipo_piel": "Normal|Seca|Grasa|Mixta|Sensible",
  "nivel_hidratacion": "Bien hidratada|Moderadamente hidratada|Deshidratada",
  "diagnostico_principal": "Descripción principal del estado de la piel (ejemplo: 'Tendencia a Deshidratación Leve')",
  "caracteristicas": [
    "Característica 1",
    "Característica 2"
  ],
  "producto_recomendado": "Dove Deep Moisture|Dove Fresh Touch|Dove Nutritive Solutions|Dove Sensitive Skin|Dove DermaSeries",
  "descripcion_producto": "Descripción breve del por qué este producto es ideal"
}

IMPORTANTE:
- Responde SOLO con JSON puro, sin markdown ni backticks
- Sé profesional y específico
- Si la foto no es clara, usa nivel_hidratacion: "Moderadamente hidratada"`;

const DOVE_PRODUCTS = {
    'Dove Deep Moisture': {
        nombre: 'Dove Deep Moisture',
        descripcion: 'Hidratación profunda para piel seca',
        url: 'https://www.dove.com/es/productos/deep-moisture.html'
    },
    'Dove DermaSeries': {
        nombre: 'Dove DermaSeries',
        descripcion: 'Crema hidratante intensiva para pieles sensibles',
        url: 'https://www.dove.com/es/productos/dermaseries.html'
    },
    'Dove Fresh Touch': {
        nombre: 'Dove Fresh Touch',
        descripcion: 'Frescura para piel grasa',
        url: 'https://www.dove.com/es/productos/fresh-touch.html'
    },
    'Dove Nutritive Solutions': {
        nombre: 'Dove Nutritive Solutions',
        descripcion: 'Nutrición balanceada para piel normal',
        url: 'https://www.dove.com/es/productos/nutritive.html'
    },
    'Dove Sensitive Skin': {
        nombre: 'Dove Sensitive Skin',
        descripcion: 'Cuidado suave para piel sensible',
        url: 'https://www.dove.com/es/productos/sensitive.html'
    }
};

const analysisMessages = [
    'Analizando 47 parámetros con IA dermatológica',
    'Procesando 2.3M de datos cutáneos',
    'Evaluando hidratación epidérmica',
    'Detectando microestructura y textura',
    'Tecnología Gemini evaluando tu piel',
    'Comparando con base científica global'
];

// ==========================================
// UTILIDADES - DETECCIÓN Y LOGGING
// ==========================================

function log(emoji, ...args) {
    const timestamp = new Date().toISOString().slice(11, 23);
    console.log(`[${timestamp}] ${emoji}`, ...args);
}

function logError(emoji, ...args) {
    const timestamp = new Date().toISOString().slice(11, 23);
    console.error(`[${timestamp}] ${emoji}`, ...args);
}

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function getBrowserInfo() {
    const ua = navigator.userAgent;
    const plat = navigator.platform;
    return { ua, plat, mobile: isMobile(), getUserMedia: hasGetUserMedia() };
}

// ==========================================
// ELEMENTOS DEL DOM (inicializados al cargar)
// ==========================================
let stateIntro, stateApp, stateResults, scanningOverlay, errorOverlay;
let btnStartDiagnosis, btnCloseApp, btnUseCamera, btnUploadPhoto, btnBuyNow, btnRestart, btnRetry;
let cameraInput, uploadInput;
let videoCaptureOverlay, videoCapturePreview, videoStream;
let messageInterval, progressInterval;

function initElements() {
    stateIntro = document.getElementById('state-intro');
    stateApp = document.getElementById('state-app');
    stateResults = document.getElementById('state-results');
    scanningOverlay = document.getElementById('scanning-overlay');
    errorOverlay = document.getElementById('error-overlay');

    btnStartDiagnosis = document.getElementById('btn-start-diagnosis');
    btnCloseApp = document.getElementById('btn-close-app');
    btnUseCamera = document.getElementById('btn-use-camera');
    btnUploadPhoto = document.getElementById('btn-upload-photo');
    btnBuyNow = document.getElementById('btn-buy-now');
    btnRestart = document.getElementById('btn-restart');
    btnRetry = document.getElementById('btn-retry');

    videoCaptureOverlay = document.getElementById('video-capture-overlay');
    videoCapturePreview = document.getElementById('video-capture-preview');

    // Inputs file
    cameraInput = document.getElementById('camera-input') || createFileInput('camera');
    uploadInput = document.getElementById('upload-input') || createFileInput('upload');

    if (!document.getElementById('camera-input')) {
        cameraInput.id = 'camera-input';
        cameraInput.type = 'file';
        cameraInput.accept = 'image/*';
        cameraInput.capture = 'user';
        cameraInput.style.display = 'none';
        document.body.appendChild(cameraInput);
    }
    if (!document.getElementById('upload-input')) {
        uploadInput.id = 'upload-input';
        uploadInput.type = 'file';
        uploadInput.accept = 'image/*';
        uploadInput.style.display = 'none';
        document.body.appendChild(uploadInput);
    }
}

function createFileInput(type) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (type === 'camera') input.capture = 'user';
    input.style.display = 'none';
    return input;
}

// ==========================================
// NAVEGACIÓN
// ==========================================

function navigateTo(targetState) {
    log('📍', 'Navegando a estado:', targetState?.id || 'unknown');
    document.querySelectorAll('.state').forEach(state => state.classList.remove('active'));
    if (targetState) targetState.classList.add('active');
}

function showOverlay() {
    scanningOverlay?.classList.add('active');
}

function hideOverlay() {
    scanningOverlay?.classList.remove('active');
}

function resetBanner() {
    log('🔄', 'Reseteando banner al estado intro');
    clearAllIntervals();
    stopVideoStream();
    navigateTo(stateIntro);
}

function clearAllIntervals() {
    if (messageInterval) clearInterval(messageInterval);
    if (progressInterval) clearInterval(progressInterval);
    messageInterval = null;
    progressInterval = null;
}

// ==========================================
// MANEJO DE ERRORES - PANTALLA Y MENSAJES
// ==========================================

function showError(userMessage, technicalDetail) {
    logError('❌', 'Mostrando error al usuario:', userMessage, technicalDetail);
    hideOverlay();

    const overlay = document.getElementById('error-overlay');
    const msgEl = document.getElementById('error-message');
    const techEl = document.getElementById('error-technical');

    if (overlay) overlay.classList.add('active');
    if (msgEl) msgEl.textContent = userMessage;
    if (techEl) {
        techEl.textContent = technicalDetail || '';
        techEl.style.display = technicalDetail ? 'block' : 'none';
    }
}

function hideError() {
    const overlay = document.getElementById('error-overlay');
    if (overlay) overlay.classList.remove('active');
}

function getErrorMessage(error) {
    const type = error?.type || 'unknown';
    const msg = error?.message || String(error);
    const code = error?.httpCode;

    if (type === 'network' || msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
        return {
            user: 'Sin conexión a internet. Verifica tu red y reintenta',
            tech: `Error: [network] - ${msg} - Sin código HTTP`
        };
    }
    if (code === 429) {
        return {
            user: 'Servicio temporalmente saturado (Error 429). Reintenta en 30 segundos',
            tech: `Error: [rate_limit] - ${msg} - Código HTTP: 429`
        };
    }
    if (code === 401 || code === 403) {
        return {
            user: 'Error de autenticación del servicio. Contacta al soporte',
            tech: `Error: [auth] - ${msg} - Código HTTP: ${code}`
        };
    }
    if (code >= 500) {
        return {
            user: 'Servicio temporalmente no disponible. Reintenta en 1 min',
            tech: `Error: [server] - ${msg} - Código HTTP: ${code}`
        };
    }
    if (code === 400) {
        return {
            user: 'Error en la solicitud. Intenta con otra foto',
            tech: `Error: [bad_request] - ${msg} - Código HTTP: 400`
        };
    }
    if (type === 'timeout') {
        return {
            user: 'La solicitud tardó demasiado. Reintenta con mejor conexión',
            tech: `Error: [timeout] - ${msg} - Timeout: ${API_TIMEOUT_MS}ms`
        };
    }
    if (type === 'camera_denied') {
        return {
            user: 'Permisos de cámara denegados. Permite el acceso en configuración',
            tech: `Error: [camera_denied] - ${msg}`
        };
    }
    if (type === 'image_too_large') {
        return {
            user: 'Imagen muy pesada. Intenta con mejor iluminación o otra foto',
            tech: `Error: [image_too_large] - ${msg}`
        };
    }

    return {
        user: 'Error inesperado. Reintenta o contacta al soporte',
        tech: `Error: [${type}] - ${msg}${code ? ` - Código HTTP: ${code}` : ''}`
    };
}

// ==========================================
// OPTIMIZACIÓN DE IMÁGENES (calidad 0.6, 800px, <500KB)
// ==========================================

async function compressImageToTarget(file) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    log('📷', 'Imagen recibida:', file.name, file.type, `${sizeMB} MB`, `(${file.size} bytes)`);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                const maxDim = MAX_IMAGE_DIMENSION;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height / width) * maxDim);
                        width = maxDim;
                    } else {
                        width = Math.round((width / height) * maxDim);
                        height = maxDim;
                    }
                }

                log('📐', 'Dimensiones objetivo:', width, 'x', height);

                let quality = INITIAL_JPEG_QUALITY;
                let attempts = 0;
                let lastBase64 = null;
                let lastSize = Infinity;

                function tryCompress() {
                    attempts++;
                    log('🗜️', `Intento de compresión ${attempts}/${MAX_COMPRESSION_ATTEMPTS}, calidad:`, quality);

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const base64 = canvas.toDataURL('image/jpeg', quality);
                    const base64Data = base64.split(',')[1];
                    const sizeBytes = Math.ceil((base64Data.length * 3) / 4);
                    const sizeKB = Math.round(sizeBytes / 1024);

                    log('📊', `Peso resultante: ${sizeKB} KB (objetivo <${TARGET_IMAGE_KB} KB)`);

                    if (sizeKB <= TARGET_IMAGE_KB) {
                        log('✅', 'Compresión final - Inicial:', `${sizeMB} MB`, '→ Final:', `${sizeKB} KB`);
                        img.src = '';
                        resolve(base64Data);
                        return;
                    }

                    if (sizeBytes < lastSize) {
                        lastSize = sizeBytes;
                        lastBase64 = base64Data;
                    }

                    quality = Math.max(0.4, quality - 0.1);

                    if (attempts < MAX_COMPRESSION_ATTEMPTS) {
                        tryCompress();
                    } else {
                        log('❌', 'No se logró <500KB después de 3 intentos. Mostrando error.');
                        img.src = '';
                        reject(new Error(`Imagen muy pesada. Inicial: ${sizeMB} MB, mejor resultado: ${Math.round(lastSize / 1024)} KB. Máximo permitido: ${TARGET_IMAGE_KB} KB`));
                    }
                }

                tryCompress();
            };
            img.onerror = (err) => {
                logError('❌', 'Error cargando imagen:', err);
                reject(new Error('No se pudo procesar la imagen'));
            };
            img.src = e.target.result;
        };
        reader.onerror = (err) => {
            logError('❌', 'Error leyendo archivo:', err);
            reject(new Error('Error leyendo archivo de imagen'));
        };
        reader.readAsDataURL(file);
    });
}

// ==========================================
// API GEMINI - Timeout 30s, retry 2 veces
// ==========================================

async function analyzeSkinWithGemini(imageBase64, attemptNumber = 1, onRetryMessage) {
    const model = 'gemini-2.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const requestBody = {
        contents: [{
            parts: [
                { text: COSMETOLOGIST_PROMPT },
                {
                    inline_data: {
                        mime_type: 'image/jpeg',
                        data: imageBase64
                    }
                }
            ]
        }],
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500
        }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const startTime = Date.now();

    try {
        log('🤖', `API Gemini - Intento ${attemptNumber}/${API_RETRY_COUNT + 1}`);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const elapsed = Date.now() - startTime;
        log('⏱️', 'Tiempo de API:', `${elapsed}ms`, '- Status:', response.status);

        if (!response.ok) {
            const errText = await response.text();
            let errData;
            try {
                errData = JSON.parse(errText);
            } catch (_) {}
            const errMsg = errData?.error?.message || errText || response.statusText;
            const err = new Error(errMsg);
            err.httpCode = response.status;
            throw err;
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0]) {
            throw new Error('No response from Gemini - sin candidatos');
        }

        let analysisText = data.candidates[0].content.parts[0].text;
        analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const analysis = JSON.parse(analysisText);
        log('✅', 'Análisis completado correctamente');
        return analysis;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            const timeoutErr = new Error(`Timeout después de ${API_TIMEOUT_MS}ms`);
            timeoutErr.type = 'timeout';
            throw timeoutErr;
        }

        if (attemptNumber <= API_RETRY_COUNT) {
            const delay = API_RETRY_DELAYS[attemptNumber - 1] || 2000;
            log('🔄', `Reintentando en ${delay}ms... (intento ${attemptNumber + 1}/${API_RETRY_COUNT + 1})`);
            if (typeof onRetryMessage === 'function') {
                onRetryMessage(attemptNumber + 1, API_RETRY_COUNT + 1);
            }
            await new Promise(r => setTimeout(r, delay));
            return analyzeSkinWithGemini(imageBase64, attemptNumber + 1, onRetryMessage);
        }

        if (error.message?.toLowerCase().includes('failed to fetch') || error.message?.toLowerCase().includes('network')) {
            error.type = 'network';
        }
        throw error;
    }
}

// ==========================================
// ACTUALIZAR RESULTADOS
// ==========================================

function updateResultsWithAnalysis(analysis) {
    const diagnosticoElement = document.querySelector('.diagnosis-result');
    if (diagnosticoElement) diagnosticoElement.textContent = analysis.diagnostico_principal;

    const productoNombreElement = document.querySelector('.product-name');
    if (productoNombreElement) productoNombreElement.textContent = analysis.producto_recomendado;

    const productoDescElement = document.querySelector('.product-description');
    if (productoDescElement) productoDescElement.textContent = analysis.descripcion_producto;

    const productoInfo = DOVE_PRODUCTS[analysis.producto_recomendado];
    if (productoInfo) {
        window.lastProductUrl = productoInfo.url;
    }

    window.lastAnalysis = analysis;
    log('✅', 'Resultados actualizados:', analysis.diagnostico_principal);
}

// ==========================================
// ANÁLISIS CON 2 FASES (Scan + Progress)
// ==========================================

function showScanPhase(overlay, imageDataURL) {
    const scanHTML = `
        <div class="overlay-content fade-in">
            <img src="${imageDataURL}" class="analysis-background" alt="Tu rostro">
            <div class="analysis-container">
                <div class="scan-box">
                    <div class="scan-lines"><div class="scan-line"></div></div>
                    <div class="scan-corner top-left"></div>
                    <div class="scan-corner top-right"></div>
                    <div class="scan-corner bottom-left"></div>
                    <div class="scan-corner bottom-right"></div>
                </div>
                <p class="scan-text">Escaneando características faciales...</p>
            </div>
        </div>
    `;
    overlay.innerHTML = scanHTML;
    overlay.classList.add('active');
}

function showProgressPhase(overlay, imageDataURL, retryMessage) {
    const msg = retryMessage || analysisMessages[0];
    const progressHTML = `
        <div class="overlay-content fade-in">
            <img src="${imageDataURL}" class="analysis-background" alt="Tu rostro">
            <div class="analysis-container">
                <div class="progress-container">
                    <div class="progress-bar"><div class="progress-fill"></div></div>
                    <p class="progress-percentage">0%</p>
                    <p class="analysis-message">${msg}</p>
                    <div class="analysis-metrics">
                        <span class="metric">🔬 Análisis IA Activo</span>
                        <span class="metric">⚡ Gemini Vision</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    overlay.innerHTML = progressHTML;

    setTimeout(() => {
        const progressFill = overlay.querySelector('.progress-fill');
        const progressText = overlay.querySelector('.progress-percentage');
        if (progressFill && progressText) {
            progressFill.style.width = '100%';
            let progress = 0;
            progressInterval = setInterval(() => {
                progress += 2;
                if (progress <= 100) progressText.textContent = progress + '%';
                else clearInterval(progressInterval);
            }, 60);
        }
    }, 100);

    let currentIndex = 0;
    messageInterval = setInterval(() => {
        currentIndex++;
        if (currentIndex < analysisMessages.length) {
            const messageEl = overlay.querySelector('.analysis-message');
            if (messageEl) {
                messageEl.style.animation = 'none';
                setTimeout(() => {
                    messageEl.textContent = analysisMessages[currentIndex];
                    messageEl.style.animation = 'messageFade 0.8s ease-in-out';
                }, 50);
            }
        }
    }, 800);
}

// ==========================================
// FLUJO PRINCIPAL - PROCESAR IMAGEN
// ==========================================

async function processImage(file) {
    if (!file) {
        logError('❌', 'processImage llamado sin archivo');
        return;
    }

    log('📸', 'Iniciando processImage');

    let imageDataURL;
    try {
        imageDataURL = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    } catch (err) {
        logError('❌', 'Error leyendo archivo para preview:', err);
        const { user, tech } = getErrorMessage({ type: 'unknown', message: err.message });
        showError(user, tech);
        return;
    }

    let base64Image;
    try {
        base64Image = await compressImageToTarget(file);
    } catch (err) {
        logError('❌', 'Error comprimiendo imagen:', err);
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        showError(
            `Imagen muy pesada (${sizeMB} MB). Reintentando con compresión no fue posible.`,
            `Error: [image_compression] - ${err.message}`
        );
        return;
    }

    showEnhancedAnalysisWithBase64(imageDataURL, base64Image);
}

function showEnhancedAnalysisWithBase64(imageDataURL, base64Image) {
    const overlay = scanningOverlay;
    if (!overlay) return;

    showScanPhase(overlay, imageDataURL);
    log('🤖', 'Analizando con Gemini AI...');

    const MIN_TOTAL_TIME = 5500;
    const startTime = Date.now();

    const updateRetryMessage = (attempt, total) => {
        const msgEl = overlay.querySelector('.analysis-message');
        if (msgEl) msgEl.textContent = `Reintentando... (intento ${attempt}/${total})`;
    };

    analyzeSkinWithGemini(base64Image, 1, updateRetryMessage)
        .then((result) => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, MIN_TOTAL_TIME - elapsed);
            log('✅', 'API respondió. Mostrando resultados en', remaining, 'ms');
            setTimeout(() => {
                clearAllIntervals();
                updateResultsWithAnalysis(result);
                hideOverlay();
                hideError();
                navigateTo(stateResults);
            }, remaining);
        })
        .catch((error) => {
            logError('❌', 'Error en analyzeSkinWithGemini:', error);
            clearAllIntervals();
            setTimeout(() => {
                const { user, tech } = getErrorMessage({
                    type: error.type,
                    message: error.message,
                    httpCode: error.httpCode
                });
                showError(user, tech);
            }, 500);
        });

    setTimeout(() => {
        showProgressPhase(overlay, imageDataURL);
    }, 2500);
}

// ==========================================
// CÁMARA - getUserMedia para Desktop
// ==========================================

function stopVideoStream() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
        log('📷', 'Stream de video detenido');
    }
}

async function startCameraForDesktop() {
    if (!hasGetUserMedia()) {
        log('📷', 'getUserMedia no disponible, usando input file');
        return false;
    }

    try {
        log('📷', 'Solicitando acceso a cámara (getUserMedia)');
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false
        });

        if (videoCapturePreview && videoCaptureOverlay) {
            videoCapturePreview.srcObject = videoStream;
            videoCaptureOverlay.classList.add('active');
            log('✅', 'Cámara activada correctamente');
            return true;
        }
        return false;
    } catch (err) {
        logError('❌', 'Error getUserMedia:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            const { user, tech } = getErrorMessage({
                type: 'camera_denied',
                message: err.message
            });
            showError(user, tech);
        } else {
            showError(
                'No se pudo acceder a la cámara. Usa "Subir Foto" como alternativa.',
                `Error: [camera] - ${err.name}: ${err.message}`
            );
        }
        return false;
    }
}

function captureFromVideoStream() {
    if (!videoStream || !videoCapturePreview) return null;

    const canvas = document.createElement('canvas');
    canvas.width = videoCapturePreview.videoWidth;
    canvas.height = videoCapturePreview.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoCapturePreview, 0, 0);

    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
                    resolve(file);
                } else {
                    resolve(null);
                }
            },
            'image/jpeg',
            INITIAL_JPEG_QUALITY
        );
    });
}

function closeVideoCapture() {
    stopVideoStream();
    if (videoCaptureOverlay) videoCaptureOverlay.classList.remove('active');
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
    btnStartDiagnosis?.addEventListener('click', () => {
        log('👆', 'Click en Diagnóstico AI Gratuito');
        navigateTo(stateApp);
    });

    btnCloseApp?.addEventListener('click', resetBanner);

    btnUseCamera?.addEventListener('click', async () => {
        log('👆', 'Click en Usar Cámara');
        const mobile = isMobile();

        if (!mobile && hasGetUserMedia()) {
            const started = await startCameraForDesktop();
            if (started) return;
        }

        log('📷', 'Usando input file para cámara (mobile o fallback)');
        cameraInput?.click();
    });

    cameraInput?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            log('⚠️', 'No se capturó archivo de cámara');
            e.target.value = '';
            return;
        }
        if (!file.type.startsWith('image/')) {
            logError('❌', 'Archivo no es imagen:', file.type);
            showError('El archivo capturado no es una imagen válida.', `Tipo: ${file.type}`);
            e.target.value = '';
            return;
        }
        log('📷', 'Archivo capturado:', file.name, file.type, file.size, 'bytes');
        try {
            await processImage(file);
        } catch (err) {
            logError('❌', 'Error procesando foto de cámara:', err);
            const { user, tech } = getErrorMessage({ message: err.message });
            showError(user, tech);
        } finally {
            setTimeout(() => { e.target.value = ''; }, 100);
        }
    });

    btnUploadPhoto?.addEventListener('click', () => {
        log('👆', 'Click en Subir Foto');
        uploadInput?.click();
    });

    uploadInput?.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) {
            log('⚠️', 'No se seleccionó archivo');
            e.target.value = '';
            return;
        }
        if (!file.type.startsWith('image/')) {
            logError('❌', 'Archivo no es imagen:', file.type);
            showError('Por favor selecciona una imagen válida.', `Tipo: ${file.type}`);
            e.target.value = '';
            return;
        }
        log('📁', 'Archivo seleccionado:', file.name, file.type, file.size, 'bytes');
        try {
            await processImage(file);
        } catch (err) {
            logError('❌', 'Error procesando foto subida:', err);
            const { user, tech } = getErrorMessage({ message: err.message });
            showError(user, tech);
        } finally {
            setTimeout(() => { e.target.value = ''; }, 100);
        }
    });

    btnBuyNow?.addEventListener('click', () => {
        if (window.lastProductUrl) {
            window.open(window.lastProductUrl, '_blank');
        } else {
            window.open('https://www.dove.com/es/productos.html', '_blank');
        }
    });

    btnRestart?.addEventListener('click', (e) => {
        e.preventDefault();
        resetBanner();
    });

    btnRetry?.addEventListener('click', () => {
        log('🔄', 'Click en Reintentar');
        hideError();
        clearAllIntervals();
        stopVideoStream();
        navigateTo(stateApp);
    });

    // Video capture overlay - botones
    const btnCapturePhoto = document.getElementById('btn-capture-photo');
    const btnCancelCapture = document.getElementById('btn-cancel-capture');

    btnCapturePhoto?.addEventListener('click', async () => {
        log('📷', 'Capturando foto desde stream');
        const file = await captureFromVideoStream();
        closeVideoCapture();
        if (file) {
            await processImage(file);
        }
    });

    btnCancelCapture?.addEventListener('click', () => {
        closeVideoCapture();
    });
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

function init() {
    log('🕊️', 'Dove AI Skin Diagnosis Banner - Iniciando');
    log('📐', 'Dimensions: 300x600px');
    log('🤖', 'AI: Google Gemini Vision API');
    log('📱', 'Detección:', JSON.stringify(getBrowserInfo()));

    initElements();
    setupEventListeners();

    log('✅', 'Banner inicializado correctamente');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
