const servicioController = require('../controllers').serviciocatering;


module.exports = (app) => {
    app.post('/api/servicio',  servicioController.create);
    app.put('/api/servicio/:idservicio',  servicioController.update);
    app.delete('/api/servicio/:idservicio',  servicioController.eliminar);
    app.get('/api/servicio',  servicioController.getAll);
};