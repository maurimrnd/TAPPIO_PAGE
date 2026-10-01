exports.handler = async (event, context) => {
    // Solo permitir solicitudes POST
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: 'Método no permitido' }) 
        };
    }

    try {
        const payload = JSON.parse(event.body || '{}');
        const searchWebhookUrl = process.env.MAKE_SEARCH_WEBHOOK_URL || process.env.MAKE_WEBHOOK_URL;

        if (!searchWebhookUrl) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Falta configurar la variable de entorno del webhook' })
            };
        }

        // Enviar el teléfono a Make para consultar en la base de datos
        const makeResponse = await fetch(searchWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accion: 'verificar_telefono',
                telefono: payload.telefono,
                telefonoLimpio: payload.telefono ? payload.telefono.replace(/\D/g, '') : ''
            })
        });

        const responseText = await makeResponse.text();

        // Si Make responde 409 o incluye DUPLICADO/EXISTE
        if (makeResponse.status === 409 || responseText.includes('DUPLICADO') || responseText.includes('EXISTE')) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ existe: true, mensaje: 'El número ya está registrado.' })
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ existe: false, mensaje: 'Número disponible.' })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
};