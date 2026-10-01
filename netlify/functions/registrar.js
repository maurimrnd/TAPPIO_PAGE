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
            console.error('ERROR: Falta la variable de entorno MAKE_WEBHOOK_URL');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Falta la URL de Make en las variables de entorno' })
            };
        }

        // Generar ID personal único e irrepetible (Ej: TAP-481920)
        const randomCode = Math.floor(100000 + Math.random() * 900000);
        payload.idPersonal = `TAP-${randomCode}`;

        // Limpiar el teléfono dejando solo dígitos para facilitar validación de duplicados en Make
        if (payload.telefono) {
            payload.telefonoLimpio = payload.telefono.replace(/\D/g, '');
        }

        // Enviar a Make
        const makeResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const responseText = await makeResponse.text();

        // Si Make responde que el teléfono ya existe (Status 409 o texto DUPLICADO)
        if (makeResponse.status === 409 || responseText.includes('DUPLICADO')) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Este número de teléfono ya se encuentra registrado.' })
            };
        }

        // Si Make devuelve otro error de servidor
        if (!makeResponse.ok) {
            console.error('Error proveniente de Make:', makeResponse.status, responseText);
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Error procesando el registro en Make' })
            };
        }

        // Respuesta exitosa
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                success: true, 
                idPersonal: payload.idPersonal,
                message: 'Registro procesado exitosamente' 
            })
        };

    } catch (error) {
        console.error('Error interno en registrar.js:', error.message);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
};