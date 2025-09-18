const { validarCedulaEcuador, validarEmail, validarTelefono } = require('../utils/validaciones'); // Importar la función de validación
const modelos = require('../models'); // Importar los modelos
const bcrypt = require('bcrypt');
const { Op, fn, col, where } = require('sequelize');

async function create(req, res) {
  const { ci, nombre, direccion, e_mail, telefono, idprecliente } = req.body;
    const { sequelize } = modelos;
    
      let t;
  try {

    t = await sequelize.transaction();
      // Validar datos antes de la inserción
      if (!validarCedulaEcuador(ci)) {
          return res.status(400).send({ message: 'La cédula ingresada no es válida.' });
      }

      if (!validarEmail(e_mail)) {
          return res.status(400).send({ message: 'El correo ingresado no es válido.' });
      }

      if (!validarTelefono(telefono)) {
          return res.status(400).send({ message: 'El teléfono ingresado no es válido.' });
      }

      // Obtener el último valor de codigoempleado
      const lastProv = await modelos.clientes.findOne({
          order: [['codigocliente', 'DESC']],
          transaction: t
      });

      // Generar el siguiente código
      const nextCodigo = lastProv
      ? 'CL' + String(parseInt(lastProv.codigocliente.slice(2), 10) + 1).padStart(3, '0')
      : 'CL001';

    /* ── 3. OBTENER la cuenta (CUxxx) asociada al PRExxx ─────────── */
    let idCuenta = null;

   if (idprecliente) {                    /* ← flujo A: viene de un PRE */
     const enlacePre = await modelos.cuenta_preclientes.findByPk(
       idprecliente,
       { transaction: t }
     );
     idCuenta = enlacePre ? enlacePre.idcuenta : null;

     if (!idCuenta) {                     /* seguridad extra */
       await t.rollback();
       return res.status(400).send({ message: 'El pre-cliente no tiene cuenta asociada.' });
     }

   } else {                               /* ← flujo B: lo crea un ADMIN */
     /* Generar nuevo CUxxx */
     const lastCU = await modelos.cuentasusuarios.findOne({
       order: [['idcuenta', 'DESC']],
       transaction: t
     });
     idCuenta = lastCU
       ? 'CU' + String(parseInt(lastCU.idcuenta.slice(2), 10) + 1).padStart(3,'0')
       : 'CU001';

     /* Crear la cuenta con rol = 3 (cliente) */

     const hash = await bcrypt.hash(req.body.contrasenia, 10);
     await modelos.cuentasusuarios.create({
       idcuenta    : idCuenta,
       correo      : e_mail,
       contrasenia : hash ,  // o la clave que envíes en body
       rol         : 3
     }, { transaction: t });
   }
    /* ── 4. CREAR el cliente ─────────────────────────────────────── */
    const clienteCreado = await modelos.clientes.create({
      codigocliente: nextCodigo,
      ci,
      nombre,
      direccion,
      e_mail,
      telefono,
      idprecliente,
      rol: 3
    }, { transaction: t });

    /* ── 5. VINCULAR cuenta ↔ cliente ───────────────────────────── */
    await modelos.cuenta_clientes.create({
      id_cliente: clienteCreado.codigocliente,  // 'CLxxx'
      id_cuenta : idCuenta                      // 'CUxxx'
    }, { transaction: t });

    /* ── 6. CONFIRMAR ───────────────────────────────────────────── */
    await t.commit();
    return res.status(201).send(clienteCreado);

  } catch (err) {
    if (t) await t.rollback();
    console.error('Error al crear cliente:', err);
    return res.status(500).send({ message: 'Ocurrió un error al ingresar el cliente.', error: err.message });
  }
}

