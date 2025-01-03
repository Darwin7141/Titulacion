const tipoController = require('../controllers').tipocatering;


module.exports = (app) => {
    app.post('/api/tipo',  tipoController.create);
    app.put('/api/tipo/:idtipo',  tipoController.update);
    app.delete('/api/tipo/:idtipo',  tipoController.eliminar);
    app.get('/api/tipo',  tipoController.getAll);
};