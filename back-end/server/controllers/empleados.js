const { validarCedulaEcuador, validarEmail, validarTelefono } = require('../utils/validaciones'); // Importar la función de validación
const modelos = require('../models'); // Importar los modelos
const bcrypt = require('bcrypt');
const { Op, fn, col, where } = require('sequelize');

async function create(req, res) {
  const { ci, nombre, direccion, e_mail, telefono, idcargo } = req.body;

  const id_admin = req.session.admin.codigoadmin;

  try {
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
      const lastEmpleado = await modelos.empleado.findOne({
          order: [['codigoempleado', 'DESC']],
      });

      // Generar el siguiente código
      let nextCodigo = 'E001'; // Valor inicial por defecto
      if (lastEmpleado && lastEmpleado.codigoempleado) {
          const lastNumber = parseInt(lastEmpleado.codigoempleado.slice(1), 10); // Extraer número
          nextCodigo = `E${String(lastNumber + 1).padStart(3, '0')}`; // Incrementar y formatear
      }

      

      // Crear el nuevo empleado con el código generado
      const empleado = await modelos.empleado.create({
          codigoempleado: nextCodigo,
          ci,
          nombre,
          direccion,
          e_mail,
          telefono,
          idcargo,
          id_admin
          
      });

      
      res.status(201).send(empleado); // Enviar el empleado creado
  } catch (err) {
      console.error('Error al crear empleado:', err);
      res.status(500).send({ message: 'Ocurrió un error al ingresar el empleado.', error: err.message });
  }
}



async function update(req, res) {
  const { codigoempleado } = req.params;
  const { ci, nombre, direccion, e_mail, telefono, idcargo } = req.body ?? {};

  try {
    // 1) Buscar empleado
    const empleado = await modelos.empleado.findOne({ where: { codigoempleado } });
    if (!empleado) return res.status(404).send({ message: 'Empleado no encontrado.' });

    // 2) CÉDULA (solo si cambia)
    if (typeof ci !== 'undefined' && ci !== empleado.ci) {
      if (!validarCedulaEcuador(ci)) {
        return res.status(400).send({ message: 'La cédula ingresada no es válida.' });
      }
      const dupCi = await modelos.empleado.count({
        where: { ci, codigoempleado: { [Op.ne]: codigoempleado } }
      });
      if (dupCi) return res.status(409).send({ code: 'DUP_CI', message: 'La cédula ya está registrada.' });
    }

    // 3) EMAIL (solo si cambia; case-insensitive)
    const nuevoEmailNorm  = typeof e_mail !== 'undefined' ? e_mail.trim().toLowerCase() : undefined;
    const actualEmailNorm = (empleado.e_mail || '').toLowerCase();

    if (typeof e_mail !== 'undefined' && nuevoEmailNorm !== actualEmailNorm) {
      if (!validarEmail(e_mail)) {
        return res.status(400).send({ message: 'El correo ingresado no es válido.' });
      }
      const dupMail = await modelos.empleado.count({
        where: {
          codigoempleado: { [Op.ne]: codigoempleado },
          [Op.and]: [ where(fn('lower', col('e_mail')), nuevoEmailNorm) ]
        }
      });
      if (dupMail) return res.status(409).send({ code: 'DUP_EMAIL', message: 'El correo ya está registrado.' });
    }

    // 4) TELÉFONO (solo si cambia)
    if (typeof telefono !== 'undefined' && telefono !== empleado.telefono) {
      if (!validarTelefono(telefono)) {
        return res.status(400).send({ message: 'El teléfono ingresado no es válido.' });
      }
      const dupTel = await modelos.empleado.count({
        where: { telefono, codigoempleado: { [Op.ne]: codigoempleado } }
      });
      if (dupTel) return res.status(409).send({ code: 'DUP_TEL', message: 'El teléfono ya está registrado.' });
    }

  
    await empleado.update({
      ci:         typeof ci         !== 'undefined' ? String(ci)              : empleado.ci,
      nombre:     typeof nombre     !== 'undefined' ? String(nombre).trim()   : empleado.nombre,
      direccion:  typeof direccion  !== 'undefined' ? String(direccion).trim(): empleado.direccion,
      e_mail:     typeof e_mail     !== 'undefined' ? nuevoEmailNorm          : empleado.e_mail,
      telefono:   typeof telefono   !== 'undefined' ? String(telefono)        : empleado.telefono,
      idcargo:    typeof idcargo    !== 'undefined' ? idcargo                 : empleado.idcargo
    });

    return res.status(200).send({ message: 'Empleado actualizado exitosamente.', empleado });
  } catch (err) {
    console.error('Error al actualizar el empleado:', err);
    return res.status(500).send({ message: 'Ocurrió un error al actualizar el empleado.', error: err.message });
  }
}
function eliminar(req, res) {
  const { codigoempleado } = req.params;

  // Buscar si el empleado existe
  modelos.empleado.findOne({
      where: { codigoempleado },
  })
      .then((empleados) => {
          if (!empleados) {
              // Si no existe el empleado, devolver un mensaje de error
              return res.status(404).send({ message: 'Empleado no encontrado.' });
          }

          // Eliminar el empleado
          modelos.empleado
              .destroy({
                  where: { codigoempleado },
              })
              .then(() => {
                  // Asegurarse de restablecer la secuencia con el valor máximo actual de codigoempleado
                  modelos.sequelize.query(`
                      SELECT setval('empleado_id_seq', COALESCE((SELECT MAX(CAST(SUBSTRING(codigoempleado FROM 2) AS INT)) FROM public.empleado), 0), false)
                  `)
                      .then(([result]) => {
                          // Revisar si la consulta tuvo éxito
                          if (result) {
                              return res.status(200).send({ message: 'Empleado eliminado correctamente y secuencia restablecida.' });
                          } else {
                              console.error('No se pudo restablecer la secuencia.');
                              return res.status(500).send({ message: 'Error al restablecer la secuencia del empleado.' });
                          }
                      })
                      .catch((err) => {
                          console.error('Error al restablecer la secuencia:', err);
                          return res.status(500).send({ message: 'Error al restablecer la secuencia del empleado.' });
                      });
              })
              .catch((err) => {
                  console.error('Error al eliminar el empleado:', err);
                  return res.status(500).send({ message: 'Ocurrió un error al eliminar el empleado.' });
              });
      })
      .catch((err) => {
          console.error('Error al buscar el empleado:', err);
          return res.status(500).send({ message: 'Ocurrió un error al buscar el empleado.' });
      });
}



