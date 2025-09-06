const provController = require('../controllers').proveedor;


module.exports = (app) => {
    app.post('/api/proveedor',  provController.create);
    app.put('/api/proveedor/:codigoproveedor',  provController.update);
    app.delete('/api/proveedor/:codigoproveedor',  provController.eliminar);
    app.get('/api/proveedor',  provController.getAll);
    app.get('/api/proveedor/verificarCedula/:ci', provController.verificarIdentificacion);
    app.get('/api/proveedor/verificarEmail/:email', provController.verificarEmail);
    app.get('/api/proveedor/verificarTelefono/:telefono', provController.verificarTelefono);
    app.get('/api/proveedor/porcedula/:ci', provController.getProveedorPorCedula);
    app.get('/api/proveedor/poremail/:email', provController.getProveedorPorEmail);
    
    app.get('/api/proveedor/portelefono/:telefono', provController.getProveedorPorTelefono);
    app.get('/api/proveedor/:codigoproveedor', provController.getOneByCodigo);
};