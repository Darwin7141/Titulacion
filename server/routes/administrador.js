const adminController = require('../controllers').administrador;


module.exports = (app) => {
    app.post('/api/administrador',  adminController.create);
    app.put('/api/administrador/:codigoadmin',  adminController.update);
    app.delete('/api/administrador/:codigoadmin',  adminController.eliminar);
    app.get('/api/administrador',  adminController.getAll);
};