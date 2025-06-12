require('dotenv').config();
const express      = require('express');
const bodyParser   = require('body-parser');
const http         = require('http');
const socketIO     = require('socket.io');
const session      = require('express-session');
const cors         = require('cors');

const app = express();

// ——————————————————————————————
// 1) Middlewares de Express
// ——————————————————————————————
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// — Nuevos: CORS y sesiones — 
app.use(cors({
  origin: 'http://localhost:4200',    // tu front de Angular
  credentials: true,                  // habilita cookies
  methods: ['GET','POST','PUT','DELETE','OPTIONS']
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'cambia_esto_por_un_secreto_real',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'lax',   // o 'none' si sirves en HTTPS y necesitas cross-site
    secure: false      // true si usas HTTPS
  }
}));

// ——————————————————————————————
// 1.1) Middleware de autenticación
// ——————————————————————————————
function ensureAuth(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  return res.status(401).send({ message: 'No autorizado' });
}

// ——————————————————————————————
// 2) Rutas REST de tu aplicación
// ——————————————————————————————
require('./server/routes/usuarios')(app);
require('./server/routes/gestionclientes')(app);
require('./server/routes/cargoempleados')(app);

app.use('/api/gestionempleados', ensureAuth);
require('./server/routes/empleados')(app);


require('./server/routes/administrador')(app);

// ——————————————————
// Protegemos proveedor
// ——————————————————
app.use('/api/proveedor', ensureAuth);
require('./server/routes/proveedor')(app);

app.use('/api/productos', ensureAuth);
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
require('./server/routes/reserva_producto')(app);


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

app.set('io', io);

// ——————————————————————————————
// 4) Manejo de conexiones Socket.IO
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

const { checkExpiracionesYNotificar } = require('./server/controllers/notificaciones');

// Al arrancar el servidor, lanzamos la primera comprobación:
setImmediate(() => checkExpiracionesYNotificar(io));

// Luego, repetimos cada 24 horas:
setInterval(() => checkExpiracionesYNotificar(io), 24 * 60 * 60 * 1000);

// **Importante**: exportamos `app` y `server`.
// www.js se encargará de llamar a `server.listen(...)`.
module.exports = { app, server };
