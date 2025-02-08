
const modelos = require('../models'); // Importar los modelos
const fs= require ('fs');
const thumb= require ('node-thumbnail').thumb;
const path=require('path');

async function create(req, res) {
  const { idtipo, nombre, descripcion, idestado } = req.body;
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
          descripcion,
          idestado
          
          
      });

      res.status(201).send(servicio); // Enviar el empleado creado
  } catch (err) {
      console.error('Error al crear servicio:', err);
      res.status(500).send({ message: 'Ocurrió un error al ingresar el servicio.', error: err.message });
  }
}

async function update(req, res) {
  const { idservicio } = req.params; // Código del empleado desde los parámetros de la URL
  const { idtipo, nombre, descripcion, idestado } = req.body; // Datos a actualizar

  try {
     
      
      const servicio = await modelos.servicios.findOne({ where: { idservicio } });

      if (!servicio) {
          return res.status(404).send({ message: 'Servicio no encontrado.' });
      }

      // Actualizar los datos del empleado
      await servicio.update({
          
          idtipo: idtipo || servicio.id,
          nombre: nombre || servicio.nombre,
          descripcion: descripcion || servicio.descripcion,
          idestado: idestado || servicio.idestado
          
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
    include: [
        {
          model: modelos.estadocatering,
          as: 'estado', // Este alias debe coincidir con el definido en el modelo
          attributes: ['estado'], // Seleccionar solo el campo necesario
        },

        {
            model: modelos.tipocatering,
            as: 'tipo', // Este alias debe coincidir con el definido en el modelo
            attributes: ['nombre'], // Seleccionar solo el campo necesario
          },
      ],

      
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

function uploadFotografia(req, res) {
    const id = req.params.idservicio;
  
    if (req.files) {
      const file_path = req.files.foto.path;
      const file_split = file_path.split('\\');
      const file_name = file_split[3];
      
      const ext_split = file_name.split('.');
      let file_ext = ext_split[ext_split.length - 1]; // toma la última parte como extensión
      file_ext = file_ext.toLowerCase();             // para normalizar mayúsculas/minúsculas
  
      // Lista de extensiones permitidas
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif'];
  
      // Verificamos si la extensión está permitida
      if (validExtensions.includes(file_ext)) {
        const foto = { imagen: file_name };
  
        modelos.servicios
          .findByPk(id)
          .then((fotografia) => {
            if (!fotografia) {
              // Si no se encuentra el servicio, eliminamos el archivo subido y retornamos error
              fs.unlink(file_path, () => {});
              return res.status(404).send({ message: 'Servicio no encontrado.' });
            }
  
            // Actualizamos en la BD el campo 'imagen' con el nombre del archivo
            fotografia
              .update(foto)
              .then(() => {
                const newPath = './server/uploads/fotografias/' + file_name;
                const thumbPath = './server/uploads/fotografias/thumbs';
  
                thumb({
                  source: path.resolve(newPath),
                  destination: path.resolve(thumbPath),
                  width: 200,
                  suffix: '',
                })
                  .then(() => {
                    return res.status(200).send({ fotografia });
                  })
                  .catch((err) => {
                    return res
                      .status(500)
                      .send({ message: 'Ocurrió un error al crear el thumbnail. ' + err });
                  });
              })
              .catch((err) => {
                // Si algo falla en la actualización de la BD, eliminamos el archivo subido
                fs.unlink(file_path, () => {});
                return res
                  .status(500)
                  .send({ message: 'Ocurrió un error al actualizar la fotografía.' });
              });
          })
          .catch((err) => {
            fs.unlink(file_path, () => {});
            return res
              .status(500)
              .send({ message: 'Error al buscar el servicio.', error: err });
          });
      } else {
        // Extensión no válida, eliminamos el archivo subido
        fs.unlink(file_path, (err) => {});
        return res
          .status(400)
          .send({ message: 'La extensión no es válida. Solo se permiten jpg, jpeg, png, gif.' });
      }
    } else {
      return res.status(400).send({ message: 'Debe seleccionar una fotografía.' });
    }
  }
  
 
function getFotografia(req, res) {
    var fotografia = req.params.fotografia;
    var thumb = req.params.thumb;
  
    if (thumb=="false") 
      var path_foto = "./server/uploads/fotografias/" + fotografia;
     else if (thumb=="true")
      var path_foto = "./server/uploads/fotografias/thumbs/" + fotografia;
    
  
    fs.access(path_foto, fs.constants.F_OK, (err) => {
        if (!err) {
            res.sendFile(path.resolve(path_foto));
        } else {
            res.status(404).send({ message: "No se encuentra la fotografía." });
        }
    });
  }


module.exports = {
    create,
    update,
    eliminar,
    getAll,
    uploadFotografia,
    getFotografia
  };