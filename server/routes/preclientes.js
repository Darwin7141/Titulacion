const preclientesController = require('../controllers').preclientes;


module.exports = (app) => {
    app.post('/api/precliente',  preclientesController.create);
  
    app.get('/api/pre/verificarCedula/:ci', preclientesController.verificarCedula);
    app.get('/api/pre/verificarEmail/:email', preclientesController.verificarEmail);
    app.get('/api/pre/verificarTelefono/:telefono', preclientesController.verificarTelefono);
};