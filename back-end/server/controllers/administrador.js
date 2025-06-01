const { validarCedulaEcuador, validarEmail, validarTelefono } = require('../utils/validaciones'); // Importar la función de validación
const modelos = require('../models'); // Importar los modelos
const bcrypt = require('bcrypt');

async function create(req, res) {
  const { ci, nombre, direccion, e_mail, telefono, contrasenia } = req.body;
  console.log(req.body);
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
      const lastAdmin = await modelos.administrador.findOne({
      order: [['codigoadmin', 'DESC']],
      transaction: t
    });
    let nextCodigo = 'A001';
    if (lastAdmin?.codigoadmin) {
      const num = parseInt(lastAdmin.codigoadmin.slice(1), 10) + 1;
      nextCodigo = `A${String(num).padStart(3, '0')}`;
    }

    // 3) Hashear contraseña
    const hashedPassword = await bcrypt.hash(contrasenia, 10);

    // 4) Crear administrador con rol = 1
    const admin = await modelos.administrador.create({
      codigoadmin: nextCodigo,
      ci,
      nombre,
      direccion,
      e_mail,
      telefono,
      contrasenia: hashedPassword,
      rol: 1
    }, { transaction: t });

    // 5) Generar nextIdCuenta para cuentasusuarios
    const lastUser = await modelos.cuentasusuarios.findOne({
      order: [['idcuenta', 'DESC']],
      transaction: t
    });
    let nextIdCuenta = 'CU001';
    if (lastUser?.idcuenta) {
      const num = parseInt(lastUser.idcuenta.slice(2), 10) + 1;
      nextIdCuenta = `CU${String(num).padStart(3, '0')}`;
    }

    // 6) Crear cuenta de usuario copiando el mismo rol del admin
    const cuenta = await modelos.cuentasusuarios.create({
      idcuenta: nextIdCuenta,
      correo: admin.e_mail,
      contrasenia: hashedPassword,
      rol: admin.rol     // <-- aquí aseguramos que rol en cuentasusuarios = rol de administrador
    }, { transaction: t });

    // 7) Crear la relación en cuenta_administrador
    await modelos.cuenta_administrador.create({
      id_admin: admin.codigoadmin,
      id_cuenta: cuenta.idcuenta
    }, { transaction: t });

    // 8) Commit de la transacción
    await t.commit();

    // 9) Responder con el admin creado
    res.status(201).send(admin);

  } catch (err) {
    await t.rollback();
    console.error('Error al crear administrador:', err);
    res.status(500).send({
      message: 'Ocurrió un error al ingresar el administrador.',
      error: err.message
    });
  }
}

async function update(req, res) {
  const { codigoadmin } = req.params; // Código del empleado desde los parámetros de la URL
  const { ci, nombre, direccion, e_mail, telefono } = req.body; // Datos a actualizar

  try {
      // Validar los campos antes de la actualización
      if (ci && !validarCedulaEcuador(ci)) {
          return res.status(400).send({ message: 'La cédula ingresada no es válida.' });
      }

      if (e_mail && !validarEmail(e_mail)) {
          return res.status(400).send({ message: 'El correo ingresado no es válido.' });
      }

      if (telefono && !validarTelefono(telefono)) {
          return res.status(400).send({ message: 'El teléfono ingresado no es válido.' });
      }

      // Buscar al empleado en la base de datos
      const administrador = await modelos.administrador.findOne({ where: { codigoadmin } });

      if (!administrador) {
          return res.status(404).send({ message: 'Administrador no encontrado.' });
      }

      // Actualizar los datos del empleado
      await administrador.update({
          ci: ci || administrador.ci,
          nombre: nombre || administrador.nombre,
          direccion: direccion || administrador.direccion,
          e_mail: e_mail || administrador.e_mail,
          telefono: telefono || administrador.telefono
      });

      res.status(200).send({ message: 'Empleado actualizado exitosamente.', administrador });
  } catch (err) {
      console.error('Error al actualizar el adminsitrador:', err);
      res.status(500).send({ message: 'Ocurrió un error al actualizar el administrador.', error: err.message });
  }
}

function eliminar(req, res) {
  const { codigoadmin } = req.params;

  // Buscar si el empleado existe
  modelos.administrador.findOne({
      where: { codigoadmin },
  })
      .then((administrador) => {
          if (!administrador) {
              // Si no existe el empleado, devolver un mensaje de error
              return res.status(404).send({ message: 'Administrador no encontrado.' });
          }

          // Eliminar el empleado
          modelos.administrador
              .destroy({
                  where: { codigoadmin },
              })
              .then(() => {
                  // Asegurarse de restablecer la secuencia con el valor máximo actual de codigoempleado
                  modelos.sequelize.query(`
                      SELECT setval('administrador_id_seq', COALESCE((SELECT MAX(CAST(SUBSTRING(codigoadmin FROM 2) AS INT)) FROM public.administrador), 0), false)
                  `)
                      .then(([result]) => {
                          // Revisar si la consulta tuvo éxito
                          if (result) {
                              return res.status(200).send({ message: 'Administrador eliminado correctamente y secuencia restablecida.' });
                          } else {
                              console.error('No se pudo restablecer la secuencia.');
                              return res.status(500).send({ message: 'Error al restablecer la secuencia del administrador.' });
                          }
                      })
                      .catch((err) => {
                          console.error('Error al restablecer la secuencia:', err);
                          return res.status(500).send({ message: 'Error al restablecer la secuencia del administrador.' });
                      });
              })
              .catch((err) => {
                  console.error('Error al eliminar el administrador:', err);
                  return res.status(500).send({ message: 'Ocurrió un error al eliminar el administrador.' });
              });
      })
      .catch((err) => {
          console.error('Error al buscar el administrador:', err);
          return res.status(500).send({ message: 'Ocurrió un error al buscar el administrador.' });
      });
}

function getAll(req, res) {
  modelos.administrador.findAll({
    order: [['codigoadmin', 'ASC']] // Ordenar por codigocliente en orden ascendente
  })
    .then(admin => {
      if (admin.length === 0) {
        return res.status(404).send({ message: 'No se encontraron administradores.' });
      }
      res.status(200).send(admin); // Enviar el listado de clientes ordenado
    })
    .catch(err => {
      console.error("Error al obtener los administradores:", err);
      res.status(500).send({ message: "Ocurrió un error al obtener los administradores.", error: err.message });
    });
}

async function verificarCedula(req, res) {
    const { ci } = req.params;
    try {
        const administrador = await modelos.administrador.findOne({ where: { ci } });
        if (administrador) {
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
        const administrador = await modelos.administrador.findOne({ where: { e_mail: email } });
        if (administrador) {
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
        const administrador = await modelos.administrador.findOne({ where: { telefono } });
        if (administrador) {
            return res.status(200).send({ existe: true });
        }
        res.status(200).send({ existe: false });
    } catch (err) {
        console.error("Error al verificar teléfono:", err);
        res.status(500).send({ message: "Error al verificar el teléfono.", error: err.message });
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
};