async function update(req, res) {
  const { codigocliente } = req.params;
  const { ci, nombre, direccion, e_mail, telefono, idprecliente } = req.body ?? {};

  try {
    // 1) Buscar cliente
    const cliente = await modelos.clientes.findOne({ where: { codigocliente } });
    if (!cliente) return res.status(404).send({ message: 'Cliente no encontrado.' });

    // 2) CÉDULA (solo si cambia)
    if (typeof ci !== 'undefined' && ci !== cliente.ci) {
      if (!validarCedulaEcuador(ci)) {
        return res.status(400).send({ message: 'La cédula ingresada no es válida.' });
      }
      const dupCi = await modelos.clientes.count({
        where: { ci, codigocliente: { [Op.ne]: codigocliente } }
      });
      if (dupCi) return res.status(409).send({ code: 'DUP_CI', message: 'La cédula ya está registrada.' });
    }

    // 3) EMAIL (solo si cambia; case-insensitive)
    const nuevoEmailNorm  = typeof e_mail !== 'undefined' ? e_mail.trim().toLowerCase() : undefined;
    const actualEmailNorm = (cliente.e_mail || '').toLowerCase();

    if (typeof e_mail !== 'undefined' && nuevoEmailNorm !== actualEmailNorm) {
      if (!validarEmail(e_mail)) {
        return res.status(400).send({ message: 'El correo ingresado no es válido.' });
      }
      const dupMail = await modelos.clientes.count({
        where: {
          codigocliente: { [Op.ne]: codigocliente },
          [Op.and]: [ where(fn('lower', col('e_mail')), nuevoEmailNorm) ]
        }
      });
      if (dupMail) return res.status(409).send({ code: 'DUP_EMAIL', message: 'El correo ya está registrado.' });
    }

    // 4) TELÉFONO (solo si cambia)
    if (typeof telefono !== 'undefined' && telefono !== cliente.telefono) {
      if (!validarTelefono(telefono)) {
        return res.status(400).send({ message: 'El teléfono ingresado no es válido.' });
      }
      const dupTel = await modelos.clientes.count({
        where: { telefono, codigocliente: { [Op.ne]: codigocliente } }
      });
      if (dupTel) return res.status(409).send({ code: 'DUP_TEL', message: 'El teléfono ya está registrado.' });
    }

    // 5) UPDATE (normalizando donde conviene)
    await cliente.update({
      ci:           typeof ci           !== 'undefined' ? String(ci)                         : cliente.ci,
      nombre:       typeof nombre       !== 'undefined' ? String(nombre).trim()              : cliente.nombre,
      direccion:    typeof direccion    !== 'undefined' ? String(direccion).trim()           : cliente.direccion,
      e_mail:       typeof e_mail       !== 'undefined' ? nuevoEmailNorm                     : cliente.e_mail,
      telefono:     typeof telefono     !== 'undefined' ? String(telefono)                   : cliente.telefono,
      idprecliente: typeof idprecliente !== 'undefined' ? idprecliente                       : cliente.idprecliente
    });

    return res.status(200).send({ message: 'Cliente actualizado exitosamente.', cliente });
  } catch (err) {
    console.error('Error al actualizar el cliente:', err);
    return res.status(500).send({ message: 'Ocurrió un error al actualizar el cliente.', error: err.message });
  }
}

function eliminar(req, res) {
  const { codigocliente } = req.params;

  // Buscar si el empleado existe
  modelos.clientes.findOne({
      where: { codigocliente },
  })
      .then((proveedor) => {
          if (!proveedor) {
              // Si no existe el empleado, devolver un mensaje de error
              return res.status(404).send({ message: 'Cliente no encontrado.' });
          }

          // Eliminar el empleado
          modelos.clientes
              .destroy({
                  where: { codigocliente },
              })
              .then(() => {
                  // Asegurarse de restablecer la secuencia con el valor máximo actual de codigoempleado
                  modelos.sequelize.query(`
                      SELECT setval('clientes_id_seq', COALESCE((SELECT MAX(CAST(SUBSTRING(codigocliente FROM 3) AS INT)) FROM public.clientes), 0), false)
                  `)
                      .then(([result]) => {
                          // Revisar si la consulta tuvo éxito
                          if (result) {
                              return res.status(200).send({ message: 'Cliente eliminado correctamente y secuencia restablecida.' });
                          } else {
                              console.error('No se pudo restablecer la secuencia.');
                              return res.status(500).send({ message: 'Error al restablecer la secuencia del cliente.' });
                          }
                      })
                      .catch((err) => {
                          console.error('Error al restablecer la secuencia:', err);
                          return res.status(500).send({ message: 'Error al restablecer la secuencia del cliente.' });
                      });
              })
              .catch((err) => {
                  console.error('Error al eliminar el cliente:', err);
                  return res.status(500).send({ message: 'Ocurrió un error al eliminar el proveedor.' });
              });
      })
      .catch((err) => {
          console.error('Error al buscar el cliente:', err);
          return res.status(500).send({ message: 'Ocurrió un error al buscar el cliente.' });
      });
}

