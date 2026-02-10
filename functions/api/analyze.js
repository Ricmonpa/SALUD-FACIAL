/**
 * Cloudflare Pages Function - Proxy seguro para Gemini API
 * La API key NUNCA se expone al cliente.
 * Configurar GEMINI_API_KEY como variable de entorno en Cloudflare Dashboard.
 */

const MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export async function onRequestPost(context) {
    const { request, env } = context;
    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey) {
        return new Response(
            JSON.stringify({ error: 'GEMINI_API_KEY no configurada en Cloudflare' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    try {
        const body = await request.json();
        const { imageBase64, prompt } = body;

        if (!imageBase64 || !prompt) {
            return new Response(
                JSON.stringify({ error: 'Faltan imageBase64 o prompt' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const geminiBody = {
            contents: [{
                parts: [
                    { text: prompt },
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

        const geminiResponse = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiBody)
        });

        const data = await geminiResponse.json();

        if (!geminiResponse.ok) {
            return new Response(
                JSON.stringify(data),
                { status: geminiResponse.status, headers: { 'Content-Type': 'application/json' } }
            );
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
