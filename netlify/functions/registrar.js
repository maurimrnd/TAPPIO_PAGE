exports.handler = async (event, context) => {
  // Solo permitimos peticiones de tipo POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método no permitido" };
  }

  try {
    const datosCliente = JSON.parse(event.body);

    // Leemos la URL secreta de Make desde las variables de entorno de Netlify
    const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;

    if (!makeWebhookUrl) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: "La URL de Make no está configurada en el servidor" }) 
      };
    }

    // Reenviamos los datos a Make de forma privada
    const respuestaMake = await fetch(makeWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datosCliente)
    });

    if (respuestaMake.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, mensaje: "Registro exitoso" })
      };
    } else {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Error al enviar datos a Make" })
      };
    }

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error interno en el servidor" })
    };
  }
};