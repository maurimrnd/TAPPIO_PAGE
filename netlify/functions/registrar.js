exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Método no permitido' }) };
    }

    try {
        const payload = JSON.parse(event.body || '{}');
        const webhookUrl = process.env.MAKE_WEBHOOK_URL;

        if (!webhookUrl) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Falta la URL de Make' })
            };
        }

        // Generar un ID personal único e irrepetible
        const randomCode = Math.floor(100000 + Math.random() * 900000);
        payload.idPersonal = `TAP-${randomCode}`;

        // Limpiar el teléfono para evitar saltos de validación (+54911... -> 54911...)
        payload.telefonoLimpio = payload.telefono.replace(/\D/g, '');

        // Enviar a Make
        const makeResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const responseText = await makeResponse.text();

        // Si Make responde que el teléfono ya existe (Status 409 o mensaje de error)
        if (makeResponse.status === 409 || responseText.includes('DUPLICADO')) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Este número de teléfono ya se encuentra registrado.' })
            };
        }

        if (!makeResponse.ok) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Error procesando el registro en Make.' })
            };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                success: true, 
                idPersonal: payload.idPersonal,
                message: 'Registro exitoso' 
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

