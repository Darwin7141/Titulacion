const categoriaController = require('../controllers').categoriaProductos;


module.exports = (app) => {
    app.post('/api/categoriaProductos',  categoriaController.create);
    app.put('/api/categoriaProductos/:idcategoria',  categoriaController.update);
    app.delete('/api/categoriaProductos/:idcategoria',  categoriaController.eliminar);
    app.get('/api/categoriaProductos',  categoriaController.getAll);
};

