const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { enviarCorreoRecuperacion } = require('../utils/emailService');  // Asegúrate de tener esta función configurada
const modelos = require('../models');  // Importa los modelos
//const { TokensRecuperacion } = modelos;  // Importa el modelo de tokens

// Ruta para solicitar la recuperación de contraseña
async function solicitarRecuperacion(req, res) {
  const { correo } = req.body;

  try {
    // 1) Busca al usuario por correo
    const usuario = await modelos.cuentasusuarios.findOne({ where: { correo } });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // 2) Genera token y expiración
    const token     = crypto.randomBytes(32).toString('hex');
    const expiraEn  = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    // 3) Guarda el token incluyendo “cuenta”
    await modelos.tokens_recuperacion.create({
      correo, 
      token,
      expira_en: expiraEn,
      cuenta: usuario.idcuenta  // <-- aquí enlazas con tu usuario
    });

    // 4) Envía el correo
    await enviarCorreoRecuperacion(correo, token);
    return res.status(200).json({ mensaje: 'Correo enviado exitosamente' });

  } catch (error) {
    console.error('Error en el proceso de recuperación:', error);
    return res.status(500).json({ error: 'No se pudo procesar la solicitud' });
  }
}

// Ruta para restablecer la contraseña
async function restablecerContraseña(req, res) {
  const { token, nuevaContrasena } = req.body;

  console.log('Token recibido:', token);
  console.log('Nueva contraseña recibida:', nuevaContrasena);

  if (!nuevaContrasena) {
    return res.status(400).json({ error: 'La nueva contraseña es requerida' });
  }

  if (nuevaContrasena.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  try {
    // Buscar el token en la tabla tokens_recuperacion
    const registroToken = await modelos.tokens_recuperacion.findOne({ where: { token } });

    if (!registroToken) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    // Verificar si el token ha expirado
    const ahora = new Date();
    if (registroToken.expira_en < ahora) {
      return res.status(400).json({ error: 'El token ha expirado' });
    }

    // Hashear la nueva contraseña
    const hashContrasena = await bcrypt.hash(nuevaContrasena, 10);
    console.log('Hash generado para la contraseña:', hashContrasena);

    // Actualizar la contraseña del usuario en la tabla cuentasusuarios
    const usuario = await modelos.cuentasusuarios.findOne({ where: { correo: registroToken.correo } });
    if (!usuario) {
      console.log('Usuario encontrado para actualización:', usuario);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    usuario.contrasenia = hashContrasena;
    await usuario.save();

    // Eliminar el token después de usarlo
    await modelos.tokens_recuperacion.destroy({ where: { token } });

    res.status(200).json({ mensaje: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ error: 'No se pudo procesar la solicitud' });
  }
}



module.exports = {
  solicitarRecuperacion,
  restablecerContraseña,
};
