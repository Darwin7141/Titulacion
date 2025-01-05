const { validarCedulaEcuador, validarEmail, validarTelefono } = require('../utils/validaciones'); // Importar la función de validación
const modelos = require('../models'); // Importar los modelos

async function create(req, res) {
  const { ci, nombre, direccion, e_mail, telefono } = req.body;

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
      const lastProv = await modelos.clientes.findOne({
          order: [['codigocliente', 'DESC']],
      });

      // Generar el siguiente código
      let nextCodigo = 'CL001'; // Valor inicial por defecto
      if (lastProv && lastProv.codigocliente) {
          const lastNumber = parseInt(lastProv.codigocliente.slice(2), 10); // Extraer número
          nextCodigo = `CL${String(lastNumber + 1).padStart(3, '0')}`; // Incrementar y formatear
      }

      // Crear el nuevo empleado con el código generado
      const proveedor = await modelos.clientes.create({
          codigocliente: nextCodigo,
          ci,
          nombre,
          direccion,
          e_mail,
          telefono
          
      });

      res.status(201).send(proveedor); // Enviar el empleado creado
  } catch (err) {
      console.error('Error al crear cliente:', err);
      res.status(500).send({ message: 'Ocurrió un error al ingresar el cliente.', error: err.message });
  }
}

async function update(req, res) {
  const { codigocliente } = req.params; // Código del empleado desde los parámetros de la URL
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
      const proveedor = await modelos.clientes.findOne({ where: { codigocliente } });

      if (!proveedor) {
          return res.status(404).send({ message: 'Cliente no encontrado.' });
      }

      // Actualizar los datos del empleado
      await proveedor.update({
          ci: ci || proveedor.ci,
          nombre: nombre || proveedor.nombre,
          direccion: direccion || proveedor.direccion,
          e_mail: e_mail || proveedor.e_mail,
          telefono: telefono || proveedor.telefono
      });

      res.status(200).send({ message: 'Cliente actualizado exitosamente.', proveedor });
  } catch (err) {
      console.error('Error al actualizar el cliente:', err);
      res.status(500).send({ message: 'Ocurrió un error al actualizar el cliente.', error: err.message });
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

module.exports = {
    create,
    update,
    eliminar,
    getAll
  };