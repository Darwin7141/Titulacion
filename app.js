const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// Cabeceras
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers',
    "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method");
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

//rutas

require('./server/routes/usuarios')(app);
require('./server/routes/gestionclientes')(app);
require('./server/routes/cargoempleados')(app);
require('./server/routes/empleados')(app);
require('./server/routes/administrador')(app);
require('./server/routes/proveedor')(app);
require('./server/routes/productos')(app);
require('./server/routes/tipocatering')(app); 
require('./server/routes/serviciocatering')(app);
require('./server/routes/menus')(app);
require('./server/routes/estadocatering')(app);
require('./server/routes/recuperacion')(app);
require('./server/routes/preclientes')(app);
require('./server/routes/categoriaProductos')(app);
require('./server/routes/reservas')(app);
require('./server/routes/detalle_reserva')(app);
require('./server/routes/contacto')(app);

app.get('*', (req, res) => {
    res.status(200).send({ message: "Bienvenido al servidor NodeJS" });
  })

module.exports = app;