
const modelos = require('../models'); // Importar los modelos
const fs= require ('fs');
const makeThumb = require('node-thumbnail').thumb;
const path=require('path');

const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER;
const UPLOAD_BASE = process.env.UPLOAD_BASE_DIR || (isProd
  ? '/var/data'
  : path.join(__dirname, '..', 'uploads')
);

const FOTOS_DIR  = path.join(UPLOAD_BASE, 'fotografias');
const THUMBS_DIR = path.join(FOTOS_DIR, 'thumbs');

// Garantizar carpetas (por si el módulo de rutas aún no corrió)
fs.mkdirSync(THUMBS_DIR, { recursive: true });

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
          
          idtipo: idtipo || servicio.idtipo,
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

async function uploadFotografia(req, res) {
  const id = req.params.idservicio;

  if (!req.files || !req.files.foto) {
    return res.status(400).send({ message: 'Debe seleccionar una fotografía.' });
  }

  try {
    const servicio = await modelos.servicios.findByPk(id);
    if (!servicio) {
      // borrar archivo temporal si el servicio no existe
      safeUnlink(req.files.foto.path);
      return res.status(404).send({ message: 'Servicio no encontrado.' });
    }

    // connect-multiparty ya guardó el archivo en FOTOS_DIR con nombre aleatorio
    const filePath = req.files.foto.path;                // ruta completa
    const fileName = path.basename(filePath);            // nombre del archivo
    const ext = (path.extname(fileName) || '').toLowerCase().replace('.', '');

    const valid = ['jpg','jpeg','png','gif'];
    if (!valid.includes(ext)) {
      safeUnlink(filePath);
      return res.status(400).send({ message: 'La extensión no es válida. Solo se permiten jpg, jpeg, png, gif.' });
    }

    // Actualizamos la BD con el nombre del archivo
    await servicio.update({ imagen: fileName });

    // Crear thumbnail
    await makeThumb({
      source: path.resolve(filePath),   // el original recién subido
      destination: path.resolve(THUMBS_DIR),
      width: 200,
      suffix: '' // mismo nombre
    });

    return res.status(200).send({ fotografia: servicio });
  } catch (err) {
    // si algo falla, intentamos borrar el archivo subido
    if (req?.files?.foto?.path) safeUnlink(req.files.foto.path);
    console.error('Error en uploadFotografia:', err);
    return res.status(500).send({ message: 'Ocurrió un error al subir la fotografía.' });
  }
}

  
 
function getFotografia(req, res) {
  const fotografia = (req.params.fotografia || '').trim();
  const useThumb = String(req.params.thumb || '').toLowerCase() === 'true';

  // Sanitizar: evitar traversal
  if (!fotografia || fotografia.includes('..') || fotografia.includes('/') || fotografia.includes('\\')) {
    return res.status(400).send({ message: 'Nombre de archivo inválido.' });
  }

  const baseDir = useThumb ? THUMBS_DIR : FOTOS_DIR;
  const absPath = path.join(baseDir, fotografia);

  fs.access(absPath, fs.constants.F_OK, (err) => {
    if (!err) return res.sendFile(path.resolve(absPath));
    return res.status(404).send({ message: 'No se encuentra la fotografía.' });
  });
}

// Utilidad segura para borrar
function safeUnlink(p) {
  fs.unlink(p, () => {});
}

module.exports = {
    create,
    update,
    eliminar,
    getAll,
    uploadFotografia,
    getFotografia
  };