const clientesController = require('../controllers').gestionclientes;


module.exports = (app) => {
    app.post('/api/cliente',  clientesController.create);
    app.put('/api/cliente/:codigocliente',  clientesController.update);
    app.delete('/api/cliente/:codigocliente',  clientesController.eliminar);
    app.get('/api/cliente',  clientesController.getAll);
    app.get('/api/verificarCedula/:ci', clientesController.verificarCedula);
    app.get('/api/verificarEmail/:email', clientesController.verificarEmail);
    app.get('/api/verificarTelefono/:telefono', clientesController.verificarTelefono);
    app.get('/api/cliente/porcedula/:ci', clientesController.getClientePorCedula);
    app.get('/api/cliente/poremail/:email', clientesController.getClientePorEmail);
    
    app.get('/api/cliente/portelefono/:telefono', clientesController.getClientePorTelefono);
};