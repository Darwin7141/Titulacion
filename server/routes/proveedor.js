const provController = require('../controllers').proveedor;


module.exports = (app) => {
    app.post('/api/proveedor',  provController.create);
    app.put('/api/proveedor/:codigoproveedor',  provController.update);
    app.delete('/api/proveedor/:codigoproveedor',  provController.eliminar);
    app.get('/api/proveedor',  provController.getAll);
};