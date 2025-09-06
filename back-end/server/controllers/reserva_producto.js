const { reservas, productos, reserva_producto, sequelize } = require('../models');

async function listarPorReserva(req, res) {
  const { idreserva } = req.params;
  try {
    const items = await reserva_producto.findAll({
      where: { idreserva },
      include: [{ model: productos, as: 'producto' }],
      order: [['id', 'ASC']]
    });
    return res.json(items.map(i => ({
      producto: {
        idproducto: i.producto.idproducto,
        nombre:     i.producto.nombre,
        stock:      i.producto.stock,         
        unidad_stock:  i.producto.unidad_stock 
      },
      cantidad: i.cantidad
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function agregarAReserva(req, res) {
  const { idreserva } = req.params;
  const { idproducto, cantidad } = req.body;
  const t = await sequelize.transaction();
  try {
    const prod = await productos.findByPk(idproducto, { transaction: t, lock: true });
    if (!prod) throw new Error('Producto no existe');
    if (prod.stock < cantidad) {
      await t.rollback();
      return res.status(400).json({ message: 'Stock insuficiente' });
    }

    const nuevo = await reserva_producto.create({
      idreserva,
      idproducto,
      cantidad
    }, { transaction: t });

    await prod.update({ stock: prod.stock - cantidad }, { transaction: t });
    await t.commit();

    const creado = await reserva_producto.findByPk(nuevo.id, {
      include: [{ model: productos, as: 'producto' }]
    });
    return res.status(201).json({
      producto: {
        idproducto: creado.producto.idproducto,
        nombre:     creado.producto.nombre,
        stock:        creado.stock,
        unidad_stock: creado.unidad_stock
      },
      cantidad: creado.cantidad
    });

  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function restarProductoReserva(req, res) {
  const { idreserva } = req.params;
  const { idproducto, cantidad } = req.body;
  const t = await sequelize.transaction();
  try {
    // 1) Buscamos el registro existente
    const registro = await reserva_producto.findOne({
      where: { idreserva, idproducto },
      transaction: t,
      lock: true
    });
    if (!registro) {
      await t.rollback();
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    if (registro.cantidad < cantidad) {
      await t.rollback();
      return res.status(400).json({ message: 'Cantidad a restar mayor que asignada' });
    }

    // 2) Reducimos la cantidad o eliminamos si queda a 0
    const nuevaCant = registro.cantidad - cantidad;
    if (nuevaCant > 0) {
      await registro.update({ cantidad: nuevaCant }, { transaction: t });
    } else {
      await registro.destroy({ transaction: t });
    }

    // 3) Devolvemos stock al producto
    const prod = await productos.findByPk(idproducto, { transaction: t, lock: true });
    await prod.update({ stock: prod.stock + cantidad }, { transaction: t });

    await t.commit();

    // 4) Devolvemos al frontend el nuevo estado
    return res.json({
      producto: {
        idproducto: prod.idproducto,
        nombre:     prod.nombre,
        stock:        prod.stock,        
        unidad_stock: prod.unidad_stock
      },
      cantidad: nuevaCant
    });

  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function eliminarProductoReserva(req, res) {
  const { idreserva, idproducto } = req.params;
  const t = await sequelize.transaction();
  try {
    // 1) Buscamos el registro
    const registro = await reserva_producto.findOne({
      where: { idreserva, idproducto },
      transaction: t,
      lock: true
    });
    if (!registro) {
      await t.rollback();
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    const cantidadAsignada = registro.cantidad;

    // 2) Eliminamos el registro
    await registro.destroy({ transaction: t });

    // 3) Devolvemos stock al producto
    const prod = await productos.findByPk(idproducto, { transaction: t, lock: true });
    await prod.update({ stock: prod.stock + cantidadAsignada }, { transaction: t });

    await t.commit();
    return res.status(204).send();

  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  listarPorReserva,
  agregarAReserva,
  restarProductoReserva,
  eliminarProductoReserva
};