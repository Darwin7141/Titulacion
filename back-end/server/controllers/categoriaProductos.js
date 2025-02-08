
const modelos = require('../models'); // Importar los modelos

function create(req, res) {
  const {  categoria } = req.body;

  modelos.categoria_productos.create({
    categoria,
    
  })
    .then(categoria => {
      res.status(201).send(categoria); // Enviar el cliente creado
    })
    .catch(err => {
      console.error("Error al crear el estado:", err); // Imprime el error en la consola
      res.status(500).send({ message: "Ocurrió un error al ingresar el estado.", error: err.message });
    });
}
async function update(req, res) {
  const { idcategoria } = req.params; // Código del empleado desde los parámetros de la URL
  const { categoria } = req.body; // Datos a actualizar

  try {
     
      
      const tipo = await modelos.categoria_productos.findOne({ where: { idcategoria } });

      if (!tipo) {
          return res.status(404).send({ message: 'Categoria no encontrada.' });
      }

      // Actualizar los datos del empleado
      await tipo.update({
          
          categoria: categoria || tipo.categoria,
         
          
          
      });

      res.status(200).send({ message: 'Categoria actualizada exitosamente.', tipo });
  } catch (err) {
      console.error('Error al actualizar la categoria:', err);
      res.status(500).send({ message: 'Ocurrió un error actualizar la categoria.', error: err.message });
  }
}

function eliminar(req, res) {
  const { idcategoria } = req.params;

  // Buscar si el empleado existe
  modelos.categoria_productos.findOne({
      where: { idcategoria },
  })
      .then((tipo) => {
          if (!tipo) {
              // Si no existe el empleado, devolver un mensaje de error
              return res.status(404).send({ message: 'Categoria no encontrada.' });
          }

          // Eliminar el empleado
          modelos.categoria_productos
              .destroy({
                  where: { idcategoria },
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
    modelos.categoria_productos.findAll({
      
      
      order: [['idcategoria', 'ASC']], // Ordenar por idtipo en orden ascendente
    })
      .then(tipo => {
        if (tipo.length === 0) {
          return res.status(404).send({ message: 'No se encontraron categorias.' });
        }
        res.status(200).send(tipo); // Enviar el listado de tipos con el estado
      })
      .catch(err => {
        console.error('Error al obtener las categorias:', err);
        res.status(500).send({ message: 'Ocurrió un error al obtener las categorias.', error: err.message });
      });
  }

module.exports = {
    create,
    update,
    eliminar,
    getAll,
  };