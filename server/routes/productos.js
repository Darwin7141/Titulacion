const productosController = require('../controllers').productos;


module.exports = (app) => {
    app.post('/api/productos', productosController.create);
    app.put('/api/productos/:idproducto',  productosController.update);
    app.delete('/api/productos/:idproducto', productosController.eliminar);
    app.get('/api/productos',  productosController.getAll);
};
