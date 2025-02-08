const modelos = require('../models');
const { validarCedulaEcuador, validarEmail, validarTelefono } = require('../utils/validaciones'); 

async function create(req, res) {
  // (QUEDA IGUAL QUE SIEMPRE)
  const { fechaevento, codigocliente, direccionevento, precio, cantpersonas, total, detalle } = req.body;
  
  let reservaCreada = null; 
  try {
    // 1) Generar idreserva
    const lastReserva = await modelos.reservas.findOne({ order: [['idreserva', 'DESC']] });
    let nextCodigo = 'R001';
    if (lastReserva && lastReserva.idreserva) {
      const lastNumber = parseInt(lastReserva.idreserva.slice(1), 10);
      nextCodigo = 'R' + String(lastNumber + 1).padStart(3, '0');
    }

    // 2) Crear la reserva (cabecera)
    reservaCreada = await modelos.reservas.create({
      idreserva: nextCodigo,
      fechaevento,
      codigocliente,
      direccionevento,
      precio,
      cantpersonas,
      total
    });

    // 3) Crear detalles en detalle_reserva
    if (Array.isArray(detalle)) {
      for (const d of detalle) {
        await modelos.detalle_reserva.create({
          idreserva: nextCodigo,
          idmenu: d.idmenu,
          cantpersonas: d.cantpersonas,
          preciounitario: d.preciounitario,
          subtotal: d.subtotal
        });
      }
    }

    // 4) Responder OK
    return res.status(201).json({
      message: 'Reserva creada con detalle',
      idreserva: nextCodigo
    });

  } catch (err) {
    console.error('Error al crear la reserva o sus detalles:', err);

    // ROLLBACK de la reserva si se creó
    if (reservaCreada) {
      try {
        await modelos.reservas.destroy({
          where: { idreserva: reservaCreada.idreserva }
        });
      } catch (errRollback) {
        console.error('Error al eliminar la reserva en rollback:', errRollback);
      }
    }

    return res.status(500).json({
      message: 'Ocurrió un error al ingresar la reserva (rollback manual).',
      error: err.message
    });
  }
}


async function createClienteYReserva(req, res) {
  let clienteCreado = null;
  let reservaCreada = null;

  try {
    // 1) EXTRAER datos para el cliente
    const { ci, nombre, telefono, direccion, e_mail, idprecliente } = req.body;
    // Opcional: Validaciones (cedula, correo, etc.)

    // 2) Crear cliente => generamos codigocliente
    const lastCliente = await modelos.clientes.findOne({ order: [['codigocliente','DESC']] });
    let nextCodigoCliente = 'CL001';
    if (lastCliente && lastCliente.codigocliente) {
      const lastNum = parseInt(lastCliente.codigocliente.slice(2), 10);
      nextCodigoCliente = 'CL' + String(lastNum + 1).padStart(3, '0');
    }

    // 3) Insertar el nuevo cliente
    clienteCreado = await modelos.clientes.create({
      codigocliente: nextCodigoCliente,
      ci,
      nombre,
      direccion,
      e_mail,
      telefono,
      idprecliente
    });

    // 4) Crear la reserva => extraer datos de reserva
    const { fechaevento, direccionevento, precio, cantpersonas, total, detalle } = req.body;

    // Generar un nuevo id de reserva
    const lastReserva = await modelos.reservas.findOne({ order: [['idreserva','DESC']] });
    let nextCodigoReserva = 'R001';
    if (lastReserva && lastReserva.idreserva) {
      const lastNumber = parseInt(lastReserva.idreserva.slice(1), 10);
      nextCodigoReserva = 'R' + String(lastNumber + 1).padStart(3,'0');
    }

    // 5) Insertar la reserva en la tabla reservas
    reservaCreada = await modelos.reservas.create({
      idreserva: nextCodigoReserva,
      fechaevento,
      codigocliente: nextCodigoCliente, // enlazamos con el cliente recién creado
      direccionevento,
      precio,
      cantpersonas,
      total
    });

    // 6) Insertar los detalles de la reserva
    if (Array.isArray(detalle)) {
      for (const d of detalle) {
        await modelos.detalle_reserva.create({
          idreserva: nextCodigoReserva,
          idmenu: d.idmenu,
          cantpersonas: d.cantpersonas,
          preciounitario: d.preciounitario,
          subtotal: d.subtotal
        });
      }
    }

    // 7) **Actualizar el rol** en la tabla cuentasusuarios
    // => Buscamos al usuario que tenía rol = "PRE001" (idprecliente),
    //    y le asignamos ahora el rol = nextCodigoCliente (ej. "CL001")
    await modelos.cuentasusuarios.update(
      { rol: nextCodigoCliente },           // Nuevo rol de cliente
      { where: { rol: idprecliente } }      // Rol anterior de precliente
    );

    

    // 8) Respuesta de éxito
    return res.status(201).json({
      message: 'Cliente y reserva creados exitosamente (con detalles)',
      codigocliente: nextCodigoCliente,
      idreserva: nextCodigoReserva,
      cliente: {
        ci: ci,
        nombre: nombre,
        telefono: telefono,
        direccion: direccion,
        e_mail: e_mail,
        codigocliente: nextCodigoCliente
      }
    });

  } catch (error) {
    console.error('Error al crear cliente/reserva/detalle:', error);

    // === ROLLBACK MANUAL ===
    try {
      if (reservaCreada) {
        await modelos.reservas.destroy({ where: { idreserva: reservaCreada.idreserva } });
      }
      if (clienteCreado) {
        await modelos.clientes.destroy({ where: { codigocliente: clienteCreado.codigocliente } });
      }
    } catch (errRB) {
      console.error('Error al hacer rollback manual:', errRB);
    }

    return res.status(500).json({
      message: 'Ocurrió un error al crear el cliente/reserva (rollback manual).',
      error: error.message
    });
  }
}




