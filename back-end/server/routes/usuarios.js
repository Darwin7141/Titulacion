const usuariosController = require('../controllers').usuarios;

module.exports = (app) => {
    app.post('/api/usuario', usuariosController.create);
    app.put('/api/usuario/:idcuenta', usuariosController.update);
    app.delete('/api/usuario/:idcuenta', usuariosController.eliminar);
    app.post('/api/login', usuariosController.login);
    app.get('/api/usuario', usuariosController.getAll);
}