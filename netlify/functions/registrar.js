exports.handler = async (event, context) => {
    // Permitir solo peticiones POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Método no permitido' })
        };
    }

    try {
        const payload = JSON.parse(event.body || '{}');
        const webhookUrl = process.env.MAKE_WEBHOOK_URL;

        if (!webhookUrl) {
            console.error('Falta la variable de entorno MAKE_WEBHOOK_URL');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Falta la URL de Make en las variables de entorno' })
            };
        }

        // Reenvío de datos a Make
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, message: 'Registro enviado exitosamente' })
        };

    } catch (error) {
        console.error('Error en la función registrar:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};