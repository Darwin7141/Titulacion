const empleadosController = require('../controllers').empleados;


module.exports = (app) => {
    app.post('/api/gestionempleados', empleadosController.create);
    app.put('/api/gestionempleados/:codigoempleado',  empleadosController.update);
    app.delete('/api/gestionempleados/:codigoempleado',  empleadosController.eliminar);
    app.get('/api/gestionempleados',  empleadosController.getAll);
    app.get('/api/empleado/verificarCedula/:ci', empleadosController.verificarCedula);
    app.get('/api/empleado/verificarEmail/:email', empleadosController.verificarEmail);
    app.get('/api/empleado/verificarTelefono/:telefono', empleadosController.verificarTelefono);
    app.get('/api/empleado/porcedula/:ci', empleadosController.getEmpleadoPorCedula);
    app.get('/api/empleado/poremail/:email', empleadosController.getEmpleadoPorEmail);
    
    app.get('/api/empleado/portelefono/:telefono', empleadosController.getEmpleadoPorTelefono);
    app.get('/api/empleado/:codigoempleado', empleadosController.getOneByCodigo);
   
};

