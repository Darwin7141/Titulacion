const modelos = require('../models');
const { Op }    = require('sequelize');

async function checkExpiracionesYNotificar(io, diasAdelanto = 7) {
  const hoy    = new Date();
  const limite = new Date(hoy);
  limite.setDate(hoy.getDate() + diasAdelanto);

  // obtengo los productos a punto de caducar
  const proximos = await modelos.productos.findAll({
    where: {
      fecha_caducidad: {
        [Op.between]: [hoy.toISOString(), limite.toISOString()]
      }
    }
  });

  for (const prod of proximos) {
    const fechaCad = new Date(prod.fecha_caducidad);
    const ymd      = fechaCad.toISOString().slice(0,10);
    const mensaje  = `El producto ${prod.idproducto} está próximo a expirar (${ymd})`;

    // ——— sólo emito por WS al ADMIN, sin persistir en BD ———
    io.to('ADMIN').emit('nueva-notificacion', {
      id:        prod.idproducto,       // puedes usar idproducto como id
      mensaje,
      timestamp: new Date().toISOString()
    });
  }
}


async function listExpiraciones(req, res) {
  try {
    const io = req.app.get('io');
    await checkExpiracionesYNotificar(io);

    // vuelvo a recalcarlas para responder offline
    const proximos = await modelos.productos.findAll({
      where: {
        fecha_caducidad: {
          [Op.between]: [new Date().toISOString(), (() => {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            return d.toISOString();
          })()]
        }
      }
    });

    const result = proximos.map(prod => {
      const fechaCad = new Date(prod.fecha_caducidad);
      return {
        id:        prod.idproducto,
        mensaje:   `El producto ${prod.idproducto} está próximo a expirar (${fechaCad.toISOString().slice(0,10)})`,
        timestamp: fechaCad.toISOString()
      };
    });

    return res.json(result);
  } catch (err) {
    console.error('Error en listExpiraciones:', err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { checkExpiracionesYNotificar, listExpiraciones };