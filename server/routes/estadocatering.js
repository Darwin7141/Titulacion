const estadoController = require('../controllers').estadocatering;


module.exports = (app) => {
    app.post('/api/estado', estadoController.create);
    app.put('/api/estado/:idestado',  estadoController.update);
   // app.delete('/api/estado/:idestado', estadoController.eliminar);
    app.get('/api/estado',  estadoController.getAll);
};

