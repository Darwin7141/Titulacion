const resController = require('../controllers').reservas;


module.exports = (app) => {
    app.post('/api/reservas',  resController.create);
    app.put('/api/reservas/:idreserva',  resController.update);
    app.delete('/api/reservas/:idreserva', resController.eliminar);
    app.get('/api/reservas',  resController.getAll);
    app.get('/api/reserva/cliente/:codigocliente', resController.getByCliente);
    app.post('/api/reserva/clienteYReserva', resController.createClienteYReserva);
    app.get('/api/reservas/:idreserva', resController.getOne);
    app.post('/api/reservas/:idreserva/pago/primerPago', resController.procesarPrimerPago);
    app.post('/api/reservas/:idreserva/pago/segundoPago', resController.procesarSegundoPago);
    app.post('/api/reservas/:idreserva/pago/tarjeta', resController.procesarPagoConTarjeta);
    

   
};