const { validarCedulaEcuador, validarEmail, validarTelefono } = require('../utils/validaciones'); // Importar la función de validación
const modelos = require('../models'); // Importar los modelos

async function create(req, res) {
  const { ci, nombre, direccion, e_mail, telefono, idcargo } = req.body;

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
      });

      res.status(201).send(empleado); // Enviar el empleado creado
  } catch (err) {
      console.error('Error al crear empleado:', err);
      res.status(500).send({ message: 'Ocurrió un error al ingresar el empleado.', error: err.message });
  }
}



async function update(req, res) {
  const { codigoempleado } = req.params; // Código del empleado desde los parámetros de la URL
  const { ci, nombre, direccion, e_mail, telefono, idcargo } = req.body; // Datos a actualizar

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
      const empleado = await modelos.empleado.findOne({ where: { codigoempleado } });

      if (!empleado) {
          return res.status(404).send({ message: 'Empleado no encontrado.' });
      }

      // Actualizar los datos del empleado
      await empleado.update({
          ci: ci || empleado.ci,
          nombre: nombre || empleado.nombre,
          direccion: direccion || empleado.direccion,
          e_mail: e_mail || empleado.e_mail,
          telefono: telefono || empleado.telefono,
          idcargo: idcargo || empleado.idcargo,
      });

      res.status(200).send({ message: 'Empleado actualizado exitosamente.', empleado });
  } catch (err) {
      console.error('Error al actualizar el empleado:', err);
      res.status(500).send({ message: 'Ocurrió un error al actualizar el empleado.', error: err.message });
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

module.exports = {
    create,
    update,
    eliminar,
    getAll
  };