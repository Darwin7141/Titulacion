require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIO = require('socket.io');

const app = express();

// ——————————————————————————————
// 1) Middlewares de Express
// ——————————————————————————————
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Cabeceras CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

// ——————————————————————————————
// 2) Rutas REST de tu aplicación
// ——————————————————————————————
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
require('./server/routes/estado_reserva')(app);
require('./server/routes/notificaciones')(app);

// Ruta catch‐all
app.get('*', (req, res) => {
  res.status(200).send({ message: 'Bienvenido al servidor NodeJS' });
});

// ——————————————————————————————
// 3) Creamos el servidor HTTP aquí, pero NO lo `listen`
//    Lo exportamos para que sea www.js quien ejecute `listen`.
// ——————————————————————————————
const server = http.createServer(app);
const io = new socketIO.Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Hacemos que, desde cualquier controlador, podamos obtener `io` con `req.app.get('io')`
app.set('io', io);

// ——————————————————————————————
// 4) Manejo básico de conexiones/desconexiones en Socket.IO
// ——————————————————————————————
io.on('connection', (socket) => {
  console.log(`🔌 [Socket.IO] Cliente conectado: ${socket.id}`);

  socket.on('identificar-cliente', (codigocliente) => {
    const sala = `cliente_${codigocliente}`;
    socket.join(sala);
    console.log(`👉 Socket ${socket.id} se unió a la sala: ${sala}`);
  });

  socket.on('identificar-admin', () => {
    socket.join('ADMIN');
    console.log(`👉 Socket ${socket.id} se unió a la sala: ADMIN`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ [Socket.IO] Cliente desconectado: ${socket.id}`);
  });
});

// **Importante**: exportamos `app` y `server`.  
// www.js se encargará de llamar a `server.listen(...)`.
module.exports = { app, server };