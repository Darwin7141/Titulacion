const estado_reservaController = require('../controllers').estadoReserva;


module.exports = (app) => {
    app.post('/api/estadoReserva', estado_reservaController.create);
    app.put('/api/estadoReserva/:idestado',  estado_reservaController.update);
   // app.delete('/api/estado/:idestado', estadoController.eliminar);
    app.get('/api/estadoReserva',  estado_reservaController.getAll);
};

