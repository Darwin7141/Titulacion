
const modelos = require('../models'); // Importar los modelos

async function create(req, res) {
  const { nombre, descripcion, idestado } = req.body;
  console.log(req.body);

  try {
      // Validar datos antes de la inserción
    // Obtener el último valor de codigoempleado
      const lastTipo = await modelos.tipocatering.findOne({
          order: [['idtipo', 'ASC']],
      });

      // Generar el siguiente código
      let nextCodigo = 'T001'; // Valor inicial por defecto
      if (lastTipo && lastTipo.idtipo) {
          const lastNumber = parseInt(lastTipo.idtipo.slice(1), 10); // Extraer número
          nextCodigo = `T${String(lastNumber + 1).padStart(3, '0')}`; // Incrementar y formatear
      }

      // Crear el nuevo empleado con el código generado
      const tipo = await modelos.tipocatering.create({
          idtipo: nextCodigo,
          descripcion,
          nombre,
          idestado
          
          
      });

      res.status(201).send(tipo); // Enviar el empleado creado
  } catch (err) {
      console.error('Error al crear tipo:', err);
      res.status(500).send({ message: 'Ocurrió un error al ingresar el tipo.', error: err.message });
  }
}

async function update(req, res) {
  const { idtipo } = req.params; // Código del empleado desde los parámetros de la URL
  const { nombre, descripcion, idestado } = req.body; // Datos a actualizar

  try {
     
      
      const tipo = await modelos.tipocatering.findOne({ where: { idtipo } });

      if (!tipo) {
          return res.status(404).send({ message: 'Tipo de catering no encontrado.' });
      }

      // Actualizar los datos del empleado
      await tipo.update({
          
          nombre: nombre || tipo.nombre,
          descripcion: descripcion || tipo.descripcion,
          idestado: idestado || tipo.idestado,
          
      });

      res.status(200).send({ message: 'Tipo actualizado exitosamente.', tipo });
  } catch (err) {
      console.error('Error al actualizar el tipo:', err);
      res.status(500).send({ message: 'Ocurrió un error al actualizar el tipo.', error: err.message });
  }
}

function eliminar(req, res) {
  const { idtipo } = req.params;

  // Buscar si el empleado existe
  modelos.tipocatering.findOne({
      where: { idtipo },
  })
      .then((tipo) => {
          if (!tipo) {
              // Si no existe el empleado, devolver un mensaje de error
              return res.status(404).send({ message: 'Tipo no encontrado.' });
          }

          // Eliminar el empleado
          modelos.tipocatering
              .destroy({
                  where: { idtipo },
              })
              .then(() => {
                  // Asegurarse de restablecer la secuencia con el valor máximo actual de codigoempleado
                  modelos.sequelize.query(`
                      SELECT setval('tipocatering_id_seq', COALESCE((SELECT MAX(CAST(SUBSTRING(idtipo FROM 2) AS INT)) FROM public.tipocatering), 0), false)
                  `)
                      .then(([result]) => {
                          // Revisar si la consulta tuvo éxito
                          if (result) {
                              return res.status(200).send({ message: 'Tipo eliminado correctamente y secuencia restablecida.' });
                          } else {
                              console.error('No se pudo restablecer la secuencia.');
                              return res.status(500).send({ message: 'Error al restablecer la secuencia del tipo.' });
                          }
                      })
                      .catch((err) => {
                          console.error('Error al restablecer la secuencia:', err);
                          return res.status(500).send({ message: 'Error al restablecer la secuencia del tipo.' });
                      });
              })
              .catch((err) => {
                  console.error('Error al eliminar el tipo:', err);
                  return res.status(500).send({ message: 'Ocurrió un error al eliminar el tipo.' });
              });
      })
      .catch((err) => {
          console.error('Error al buscar el tipo:', err);
          return res.status(500).send({ message: 'Ocurrió un error al buscar el tipo.' });
      });
}

function getAll(req, res) {
  modelos.tipocatering.findAll({
    order: [['idtipo', 'ASC']] // Ordenar por codigocliente en orden ascendente
  })
    .then(tipo => {
      if (tipo.length === 0) {
        return res.status(404).send({ message: 'No se encontraron tipos.' });
      }
      res.status(200).send(tipo); // Enviar el listado de clientes ordenado
    })
    .catch(err => {
      console.error("Error al obtener los tipos:", err);
      res.status(500).send({ message: "Ocurrió un error al obtener los tipos.", error: err.message });
    });
}


module.exports = {
    create,
    update,
    eliminar,
    getAll,
  };