function getAll(req, res) {
  modelos.empleado.findAll({
    include: [
        {
          model: modelos.cargo,
          as: 'cargo', // Este alias debe coincidir con el definido en el modelo
          attributes: ['nombrecargo'], // Seleccionar solo el campo necesario
        },
      ],

    order: [['codigoempleado', 'ASC']] // Ordenar por codigocliente en orden ascendente
  })
    .then(empleados => {
      if (empleados.length === 0) {
        return res.status(404).send({ message: 'No se encontraron empleados.' });
      }
      res.status(200).send(empleados); // Enviar el listado de clientes ordenado
    })
    .catch(err => {
      console.error("Error al obtener los empleados:", err);
      res.status(500).send({ message: "Ocurrió un error al obtener los empleados.", error: err.message });
    });
}

async function verificarCedula(req, res) {
    const { ci } = req.params;
    try {
        const cliente = await modelos.empleado.findOne({ where: { ci } });
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
        const cliente = await modelos.empleado.findOne({ where: { e_mail: email } });
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
        const cliente = await modelos.empleado.findOne({ where: { telefono } });
        if (cliente) {
            return res.status(200).send({ existe: true });
        }
        res.status(200).send({ existe: false });
    } catch (err) {
        console.error("Error al verificar teléfono:", err);
        res.status(500).send({ message: "Error al verificar el teléfono.", error: err.message });
    }
}


async function getEmpleadoPorCedula(req, res) {
    const { ci } = req.params;
    try {
      const cliente = await modelos.empleado.findOne({ where: { ci } });
      if (!cliente) {
        return res.status(404).send({ message: 'No se encontró un empleado con esa cédula.' });
      }
      // Enviamos todo el objeto cliente (o filtra lo que quieras)
      return res.status(200).send(cliente);
    } catch (err) {
      console.error("Error al obtener empleado por cédula:", err);
      return res.status(500).send({ message: "Error al obtener empleado por cédula.", error: err.message });
    }
  }

  async function getEmpleadoPorEmail(req, res) {
    const { email } = req.params;
    try {
      const cliente = await modelos.empleado.findOne({ where: { e_mail: email } });
      if (!cliente) {
        return res.status(404).send({ message: 'No se encontró un empleado con ese e-mail.' });
      }
      return res.status(200).send(cliente);
    } catch (err) {
      // ...
    }
  }

  async function getEmpleadoPorTelefono(req, res) {
    const { telefono } = req.params;
    try {
      const cliente = await modelos.empleado.findOne({ where: { telefono } });
      if (!cliente) {
        return res.status(404).send({ message: 'No se encontró un empleado con ese e-mail.' });
      }
      return res.status(200).send(cliente);
    } catch (err) {
      // ...
    }
  }

  async function getOneByCodigo(req, res) {
  const codigoempleado = req.params.codigoempleado;
  try {
    // Busca cliente por su clave primaria (codigocliente)
    const cliente = await modelos.empleado.findByPk(codigoempleado);
    if (!cliente) {
      return res.status(404).json({ message: 'Empleado no encontrado.' });
    }
    // En este punto `cliente` es un objeto con todos sus campos (nombre, ci, direccion, telefono, etc.)
    return res.status(200).json(cliente);
  } catch (err) {
    console.error('Error al obtener empleado por código:', err);
    return res.status(500).json({
      message: 'Ocurrió un error al buscar el empleado.',
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
    getEmpleadoPorCedula,
    getEmpleadoPorEmail,
    getEmpleadoPorTelefono,
    getOneByCodigo
  };