const tokensRecuperacionController = require('../controllers').TokensRecuperacion;  // Importa el controlador

module.exports = (app) => {
  app.post('/api/recuperar-contrasena', tokensRecuperacionController.solicitarRecuperacion);  // Ruta para solicitar la recuperación
  app.post('/api/restablecer-contrasena', tokensRecuperacionController.restablecerContraseña);  // Ruta para restablecer la contraseña
};
