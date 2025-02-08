const detalleController = require('../controllers').detallereservas;

module.exports = (app) => {
  app.post('/api/detalle-reserva', detalleController.create);
  app.put('/api/detalle-reserva/:iddetalle', detalleController.update);
  app.delete('/api/detalle-reserva/:iddetalle', detalleController.eliminar);
  app.get('/api/detalle-reserva', detalleController.getAll);
  app.get('/api/detalle-reserva/:iddetalle', detalleController.getOne);
};
