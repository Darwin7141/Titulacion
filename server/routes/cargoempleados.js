const empleadosController = require('../controllers').cargoempleados;


module.exports = (app) => {
    app.post('/api/empleados',  empleadosController.create);
    app.put('/api/empleados/:idcargo',  empleadosController.update);
    app.delete('/api/empleados/:idcargo',  empleadosController.eliminar);
    app.get('/api/empleados',  empleadosController.getAll);
};

