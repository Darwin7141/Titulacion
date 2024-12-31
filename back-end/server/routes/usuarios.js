const usuariosController = require('../controllers').usuarios;

module.exports = (app) => {
    app.post('/api/usuario', usuariosController.create);
    app.post('/api/login', usuariosController.login);
    app.get('/api/usuario', usuariosController.getAll);
}