// ======================== MÉTODO update ========================
async function update(req, res) {
  const { idreserva } = req.params; // Código de la reserva desde los parámetros de la URL
  const { fechaevento, codigocliente, direccionevento, precio, cantpersonas, total, detalle } = req.body; // Datos a actualizar

  try {
    // Buscar la reserva
    const reserva = await modelos.reservas.findOne({ where: { idreserva } });
    if (!reserva) {
      return res.status(404).json({ message: 'Reserva no encontrada.' });
    }

    // Actualizar los datos de la cabecera de la reserva
    await reserva.update({
      fechaevento: fechaevento || reserva.fechaevento,
      codigocliente: codigocliente || reserva.codigocliente,
      direccionevento: direccionevento || reserva.direccionevento,
      precio: precio || reserva.precio,
      cantpersonas: cantpersonas || reserva.cantpersonas,
      total: total || reserva.total,
    });

    // Eliminar los detalles anteriores
    await modelos.detalle_reserva.destroy({ where: { idreserva } });

    // Agregar los nuevos detalles (menús seleccionados)
    if (Array.isArray(detalle)) {
      for (const d of detalle) {
        await modelos.detalle_reserva.create({
          idreserva: idreserva,
          idmenu: d.idmenu,
          cantpersonas: d.cantpersonas,
          preciounitario: d.preciounitario,
          subtotal: d.subtotal,
        });
      }
    }

    return res.status(200).json({
      message: 'Reserva actualizada exitosamente.',
      reserva
    });
  } catch (err) {
    console.error('Error al actualizar la reserva o sus detalles:', err);
    return res.status(500).json({
      message: 'Ocurrió un error al actualizar la reserva.',
      error: err.message
    });
  }
}

function eliminar(req, res) {
  const { idreserva } = req.params;

  // Buscar si el empleado existe
  modelos.reservas.findOne({
      where: { idreserva },
  })
      .then((reservas) => {
          if (!reservas) {
              // Si no existe el empleado, devolver un mensaje de error
              return res.status(404).send({ message: 'Reserva no encontrada.' });
          }

          // Eliminar el empleado
          modelos.reservas
              .destroy({
                  where: { idreserva },
              })
              .then(() => {
                  // Asegurarse de restablecer la secuencia con el valor máximo actual de codigoempleado
                  modelos.sequelize.query(`
                      SELECT setval(
                        'reservas_id_seq', 
                            COALESCE((SELECT MAX(CAST(SUBSTRING(idreserva FROM 2) AS INT)) FROM public.reservas), 0), false)`)
                      .then(([result]) => {
                          // Revisar si la consulta tuvo éxito
                          if (result) {
                              return res.status(200).send({ message: 'Reserva eliminada correctamente y secuencia restablecida.' });
                          } else {
                              console.error('No se pudo restablecer la secuencia.');
                              return res.status(500).send({ message: 'Error al restablecer la secuencia de la reserva.' });
                          }
                      })
                      .catch((err) => {
                          console.error('Error al restablecer la secuencia:', err);
                          return res.status(500).send({ message: 'Error al restablecer la secuencia de la reserva.' });
                      });
              })
              .catch((err) => {
                  console.error('Error al eliminar el producto:', err);
                  return res.status(500).send({ message: 'Ocurrió un error al eliminar la reserva.' });
              });
      })
      .catch((err) => {
          console.error('Error al buscar el producto:', err);
          return res.status(500).send({ message: 'Ocurrió un error al buscar la reserva.' });
      });
}



function getAll(req, res) {
  modelos.reservas.findAll({
    include: [

          {
            model: modelos.clientes,
            as: 'cliente', // Este alias debe coincidir con el definido en el modelo
            attributes: ['nombre'], // Seleccionar solo el campo necesario
          },  
      ],

    order: [['idreserva', 'ASC']] // Ordenar por codigocliente en orden ascendente
  })
    .then(reservas => {
      if (reservas.length === 0) {
        return res.status(404).send({ message: 'No se encontraron reservas.' });
      }
      res.status(200).send(reservas); // Enviar el listado de clientes ordenado
    })
    .catch(err => {
      console.error("Error al obtener las reservas:", err);
      res.status(500).send({ message: "Ocurrió un error al obtener las reservas.", error: err.message });
    });
}

async function getByCliente(req, res) {
  const { codigocliente } = req.params;
  try {
    const reservas = await modelos.reservas.findAll({
      where: { codigocliente },
      include: [{
        model: modelos.detalle_reserva,
        as: 'detalles',
        include: [{
          model: modelos.menu,
          as: 'menu'
        }]
      }]
    });
    res.status(200).send(reservas);
  } catch (err) {
    console.error('Error al obtener reservas del cliente:', err);
    res.status(500).send({
      message: 'Ocurrió un error al obtener las reservas del cliente.',
      error: err.message,
    });
  }
}

async function getOne(req, res) {
  const { idreserva } = req.params;
  try {
    const reserva = await modelos.reservas.findOne({
      where: { idreserva },
      include: [{
        model: modelos.detalle_reserva,
        as: 'detalles',
        include: [{ model: modelos.menu, as: 'menu' }]
      }]
    });
    if (!reserva) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    return res.status(200).json(reserva);
  } catch (err) {
    return res.status(500).json({ message: 'Error al obtener la reserva', error: err.message });
  }
}
module.exports = {
    create,
    update,
    eliminar,
    getAll,
    getByCliente,
    createClienteYReserva,
    getOne
    
  };