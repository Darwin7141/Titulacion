const models = require('../models'); // Importa tus modelos (Sequelize index.js)

async function create(req, res) {
  try {
    // Suponiendo que recibes en el body:
    // { idreserva, idmenu, cantpersonas, preciounitario, subtotal }
    const { idreserva, idmenu, cantpersonas, preciounitario, subtotal } = req.body;

    // Puedes validar datos aquí si gustas

    // Insertar un nuevo detalle
    const newDetalle = await models.detalle_reserva.create({
      idreserva,
      idmenu,
      cantpersonas,
      preciounitario,
      subtotal
    });

    return res.status(201).json(newDetalle);
  } catch (err) {
    console.error('Error al crear detalle_reserva:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    // ID del detalle en la URL => /api/detalle-reserva/:iddetalle
    const { iddetalle } = req.params;

    // Buscar el detalle
    const detalle = await models.detalle_reserva.findByPk(iddetalle);
    if (!detalle) {
      return res.status(404).json({ message: 'Detalle no encontrado' });
    }

    // Actualizar campos (puedes filtrar campos si gustas)
    await detalle.update(req.body);

    return res.status(200).json({
      message: 'Detalle actualizado exitosamente',
      detalle
    });
  } catch (err) {
    console.error('Error al actualizar detalle_reserva:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function eliminar(req, res) {
  try {
    const { iddetalle } = req.params;
    const detalle = await models.detalle_reserva.findByPk(iddetalle);
    if (!detalle) {
      return res.status(404).json({ message: 'Detalle no encontrado' });
    }

    await detalle.destroy();
    return res.status(200).json({ message: 'Detalle eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar detalle_reserva:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function getAll(req, res) {
  try {
    // Listar todos los detalles, con joins
    const detalles = await models.detalle_reserva.findAll({
      include: [
        {
          model: models.reservas,
          as: 'reserva',
          // attributes: ['fechaevento', 'codigocliente'], // si quieres filtrar
        },
        {
          model: models.menu,
          as: 'menu',
          // attributes: ['nombre', 'precio'], // si quieres filtrar
        }
      ]
    });

    if (detalles.length === 0) {
      return res.status(404).json({ message: 'No hay detalles de reserva' });
    }
    return res.status(200).json(detalles);
  } catch (err) {
    console.error('Error al obtener detalle_reserva:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function getOne(req, res) {
  try {
    const { iddetalle } = req.params;
    const detalle = await models.detalle_reserva.findByPk(iddetalle, {
      include: [
        { model: models.reservas, as: 'reserva' },
        { model: models.menu, as: 'menu' }
      ]
    });
    if (!detalle) {
      return res.status(404).json({ message: 'Detalle no encontrado' });
    }
    return res.status(200).json(detalle);
  } catch (err) {
    console.error('Error al obtener detalle_reserva:', err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  create,
  update,
  eliminar,
  getAll,
  getOne
};
