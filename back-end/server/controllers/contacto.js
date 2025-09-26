

const { enviarCorreoEmpresa, enviarCorreoNotificacionReserva } = require('../utils/emailService');
const twilio = require('twilio');


const accountSid = 'AC564a1b6f9290142bc6b92745d09553ab';  
const authToken = '53e43b653b9a1395a570ec60106cd080';  
const client = twilio(accountSid, authToken);


const TWILIO_WHATSAPP_FROM = 'whatsapp:+14155238886';  

const EMPRESA_WHATSAPP = 'whatsapp:+593992268003'; 


function enviarContacto(req, res) {
  try {
    const { nombre, email, celular, serviciosSeleccionados } = req.body;

    // 1) Responder de inmediato, sin bloquear al front
    res.status(202).json({
      message: 'Solicitud recibida. Procesando en segundo plano...'
    });

    // 2) Procesar en background con 'setImmediate'
    setImmediate(async () => {
      try {
        // Prepara el texto para WhatsApp
        const serviciosStr = serviciosSeleccionados.length
          ? serviciosSeleccionados.join(', ')
          : 'Ninguno';

        const mensajeWhatsapp = `
          NUEVA SOLICITUD DE CONTACTO
          - Nombre: ${nombre}
          - Email: ${email}
          - Celular (del cliente): ${celular}
          - Servicios elegidos: ${serviciosStr}
        `;

        
        const envioCorreo = enviarCorreoEmpresa({ nombre, email, celular, serviciosSeleccionados });
        const envioWhatsApp = client.messages.create({
          from: TWILIO_WHATSAPP_FROM,
          to: EMPRESA_WHATSAPP,
          body: mensajeWhatsapp
        });

        await Promise.all([envioCorreo, envioWhatsApp]);
        console.log('¡Proceso de correo+WhatsApp completado en background!');
      } catch (errBg) {
        console.error('Error en el proceso en segundo plano:', errBg);

      }
    });
  } catch (error) {
    console.error('Error al intentar procesar la solicitud:', error);
    
    return res.status(500).json({ message: 'Error al recibir la solicitud.' });
  }
}

async function enviarNotificacionReserva({ 
  idreserva,
  codigocliente,
  fechaevento,
  direccionevento,
  total,
  menusDetalle,
  datosCliente
}) {
  // 1) Armar cuerpo de correo
  const serviciosStr = menusDetalle.length
    ? menusDetalle.map(m => `${m.nombre} (${m.cantpersonas} Platos) `).join(', ')
    : 'Ninguno';

  const asunto = `Nueva reserva: ${idreserva}`;
  const cuerpoHtml = `
    <h2>Se creó una nueva reserva en la aplicación</h2>
    <p><strong>ID Reserva:</strong> ${idreserva}</p>
    <p><strong>Cliente:</strong> ${datosCliente.nombre} (Cédula: ${datosCliente.ci})</p>
    <p><strong>Teléfono:</strong> ${datosCliente.telefono}</p>
    <p><strong>Email:</strong> ${datosCliente.e_mail}</p>
    <p><strong>Dirección cliente:</strong> ${datosCliente.direccion}</p>
    <hr>
    <p><strong>Fecha de evento:</strong> ${fechaevento}</p>
    <p><strong>Dirección del evento:</strong> ${direccionevento}</p>
    <p><strong>Total:</strong> $${total.toFixed(2)}</p>
    <p><strong>Menús:</strong> ${serviciosStr}</p>
    <hr>
    <p>Por favor, gestiona esta reserva desde el panel de administración.</p>
  `;

  // 2) Envío de correo:
  const envioCorreo = enviarCorreoNotificacionReserva({
    to: 'd.morales1305@gmail.com', // correo de la empresa
    subject: asunto,
    html: cuerpoHtml
  });

  // 3) Envío de WhatsApp:
  const mensajeWA = `
    NUEVA RESERVA 
    ID: ${idreserva}
    Cliente: ${datosCliente.nombre}
    Tel: ${datosCliente.telefono}
    Evento: ${fechaevento} en ${direccionevento}
    Total: $${total.toFixed(2)}
    Menús: ${serviciosStr}
  `;
  const envioWhatsApp = client.messages.create({
    from: TWILIO_WHATSAPP_FROM,
    to:   EMPRESA_WHATSAPP,
    body: mensajeWA.trim()
  });

  // 4) Esperar ambos envíos en paralelo
  return Promise.all([envioCorreo, envioWhatsApp]);
}


module.exports = {
  enviarContacto,
  enviarNotificacionReserva
};