function getAll(req, res) {
  modelos.clientes.findAll({
    order: [['codigocliente', 'ASC']] // Ordenar por codigocliente en orden ascendente
  })
    .then(proveedor => {
      if (proveedor.length === 0) {
        return res.status(404).send({ message: 'No se encontraron clientes.' });
      }
      res.status(200).send(proveedor); // Enviar el listado de clientes ordenado
    })
    .catch(err => {
      console.error("Error al obtener los clientes:", err);
      res.status(500).send({ message: "Ocurrió un error al obtener los clientes.", error: err.message });
    });
}





async function verificarCedula(req, res) {
    const { ci } = req.params;
    try {
        const cliente = await modelos.clientes.findOne({ where: { ci } });
        if (cliente) {
            return res.status(200).send({ existe: true });
        }
        res.status(200).send({ existe: false });
    } catch (err) {
        console.error("Error al verificar cédula:", err);
        res.status(500).send({ message: "Error al verificar la cédula.", error: err.message });
    }
}

async function verificarEmail(req, res) {
    const { email } = req.params;
    try {
        const cliente = await modelos.clientes.findOne({ where: { e_mail: email } });
        if (cliente) {
            return res.status(200).send({ existe: true });
        }
        res.status(200).send({ existe: false });
    } catch (err) {
        console.error("Error al verificar email:", err);
        res.status(500).send({ message: "Error al verificar el email.", error: err.message });
    }
}

async function verificarTelefono(req, res) {
    const { telefono } = req.params;
    try {
        const cliente = await modelos.clientes.findOne({ where: { telefono } });
        if (cliente) {
            return res.status(200).send({ existe: true });
        }
        res.status(200).send({ existe: false });
    } catch (err) {
        console.error("Error al verificar teléfono:", err);
        res.status(500).send({ message: "Error al verificar el teléfono.", error: err.message });
    }
}

async function getClientePorCedula(req, res) {
    const { ci } = req.params;
    try {
      const cliente = await modelos.clientes.findOne({ where: { ci } });
      if (!cliente) {
        return res.status(404).send({ message: 'No se encontró un cliente con esa cédula.' });
      }
      // Enviamos todo el objeto cliente (o filtra lo que quieras)
      return res.status(200).send(cliente);
    } catch (err) {
      console.error("Error al obtener cliente por cédula:", err);
      return res.status(500).send({ message: "Error al obtener cliente por cédula.", error: err.message });
    }
  }

  async function getClientePorEmail(req, res) {
    const { email } = req.params;
    try {
      const cliente = await modelos.clientes.findOne({ where: { e_mail: email } });
      if (!cliente) {
        return res.status(404).send({ message: 'No se encontró un cliente con ese e-mail.' });
      }
      return res.status(200).send(cliente);
    } catch (err) {
      // ...
    }
  }

  async function getClientePorTelefono(req, res) {
    const { telefono } = req.params;
    try {
      const cliente = await modelos.clientes.findOne({ where: { telefono } });
      if (!cliente) {
        return res.status(404).send({ message: 'No se encontró un cliente con ese e-mail.' });
      }
      return res.status(200).send(cliente);
    } catch (err) {
      // ...
    }
  }

  async function getOneByCodigo(req, res) {
  const codigocliente = req.params.codigocliente;
  try {
    // Busca cliente por su clave primaria (codigocliente)
    const cliente = await modelos.clientes.findByPk(codigocliente);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }
    // En este punto `cliente` es un objeto con todos sus campos (nombre, ci, direccion, telefono, etc.)
    return res.status(200).json(cliente);
  } catch (err) {
    console.error('Error al obtener cliente por código:', err);
    return res.status(500).json({
      message: 'Ocurrió un error al buscar el cliente.',
      error: err.message
    });
  }
}

module.exports = {
    create,
    update,
    eliminar,
    getAll,
    verificarCedula,
    verificarEmail,
    verificarTelefono,
    getClientePorCedula,
    getClientePorEmail,
    getClientePorTelefono,
    getOneByCodigo
};