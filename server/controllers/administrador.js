const { validarCedulaEcuador, validarEmail, validarTelefono } = require('../utils/validaciones'); // Importar la función de validación
const modelos = require('../models'); // Importar los modelos

async function create(req, res) {
  const { ci, nombre, direccion, e_mail, telefono } = req.body;
  console.log(req.body);

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
      const lastAdministrador = await modelos.administrador.findOne({
          order: [['codigoadmin', 'DESC']],
      });

      // Generar el siguiente código
      let nextCodigo = 'A001'; // Valor inicial por defecto
      if (lastAdministrador && lastAdministrador.codigoadmin) {
          const lastNumber = parseInt(lastAdministrador.codigoadmin.slice(1), 10); // Extraer número
          nextCodigo = `A${String(lastNumber + 1).padStart(3, '0')}`; // Incrementar y formatear
      }

      // Crear el nuevo empleado con el código generado
      const admin = await modelos.administrador.create({
          codigoadmin: nextCodigo,
          ci,
          nombre,
          direccion,
          e_mail,
          telefono
          
      });

      res.status(201).send(admin); // Enviar el empleado creado
  } catch (err) {
      console.error('Error al crear adminstrador:', err);
      res.status(500).send({ message: 'Ocurrió un error al ingresar el administrador.', error: err.message });
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

module.exports = {
    create,
    update,
    eliminar,
    getAll
  };