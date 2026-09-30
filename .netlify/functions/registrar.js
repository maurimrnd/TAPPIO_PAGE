const https = require('https');
const { URL } = require('url');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método no permitido" };
  }

  const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;

  if (!makeWebhookUrl) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Falta la variable MAKE_WEBHOOK_URL en Netlify" })
    };
  }

  return new Promise((resolve) => {
    try {
      const url = new URL(makeWebhookUrl);
      const postData = event.body;

      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              statusCode: 200,
              body: JSON.stringify({ ok: true })
            });
          } else {
            resolve({
              statusCode: res.statusCode,
              body: JSON.stringify({ error: "Error en Make", detail: responseData })
            });
          }
        });
      });

      req.on('error', (e) => {
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: e.message })
        });
      });

      req.write(postData);
      req.end();

    } catch (err) {
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: err.message })
      });
    }
  });
};