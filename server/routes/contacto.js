const contactoController = require('../controllers').correoContacto;


module.exports = (app) => {
    app.post('/api/contacto',  contactoController.enviarContacto);
    

};
