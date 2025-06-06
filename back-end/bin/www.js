const http = require('http');
// Importamos tanto `app` como `server` desde el app.js modificado:
const { app, server } = require('../app');

const port = parseInt(process.env.PORT, 10) || 8010;
app.set('port', port);

// Ya no creamos otro server aquí, porque `server` viene de app.js:
server.listen(port, () => {
  console.log(`🚀 Servidor Express + Socket.IO escuchando en puerto ${port}`);
});

server.on('error', (error) => {
  console.error('Error en el servidor:', error);
});

server.on('listening', () => {
  const addr = server.address();
  console.log(`→ Escuchando en ${typeof addr === 'string' ? addr : addr.port}`);
});