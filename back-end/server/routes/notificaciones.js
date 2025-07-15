
const notController = require('../controllers').notificaciones;
module.exports = (app) => {

  
  const modelos = require('../models');
  const { Op } = require('sequelize');

  // Listar notificaciones de un cliente
  app.get('/api/notificaciones/cliente/:codigocliente', async (req, res) => {
  try {
    const { codigocliente } = req.params;
    const notis = await modelos.notificaciones.findAll({
       where: {
         codigocliente,
         leida: false,
         tipo: { [Op.notIn]: ['CANCELACION', 'EXPIRACION',  'PAGO' ] }   // excluimos cancelaciones y expiraciones
       },
      order: [['creado_en', 'ASC']]
    });
    return res.json(notis);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});


  app.put('/api/notificaciones/:id/leer', async (req, res) => {
    try {
      const { id } = req.params;
      await modelos.notificaciones.update(
        { leida: true },
        { where: { id } }
      );
      return res.sendStatus(204);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Marcar todas las notificaciones de un cliente como leídas
  app.put('/api/notificaciones/cliente/:codigocliente/leer', async (req, res) => {
    try {
      const { codigocliente } = req.params;
      await modelos.notificaciones.update(
        { leida: true },
        { where: { codigocliente } }
      );
      return res.sendStatus(204);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/reservas/cancelaciones/admin/leer', async (req, res) => {
  try {
    await modelos.notificaciones.update(
      { leida: true },
      { where: { tipo: 'CANCELACION' } }
    );
    return res.sendStatus(204);
  } catch (err) {
    console.error('Error al marcar cancelaciones como leídas:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/notificaciones/expiraciones/admin/leer', async (req, res) => {
  try {
    await modelos.notificaciones.update(
      { leida: true },
      { where: { tipo: 'EXPIRACION' } }
    );
    return res.sendStatus(204);
  } catch (err) {
    console.error('Error al marcar expiraciones como leídas:', err);
    return res.status(500).json({ error: err.message });
  }
});

 app.get('/api/notificaciones/expiraciones/admin', notController.listExpiraciones);

};

