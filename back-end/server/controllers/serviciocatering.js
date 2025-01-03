
const modelos = require('../models'); // Importar los modelos

async function create(req, res) {
  const { idtipo, nombre, descripcion } = req.body;
  console.log(req.body);

  try {
      // Validar datos antes de la inserción
    // Obtener el último valor de codigoempleado
      const lastServicio = await modelos.servicios.findOne({
          order: [['idservicio', 'DESC']],
      });

      // Generar el siguiente código
      let nextCodigo = 'S001'; // Valor inicial por defecto
      if (lastServicio && lastServicio.idservicio) {
          const lastNumber = parseInt(lastServicio.idservicio.slice(1), 10); // Extraer número
          nextCodigo = `S${String(lastNumber + 1).padStart(3, '0')}`; // Incrementar y formatear
      }

      // Crear el nuevo empleado con el código generado
      const servicio = await modelos.servicios.create({
          idservicio: nextCodigo,
          idtipo, 
          nombre, 
          descripcion 
          
          
      });

      res.status(201).send(servicio); // Enviar el empleado creado
  } catch (err) {
      console.error('Error al crear servicio:', err);
      res.status(500).send({ message: 'Ocurrió un error al ingresar el servicio.', error: err.message });
  }
}

async function update(req, res) {
  const { idservicio } = req.params; // Código del empleado desde los parámetros de la URL
  const { idtipo, nombre, descripcion  } = req.body; // Datos a actualizar

  try {
     
      
      const servicio = await modelos.servicios.findOne({ where: { idservicio } });

      if (!servicio) {
          return res.status(404).send({ message: 'Servicio no encontrado.' });
      }

      // Actualizar los datos del empleado
      await servicio.update({
          
          idtipo: idtipo || servicio.id,
          nombre: nombre || servicio.nombre,
          descripcion: descripcion || servicio.descripcion
          
      });

      res.status(200).send({ message: 'Servicio actualizado exitosamente.', servicio });
  } catch (err) {
      console.error('Servicio al actualizar el tipo:', err);
      res.status(500).send({ message: 'Ocurrió un error al actualizar el servicio.', error: err.message });
  }
}

function eliminar(req, res) {
  const { idservicio } = req.params;

  // Buscar si el empleado existe
  modelos.servicios.findOne({
      where: { idservicio },
  })
      .then((servicio) => {
          if (!servicio) {
              // Si no existe el empleado, devolver un mensaje de error
              return res.status(404).send({ message: 'Servicio no encontrado.' });
          }

          // Eliminar el empleado
          modelos.servicios
              .destroy({
                  where: { idservicio },
              })
              .then(() => {
                  // Asegurarse de restablecer la secuencia con el valor máximo actual de codigoempleado
                  modelos.sequelize.query(`
                      SELECT setval('servicios_id_seq', COALESCE((SELECT MAX(CAST(SUBSTRING(idservicio FROM 2) AS INT)) FROM public.servicios), 0), false)
                  `)
                      .then(([result]) => {
                          // Revisar si la consulta tuvo éxito
                          if (result) {
                              return res.status(200).send({ message: 'Servicio eliminado correctamente y secuencia restablecida.' });
                          } else {
                              console.error('No se pudo restablecer la secuencia.');
                              return res.status(500).send({ message: 'Error al restablecer la secuencia del servicio.' });
                          }
                      })
                      .catch((err) => {
                          console.error('Error al restablecer la secuencia:', err);
                          return res.status(500).send({ message: 'Error al restablecer la secuencia del servicio.' });
                      });
              })
              .catch((err) => {
                  console.error('Error al eliminar el servicio:', err);
                  return res.status(500).send({ message: 'Ocurrió un error al eliminar el servicio.' });
              });
      })
      .catch((err) => {
          console.error('Error al buscar el servicio:', err);
          return res.status(500).send({ message: 'Ocurrió un error al buscar el servicio.' });
      });
}

function getAll(req, res) {
  modelos.servicios.findAll({
    order: [['idservicio', 'ASC']] // Ordenar por codigocliente en orden ascendente
  })
    .then(servicio => {
      if (servicio.length === 0) {
        return res.status(404).send({ message: 'No se encontraron los servicios.' });
      }
      res.status(200).send(servicio); // Enviar el listado de clientes ordenado
    })
    .catch(err => {
      console.error("Error al obtener los servicios:", err);
      res.status(500).send({ message: "Ocurrió un error al obtener los servicios.", error: err.message });
    });
}


module.exports = {
    create,
    update,
    eliminar,
    getAll,
  };