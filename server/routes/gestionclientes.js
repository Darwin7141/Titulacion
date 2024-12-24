const clientesController = require('../controllers').gestionclientes;


module.exports = (app) => {
    app.post('/api/cliente',  clientesController.create);
    app.put('/api/cliente/:codigocliente',  clientesController.update);
    app.delete('/api/cliente/:codigocliente',  clientesController.eliminar);
};