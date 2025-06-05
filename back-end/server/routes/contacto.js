const contactoController = require('../controllers').correoContacto;


module.exports = (app) => {
    app.post('/api/contacto',  contactoController.enviarContacto);
    app.post('/api/notificar', contactoController.enviarNotificacionReserva);
    

};
