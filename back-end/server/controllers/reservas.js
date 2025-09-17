const { Op } = require('sequelize');
const modelos = require('../models');
const { validarCedulaEcuador, validarEmail, validarTelefono } = require('../utils/validaciones'); 
const { enviarNotificacionReserva } = require('../controllers/contacto');
const { fn, col, literal } = require('sequelize');
const sequelize = modelos.sequelize; 

async function create(req, res) {
  const io = req.app.get('io');
  const {
    fechaevento,
    codigocliente,
    direccionevento,
    cantpersonas,
    total,
    primer_pago,
    segundo_pago,
    idestado,
    saldo_pendiente,  // puede venir vacío
    detalle
  } = req.body;

  let reservaCreada = null; 
  try {
    // 1) Si no hay idestado, asignar el estado "Solicitada"
    let estadoParaInsertar = idestado;
    if (!estadoParaInsertar) {
      // Busca en la tabla estado_reserva aquel que tenga estado_reserva = "Solicitada"
      const estadoSolicitada = await modelos.estado_reserva.findOne({
        where: { estado_reserva: 'Solicitada' }
      });
      if (!estadoSolicitada) {
        return res.status(400).json({
          message: 'No existe el estado "Solicitada" en la tabla estado_reserva.'
        });
      }
      estadoParaInsertar = estadoSolicitada.idestado;
    }

    // 2) Generar idreserva (código interno como "R001", "R002", etc.)
    const lastReserva = await modelos.reservas.findOne({ order: [['idreserva', 'DESC']] });
    let nextCodigo = 'R001';
    if (lastReserva && lastReserva.idreserva) {
      const lastNumber = parseInt(lastReserva.idreserva.slice(1), 10);
      nextCodigo = 'R' + String(lastNumber + 1).padStart(3, '0');
    }

    // 3) Crear la reserva en la tabla "reservas"
    reservaCreada = await modelos.reservas.create({
      idreserva: nextCodigo,
      fechaevento,
      codigocliente,
      direccionevento,
      cantpersonas,
      total,
      primer_pago,
      segundo_pago,
      saldo_pendiente,
      idestado: estadoParaInsertar
    });

    // 4) Crear los detalles en "detalle_reserva"
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


    setImmediate(async () => {
      try {
        // 1) Cargar datos del cliente (solo campos necesarios)
        const cliente = await modelos.clientes.findOne({
          where: { codigocliente },
          attributes: ['ci', 'nombre', 'telefono', 'direccion', 'e_mail']
        });

        // 2) Cargar detalles de menú para esta reserva
        const detallesReservas = await modelos.detalle_reserva.findAll({
          where: { idreserva: nextCodigo },
          include: [{ model: modelos.menu, as: 'menu', attributes: ['nombre'] }]
        });

        const menusDetalle = detallesReservas.map(dr => ({
          nombre:         dr.menu.nombre,
          cantpersonas:   dr.cantpersonas,
          precioUnitario: dr.preciounitario,
          subtotal:       dr.subtotal
        }));

        // 3) Llamar a la función que envía correo + WhatsApp
        await enviarNotificacionReserva({
          idreserva:    nextCodigo,
          codigocliente,
          fechaevento,
          direccionevento,
          total,
          menusDetalle,
          datosCliente: cliente  // { ci, nombre, telefono, direccion, e_mail }
        });
      } catch (errNotif) {
        console.error('Error al notificar empresa (create):', errNotif);
      }
    });


    await modelos.notificaciones.create({
  codigocliente: codigocliente,
  tipo:          'RESERVA',
  mensaje:       `Tienes una nueva reserva con código: ${nextCodigo}`,
  idreserva:     nextCodigo,
  leida:         false
});

    // 6) Emitimos un evento global “nueva-reserva” para que el ADMIN escuchando
    io.emit('nueva-reserva', {
  idreserva:    nextCodigo,
  codigocliente,
  mensaje:      `Se creó la reserva ${nextCodigo}`,
  timestamp:    new Date()
});

    return res.status(201).json({
      message: 'Reserva creada con detalle',
      idreserva: nextCodigo
    });

  } catch (err) {
    console.error('Error al crear la reserva o sus detalles:', err);

    // ROLLBACK si ya se creó la reserva
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

  const t = await sequelize.transaction();
  let clienteCreado = null;
  let reservaCreada = null;

  try {
    // ================ CREACIÓN DE CLIENTE ================
    const { ci, nombre, telefono, direccion, e_mail, idprecliente } = req.body;

    const enlacePre = await modelos.cuenta_preclientes.findByPk(
     idprecliente,
     { transaction: t }
   );
   if (!enlacePre) {
     await t.rollback();
     return res.status(400).json({ message: 'El pre-cliente no tiene cuenta asociada.' });
   }
   const idCuenta = enlacePre.idcuenta;
    // Generar un nuevo codigocliente
    const lastCliente = await modelos.clientes.findOne({ order: [['codigocliente','DESC']],
      transaction: t
     });
    let nextCodigoCliente = 'CL001';
    if (lastCliente && lastCliente.codigocliente) {
      const lastNum = parseInt(lastCliente.codigocliente.slice(2), 10);
      nextCodigoCliente = 'CL' + String(lastNum + 1).padStart(3, '0');
    }

    // Insertar el nuevo cliente
    clienteCreado = await modelos.clientes.create({
      codigocliente: nextCodigoCliente,
      ci,
      nombre,
      direccion,
      e_mail,
      telefono,
      idprecliente,
      rol: 3
    }, { transaction: t });

    await modelos.cuenta_clientes.create({
     id_cliente: clienteCreado.codigocliente,   // 'CLxxx'
     id_cuenta : idCuenta                       // 'CUxxx'
   }, { transaction: t });

    // ================ CREACIÓN DE RESERVA ================
    const {
      fechaevento,
      direccionevento,
      cantpersonas,
      total,
      primer_pago,
      segundo_pago,
      idestado,
      saldo_pendiente,  // puede venir vacío
      detalle
    } = req.body;

    // 1) Si no hay idestado, asignar "Solicitada"
    let estadoParaInsertar = idestado;
    if (!estadoParaInsertar) {
      const estadoSolicitada = await modelos.estado_reserva.findOne({
        where: { estado_reserva: 'Solicitada' }
        , transaction: t
      });
      if (!estadoSolicitada) {
        return res.status(400).json({
          message: 'No existe el estado "Solicitada" .'
        });
      }
      estadoParaInsertar = estadoSolicitada.idestado;
    }

    // Generar un nuevo id de reserva
    const lastReserva = await modelos.reservas.findOne({ order: [['idreserva','DESC']],
      transaction: t
     });
    let nextCodigoReserva = 'R001';
    if (lastReserva && lastReserva.idreserva) {
      const lastNumber = parseInt(lastReserva.idreserva.slice(1), 10);
      nextCodigoReserva = 'R' + String(lastNumber + 1).padStart(3,'0');
    }

    // Insertar la reserva
    reservaCreada = await modelos.reservas.create({
      idreserva: nextCodigoReserva,
      fechaevento,
      codigocliente: nextCodigoCliente, 
      direccionevento,
      cantpersonas,
      total,
      primer_pago,
      segundo_pago,
      saldo_pendiente,
      idestado: estadoParaInsertar
    },{ transaction: t });

    // 2) Insertar los detalles
    if (Array.isArray(detalle)) {
      for (const d of detalle) {
        await modelos.detalle_reserva.create({
          idreserva: nextCodigoReserva,
          idmenu: d.idmenu,
          cantpersonas: d.cantpersonas,
          preciounitario: d.preciounitario,
          subtotal: d.subtotal
        },{ transaction: t });
      }
    }

    // ================ Actualizar rol en cuentasusuarios ================
    await modelos.cuentasusuarios.update(
      { rol: 3 },                       // 3 = cliente
      { where: { idcuenta: idCuenta } , transaction: t }
    );

    await t.commit();

    setImmediate(async () => {
      try {
        // 1) Los datos del cliente que acabamos de crear:
        const datosCliente = {
          ci:       ci,
          nombre:   nombre,
          telefono: telefono,
          direccion:direccion,
          e_mail:   e_mail
        };

        // 2) Obtener detalles del menú recién guardados:
        const detallesReservas = await modelos.detalle_reserva.findAll({
          where: { idreserva: nextCodigoReserva },
          include: [{ model: modelos.menu, as: 'menu', attributes: ['nombre'] }]
        });
        const menusDetalle = detallesReservas.map(dr => ({
          nombre:         dr.menu.nombre,
          cantpersonas:   dr.cantpersonas,
          precioUnitario: dr.preciounitario,
          subtotal:       dr.subtotal
        }));

        const io = req.app.get('io');
io.to('ADMIN').emit('nueva-reserva', {
  idreserva:  nextCodigoReserva,
  codigocliente: nextCodigoCliente,
  mensaje:    `Nueva reserva ${nextCodigoReserva} por ${nextCodigoCliente}`,
  timestamp:  new Date().toISOString()
});

        await enviarNotificacionReserva({
          idreserva:    nextCodigoReserva,
          codigocliente: nextCodigoCliente,
          fechaevento,
          direccionevento,
          total,
          menusDetalle,
          datosCliente
        });
      } catch (errNotif) {
        console.error('Error al notificar empresa (createClienteYReserva):', errNotif);
      }
    });

    return res.status(201).json({
      message: 'Cliente y reserva creados exitosamente ',
      codigocliente: nextCodigoCliente,
      idreserva: nextCodigoReserva,
      cliente: {
        ci,
        nombre,
        telefono,
        direccion,
        e_mail,
        codigocliente: nextCodigoCliente
      }
    });

  } catch (error) {

    await t.rollback();
    console.error('Error al crear la reserva', error);

    // ROLLBACK MANUAL
    try {
      if (reservaCreada) {
        await modelos.reservas.destroy({ where: { idreserva: reservaCreada.idreserva } });
      }
      if (clienteCreado) {
        await modelos.clientes.destroy({ where: { codigocliente: clienteCreado.codigocliente } });
      }
    } catch (errRB) {
      console.error('Error al hacer :', errRB);
    }

    return res.status(500).json({
      message: 'Ocurrió un error al crear el cliente.',
      error: error.message
    });
  }
}




// ======================== MÉTODO update ========================
// controllers/reservas.js
async function update(req, res) {
  const io = req.app.get('io');
  const { idreserva } = req.params;
  const {
    fechaevento,
    direccionevento,
    cantpersonas,
    total,
    primer_pago,
    segundo_pago,
    idestado,
    saldo_pendiente,
    detalle
  } = req.body;

  try {
    // 1) Buscar la reserva
    const reserva = await modelos.reservas.findOne({ where: { idreserva } });
    if (!reserva) {
      return res.status(404).json({ message: 'Reserva no encontrada.' });
    }

    // 2) Actualizar los campos básicos
    await reserva.update({
      fechaevento:     fechaevento     ?? reserva.fechaevento,
      direccionevento: direccionevento ?? reserva.direccionevento,
      cantpersonas:    cantpersonas    ?? reserva.cantpersonas,
      total:           total           ?? reserva.total,
      primer_pago:     primer_pago     ?? reserva.primer_pago,
      segundo_pago:    segundo_pago    ?? reserva.segundo_pago,
      saldo_pendiente: saldo_pendiente ?? reserva.saldo_pendiente,
      idestado:        idestado !== undefined ? idestado : reserva.idestado
    });

    // 3) Si cambió el estado, creamos la notificación
   if (idestado !== undefined) {
  const id = Number(idestado);

  const mapMsg = {
    2: `Su reserva ${idreserva} ha sido aceptada. Por favor realice el abono inicial.`,
    3: `Su reserva ${idreserva} se encuentra en proceso.`,
    4: `Su reserva ${idreserva} ha sido cancelada.`,
    5: `Su reserva ${idreserva} ha sido pagada. ¡Gracias por preferirnos!`
  };

  const mensajeNotificacion =
    mapMsg[id] ?? `Su reserva ${idreserva} cambió de estado.`; // fallback

  const nuevaNoti = await modelos.notificaciones.create({
    codigocliente: reserva.codigocliente,
    tipo: 'ESTADO',
    mensaje: mensajeNotificacion,
    idreserva,
    leida: false
  });

  io.to(`cliente_${reserva.codigocliente}`).emit('cambio-estado', {
    id:        nuevaNoti.id,
    idreserva,
    codigocliente: reserva.codigocliente,
    mensaje:   mensajeNotificacion,
    timestamp: nuevaNoti.creado_en
  });
}

    // 4) (Opcional) Reemplazar detalles si vienen en el body
    if (Array.isArray(detalle)) {
      await modelos.detalle_reserva.destroy({ where: { idreserva } });
      for (const d of detalle) {
        await modelos.detalle_reserva.create({
          idreserva,
          idmenu:        d.idmenu,
          cantpersonas:  d.cantpersonas,
          preciounitario:d.preciounitario,
          subtotal:      d.subtotal
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
        as: 'cliente',
        attributes: ['codigocliente', 'nombre', 'ci']
      },
      {
        model: modelos.estado_reserva,
        as: 'nombre',
        attributes: ['estado_reserva']
      },
    ],
    order: [['idreserva', 'ASC']]
  })
  .then(reservas => {
    // Ya no devolvemos 404 cuando reservas.length === 0
    return res.status(200).json(reservas);
  })
  .catch(err => {
    console.error("Error al obtener las reservas:", err);
    return res.status(500).json({
      message: "Ocurrió un error al obtener las reservas.",
      error: err.message
    });
  });
}
async function getByCliente(req, res) {
  const { codigocliente } = req.params;
  try {
    const reservas = await modelos.reservas.findAll({
      where: { codigocliente },
      include: [
        {
          model: modelos.detalle_reserva,
          as: 'detalles',
          include: [{ model: modelos.menu, as: 'menu' }]
        },
        {
          model: modelos.estado_reserva,
          as: 'nombre',  // alias en el modelo
          attributes: ['estado_reserva']
        }
      ]
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

// Procesar el primer pago
// Procesar el primer pago
async function procesarPrimerPago(req, res) {
  

  const io = req.app.get('io');
  const idreserva = req.params.idreserva;
  // Y montoPago lo extraemos del body:
  const { montoPago } = req.body;

  console.log('Llegó una petición a procesarPrimerPago. idreserva en req.params:', idreserva);
  console.log('Monto a pagar:', montoPago);

  try {
    // Ahora sí buscamos correctamente:
    const reserva = await modelos.reservas.findByPk(idreserva);
    if (!reserva) {
      return res.status(404).json({ message: 'Reserva no encontrada.' });
    }

    // ── calcular nuevo saldo pendiente ──
    const saldoPendiente = reserva.total - montoPago;
    if (saldoPendiente < 0) {
      return res.status(400).json({ message: 'Monto mayor que el total de la reserva.' });
    }

    // ── actualizar la fila en BD ──
    const updated = await reserva.update({
      primer_pago:     montoPago,             // guardamos el primer pago
      saldo_pendiente: saldoPendiente,        // lo que falta aún
     
    });


    await modelos.notificaciones.create({
      codigocliente: reserva.codigocliente,
      tipo: 'PAGO',
      mensaje: `El cliente ${reserva.codigocliente} realizó primer pago de $${montoPago.toFixed(2)} en la reserva ${idreserva}.`,
      idreserva,
      leida: false
    });

    const cliente = await modelos.clientes.findOne({
      where:      { codigocliente: reserva.codigocliente },
      attributes: ['nombre']
    });
    const nombreCliente = cliente ? cliente.nombre : 'Desconocido';

    // 2) Emitir evento por socket para el ADMIN
    io.emit('nuevo-pago', {
      idreserva,
      codigocliente: reserva.codigocliente,
      clienteNombre: nombreCliente, 
      montoPago,
      tipoPago: 'PRIMER_PAGO',
       mensaje:       `El cliente "${nombreCliente}" realizó el primer pago de la reserva ${idreserva}.`,
      timestamp: new Date()
    });

    console.log('>> Reserva actualizada en BD:', updated);

    return res.status(200).json({ message: 'Primer pago registrado.', reserva: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Error al procesar el primer pago',
      error: err.message
    });
  }
}

// Procesar el segundo pago
async function procesarSegundoPago(req, res) {
  

  const io = req.app.get('io');
  const idreserva = req.params.idreserva;
  const { montoPago } = req.body; 

  console.log('Llegó una petición a procesarSegundoPago. idreserva:', idreserva, 'montoPago:', montoPago);

  try {
    const reserva = await modelos.reservas.findByPk(idreserva);
    if (!reserva) {
      return res.status(404).json({ message: 'Reserva no encontrada.' });
    }

    // Verificar que el montoPago coincida exactamente con el saldo pendiente actual
    if (montoPago !== reserva.saldo_pendiente) {
      return res.status(400).json({ message: 'El monto no coincide con el saldo pendiente.' });
    }

    // ── guardamos el segundo pago y actualizamos estado ──
    const updated = await reserva.update({
      segundo_pago:    montoPago,
      saldo_pendiente: 0,
      
    });

    const cliente = await modelos.clientes.findOne({
      where:      { codigocliente: reserva.codigocliente },
      attributes: ['nombre']
    });
    const nombreCliente = cliente ? cliente.nombre : 'Desconocido';

    io.to('ADMIN').emit('nuevo-pago-final', {
      idreserva:     idreserva,
      codigocliente: reserva.codigocliente,
      clienteNombre: nombreCliente,        // ← Aquí va el nombre
      tipoPago:      'SEGUNDO_PAGO',
      montoPago,
      mensaje:       `El cliente "${nombreCliente}" completó el pago final de la reserva ${idreserva}.`,
      timestamp:     new Date().toISOString()
    });


    await modelos.notificaciones.create({
      codigocliente: reserva.codigocliente,
      tipo: 'PAGO',
      mensaje: `El cliente ${reserva.codigocliente} realizó segundo pago de $${montoPago.toFixed(2)} en la reserva ${idreserva}.`,
      idreserva,
      leida: false
    });

    // 2) Emitir evento a todos los sockets (admin) de “nuevo-pago-final”
    io.emit('nuevo-pago-final', {
      idreserva,
      codigocliente: reserva.codigocliente,
      montoPago,
      tipoPago: 'SEGUNDO_PAGO',
      timestamp: new Date()
    });

    

    return res.status(200).json({ message: 'Segundo pago registrado.', reserva: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Error al procesar el segundo pago',
      error: err.message
    });
  }
}


async function procesarPagoConTarjeta(req, res) {
  const { idreserva } = req.params;
  const { montoPago, detallesTarjeta } = req.body;  // Recibimos montoPago y los detalles de la tarjeta

  // Simular la verificación del pago con tarjeta (aquí iría la integración con tu sistema de pago real)
  try {
    // Verificar los datos de la tarjeta (se puede integrar con una API externa como Stripe, por ejemplo)
    const { numeroTarjeta, fechaExpiracion, cvc, titular, pais } = detallesTarjeta;
    
    // Simulación de verificación del pago (esto sería donde haces una llamada a un sistema de pago real)
    const pagoExitoso = true;  // Simulando un pago exitoso

    if (!pagoExitoso) {
      return res.status(400).json({ message: 'Error al procesar el pago con tarjeta' });
    }

    // Obtener la reserva
    const reserva = await modelos.reservas.findOne({ where: { idreserva } });
    if (!reserva) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    // Actualizar la reserva con el pago realizado
    await reserva.update({
      primer_pago: montoPago,  // Actualiza el pago realizado
      segundo_pago: reserva.total - montoPago,  // Actualiza el saldo pendiente
    });

    return res.status(200).json({
      message: 'Pago con tarjeta procesado exitosamente',
      reserva
    });

  } catch (err) {
    console.error('Error al procesar el pago con tarjeta:', err);
    return res.status(500).json({
      message: 'Hubo un error al procesar el pago con tarjeta',
      error: err.message
    });
  }
}

async function getNotificacionesPorCliente(req, res) {
  const { codigocliente } = req.params;
  try {
    const notis = await modelos.notificaciones.findAll({
      where: {
        codigocliente,
        leida: false,
        // ⇣ excluimos las cancelaciones ⇣
        tipo: { [Op.ne]: 'CANCELACION' }
      },
      order: [['creado_en', 'ASC']]
    });
    return res.status(200).json(notis);
  } catch (err) {
    console.error('Error al cargar notificaciones del cliente:', err);
    return res.status(500).json({ message: 'Error al cargar notificaciones.' });
  }
}

async function solicitarCancelacion(req, res) {
  const io = req.app.get('io');
  const { idreserva, codigocliente } = req.body;

  try {
    // 1) Obtenemos nombre del cliente
    const cliente = await modelos.clientes.findOne({
      where: { codigocliente },
      attributes: ['nombre']
    });
    const nombreCliente = cliente?.nombre || 'Cliente desconocido';

    // 2) Construimos el mensaje
    const mensaje = `El cliente ${nombreCliente} ha solicitado cancelar la reserva con código ${idreserva}.`;

    // 3) **Volvemos a persistirlo** en la BD
    await modelos.notificaciones.create({
      codigocliente,      // eso no le llega al cliente porque él no consulta cancelaciones
      tipo: 'CANCELACION',
      mensaje,
      idreserva,
      leida: false
    });

    // 4) Emitimos sólo al canal ADMIN
    io.to('ADMIN').emit('nueva-notificacion', {
      id:        idreserva,          // aquí podrías usar el id real de la fila si prefieres
      mensaje,
      timestamp: new Date().toISOString()
    });

    // 5) Respondemos OK al cliente
    return res.status(200).json({ ok: true, message: 'Solicitud de cancelación enviada.' });
  }
  catch (err) {
    console.error('ERROR solicitarCancelacion:', err);
    return res.status(500).json({ ok: false, message: 'Error interno al procesar la solicitud.' });
  }
}

async function getCancelacionesAdmin(req, res) {
  try {
    const cancelaciones = await modelos.notificaciones.findAll({
      where: { tipo: 'CANCELACION', leida: false },
      attributes: ['id','mensaje','creado_en'],
      order: [['creado_en','ASC']]
    });
    return res.status(200).json(cancelaciones);
  } catch (err) {
    console.error('Error al cargar cancelaciones:', err);
    return res.status(500).json({ message: 'Error interno al cargar cancelaciones.' });
  }
}



/**
 * GET  /api/dashboard/reservas-6m
 * Devuelve [{ mes:'2024-03', total:12 }, … ] (últimos 6 meses)
 */
async function getReservasUltimosSeisMeses(req, res) {
  try {
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5); // incluye mes actual

    const datos = await modelos.reservas.findAll({
      attributes: [
        /* YYYY-MM para agrupar */
        [fn('to_char', col('fechaevento'), 'YYYY-MM'), 'mes'],
        [fn('COUNT', col('*')),             'total']
      ],
      where: { fechaevento: { [Op.gte]: seisMesesAtras } },
      group: [literal('mes')],
      order: [literal('mes')]
    });

    return res.status(200).json(datos);
  } catch (err) {
    console.error('Error getReservasUltimosSeisMeses:', err);
    return res.status(500).json({ message:'Error al obtener datos', error:err.message });
  }
}


async function getServiciosMasReservados(req, res) {
  try {
    const limite = parseInt(req.query.limit || '5', 10);

    const lista = await modelos.detalle_reserva.findAll({
      attributes:[
        [col('menu->servicio.nombre'), 'nombre'],
        [fn('COUNT', col('detalle_reserva.idmenu')), 'total']
      ],
      include:[{
        model: modelos.menu,
        as:   'menu',
        attributes:[],
        include:[{
          model: modelos.servicios,
          as:   'servicio',
          attributes:[]
        }]
      }],
      group:[col('menu->servicio.nombre')],
      order:[[literal('total'), 'DESC']],
      limit: limite
    });

    return res.status(200).json(lista);
  } catch (err) {
    console.error('Error getServiciosMasReservados:', err);
    return res.status(500).json({ message:'Error al obtener top servicios', error:err.message });
  }
}

async function listFechas(req, res) {
  try {
    const filas = await modelos.reservas.findAll({
      attributes: ['idreserva', 'fechaevento'],
      order: [['fechaevento', 'ASC']]
    });
    // devolvemos tal cual; el front hace el slice(0,10)
    return res.json(filas);
  } catch (e) {
    console.error('GET /api/reservas/fechas >', e);
    return res.status(500).json({ message: 'Error al listar fechas de reservas' });
  }
}


module.exports = {
    create,
    update,
    eliminar,
    getAll,
    getByCliente,
    createClienteYReserva,
    getOne,
    procesarPrimerPago,
    procesarSegundoPago,
    procesarPagoConTarjeta,
    getNotificacionesPorCliente,
    solicitarCancelacion,
    getCancelacionesAdmin,
    getReservasUltimosSeisMeses,
    getServiciosMasReservados,
    listFechas

  };