const resProductoController = require('../controllers').reservaProducto;


module.exports = (app) => {
    
    app.get('/api/reservas/:idreserva/productos', resProductoController.listarPorReserva);

    app.post('/api/reservas/:idreserva/productos', resProductoController.agregarAReserva);
    app.post  ('/api/reservas/:idreserva/productos/restar',      resProductoController.restarProductoReserva);
    app.delete('/api/reservas/:idreserva/productos/:idproducto', resProductoController.eliminarProductoReserva)
};

