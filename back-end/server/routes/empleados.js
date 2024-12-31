const empleadosController = require('../controllers').empleados;


module.exports = (app) => {
    app.post('/api/gestionempleados', empleadosController.create);
    app.put('/api/gestionempleados/:codigoempleado',  empleadosController.update);
    app.delete('/api/gestionempleados/:codigoempleado',  empleadosController.eliminar);
    app.get('/api/gestionempleados',  empleadosController.getAll);
};

