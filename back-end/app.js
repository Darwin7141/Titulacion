// app.js
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER;
app.set('trust proxy', 1);
// Carga .env solo en local
if (!isProd && fs.existsSync(path.join(__dirname, '.env'))) {
  dotenv.config({ path: path.join(__dirname, '.env') });
}

// Carga process.env (PayPal local) solo en local
if (!isProd && fs.existsSync(path.join(__dirname, 'process.env'))) {
  dotenv.config({ path: path.join(__dirname, 'process.env'), override: true });
}

// DEBUG opcional (quítalo luego)
console.log('[ENV check] PAYPAL_ENV=', process.env.PAYPAL_ENV);
console.log('[ENV check] CID set? ', !!process.env.PAYPAL_CLIENT_ID);
console.log('[ENV check] SEC set? ', !!process.env.PAYPAL_SECRET);

const express  = require('express');
const bodyParser = require('body-parser');
const http     = require('http');
const socketIO = require('socket.io');
const session  = require('express-session');
const cors     = require('cors');

const app = express();

// ——————————————————————————————
// 1) Middlewares de Express
// ——————————————————————————————
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// — Nuevos: CORS y sesiones —
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:4200';
app.use(cors({
  origin: FRONTEND,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS']
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'cambia_esto_por_un_secreto_real',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: isProd ? 'none' : 'lax',
    secure:   isProd ? true   : false    
  }
}));

// ——————————————————————————————
// 1.1) Middleware de autenticación
// ——————————————————————————————
function ensureAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
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

// Protegemos proveedor
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
require('./server/routes/paypal')(app);

// Ruta catch‐all
app.get('*', (_req, res) => {
  res.status(200).send({ message: 'Bienvenido al servidor NodeJS' });
});

// ——————————————————————————————
// 3) Servidor HTTP (listen lo hace www.js)
// ——————————————————————————————
const server = http.createServer(app);
const io = new socketIO.Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});
app.set('io', io);

// ——————————————————————————————
// 4) Socket.IO
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

// ——————————————————————————————
// 5) DB ready → tareas periódicas (y sync opcional)
// ——————————————————————————————
const db = require('./server/models');
const { checkExpiracionesYNotificar } = require('./server/controllers/notificaciones');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('[DB] Conectado a Postgres');

    // Sincroniza SOLO si lo pides con RUN_SYNC=true
    if (process.env.RUN_SYNC === 'true') {
      try {
        console.log('[DB] Sincronizando tablas…');
        await db.sequelize.sync({ alter: true });
        console.log('[DB] Tablas sincronizadas');
      } catch (e) {
        console.error('[DB] Sync falló:', e.message);
        // seguimos igual; no bloqueamos el servidor ni las tareas
      }
    }

  } catch (err) {
    console.error('[DB] Error de conexión:', err);
  } finally {
    // SIEMPRE corre las tareas aunque sync haya fallado
    setImmediate(() => checkExpiracionesYNotificar(io));
    setInterval(() => checkExpiracionesYNotificar(io), 24 * 60 * 60 * 1000);
  }
})();

// www.js se encargará de llamar a `server.listen(...)`.
module.exports = { app, server };
