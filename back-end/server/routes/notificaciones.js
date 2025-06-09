module.exports = (app) => {
  const modelos = require('../models');

  // Listar notificaciones de un cliente
  app.get('/api/notificaciones/cliente/:codigocliente', async (req, res) => {
    try {
      const { codigocliente } = req.params;
      const notis = await modelos.notificaciones.findAll({
         where: {
        codigocliente,
        leida: false      // ← solo las que NO han sido marcadas como leídas
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

};

