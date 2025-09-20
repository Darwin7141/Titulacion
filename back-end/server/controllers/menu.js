
const modelos = require('../models'); // Importar los modelos
const fs= require ('fs');
const makeThumb = require('node-thumbnail').thumb;
const path=require('path');

const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER;
const UPLOAD_BASE = process.env.UPLOAD_BASE_DIR || (isProd
  ? '/var/data'
  : path.join(__dirname, '..', 'uploads')
);

const FOTOS_DIR  = path.join(UPLOAD_BASE, 'fotografiasMenus');
const THUMBS_DIR = path.join(FOTOS_DIR, 'thumbs');
fs.mkdirSync(THUMBS_DIR, { recursive: true });

async function create(req, res) {
  const { idservicio, nombre, descripcion, precio } = req.body;
  console.log(req.body);

  try {
      // Validar datos antes de la inserción
    // Obtener el último valor de codigoempleado
      const lastMenu = await modelos.menu.findOne({
          order: [['idmenu', 'DESC']],
      });

      // Generar el siguiente código
      let nextCodigo = 'M001'; // Valor inicial por defecto
      if (lastMenu && lastMenu.idmenu) {
          const lastNumber = parseInt(lastMenu.idmenu.slice(1), 10); // Extraer número
          nextCodigo = `M${String(lastNumber + 1).padStart(3, '0')}`; // Incrementar y formatear
      }

      // Crear el nuevo empleado con el código generado
      const menu = await modelos.menu.create({
          idmenu: nextCodigo,
          idservicio, 
          nombre, 
          descripcion,
          precio
          
          
      });

      res.status(201).send(menu); // Enviar el empleado creado
  } catch (err) {
      console.error('Error al crear menu:', err);
      res.status(500).send({ message: 'Ocurrió un error al ingresar el menu.', error: err.message });
  }
}

async function update(req, res) {
  const { idmenu } = req.params; // Código del empleado desde los parámetros de la URL
  const { idservicio, nombre, descripcion, precio  } = req.body; // Datos a actualizar

  try {
     
      
      const menu = await modelos.menu.findOne({ where: { idmenu } });

      if (!menu) {
          return res.status(404).send({ message: 'Menu no encontrado.' });
      }

      // Actualizar los datos del empleado
      await menu.update({
          
          idservicio: idservicio || menu.idservicio,
          nombre: nombre || menu.nombre,
          descripcion: descripcion || menu.descripcion,
          precio: precio || menu.precio
          
      });

      res.status(200).send({ message: 'Menú actualizado exitosamente.', menu });
  } catch (err) {
      console.error('Menu al actualizar el tipo:', err);
      res.status(500).send({ message: 'Ocurrió un error al actualizar el menú.', error: err.message });
  }
}

function eliminar(req, res) {
  const { idmenu } = req.params;

  // Buscar si el empleado existe
  modelos.menu.findOne({
      where: { idmenu },
  })
      .then((menu) => {
          if (!menu) {
              // Si no existe el empleado, devolver un mensaje de error
              return res.status(404).send({ message: 'Menú no encontrado.' });
          }

          // Eliminar el empleado
          modelos.menu
              .destroy({
                  where: { idmenu },
              })
              .then(() => {
                  // Asegurarse de restablecer la secuencia con el valor máximo actual de codigoempleado
                  modelos.sequelize.query(`
                      SELECT setval('menu_id_seq', COALESCE((SELECT MAX(CAST(SUBSTRING(idmenu FROM 2) AS INT)) FROM public.menu), 0), false)
                  `)
                      .then(([result]) => {
                          // Revisar si la consulta tuvo éxito
                          if (result) {
                              return res.status(200).send({ message: 'Menú eliminado correctamente y secuencia restablecida.' });
                          } else {
                              console.error('No se pudo restablecer la secuencia.');
                              return res.status(500).send({ message: 'Error al restablecer la secuencia del menú.' });
                          }
                      })
                      .catch((err) => {
                          console.error('Error al restablecer la secuencia:', err);
                          return res.status(500).send({ message: 'Error al restablecer la secuencia del menú.' });
                      });
              })
              .catch((err) => {
                  console.error('Error al eliminar el menú:', err);
                  return res.status(500).send({ message: 'Ocurrió un error al eliminar el menú.' });
              });
      })
      .catch((err) => {
          console.error('Error al buscar el menú:', err);
          return res.status(500).send({ message: 'Ocurrió un error al buscar el menú.' });
      });
}

function getAll(req, res) {
  modelos.menu.findAll({
    include: [
        {
          model: modelos.servicios,
          as: 'servicio', // Este alias debe coincidir con el definido en el modelo
          attributes: ['nombre'], // Seleccionar solo el campo necesario
        },
      ],

    order: [['idmenu', 'ASC']] // Ordenar por codigocliente en orden ascendente
  })
    .then(menu => {
      if (menu.length === 0) {
        return res.status(404).send({ message: 'No se encontraron los menús.' });
      }
      res.status(200).send(menu); // Enviar el listado de clientes ordenado
    })
    .catch(err => {
      console.error("Error al obtener los menús:", err);
      res.status(500).send({ message: "Ocurrió un error al obtener los menús.", error: err.message });
    });
}

async function uploadFotografia(req, res) {
  const id = req.params.idmenu;

  if (!req.files || !req.files.foto) {
    return res.status(400).send({ message: 'Debe seleccionar una fotografía.' });
  }

  try {
    const menu = await modelos.menu.findByPk(id);
    if (!menu) {
      safeUnlink(req.files.foto.path);
      return res.status(404).send({ message: 'Menú no encontrado.' });
    }

    const filePath = req.files.foto.path;   // ruta completa ya en FOTOS_DIR
    const fileName = path.basename(filePath);
    const ext = (path.extname(fileName) || '').toLowerCase().replace('.', '');
    const valid = ['jpg', 'jpeg', 'png', 'gif'];
    if (!valid.includes(ext)) {
      safeUnlink(filePath);
      return res.status(400).send({ message: 'La extensión no es válida. Solo se permiten jpg, jpeg, png, gif.' });
    }

    await menu.update({ imagen: fileName });

    await makeThumb({
      source: path.resolve(filePath),
      destination: path.resolve(THUMBS_DIR),
      width: 200,
      suffix: ''
    });

    return res.status(200).send({ fotografia: menu });
  } catch (err) {
    if (req?.files?.foto?.path) safeUnlink(req.files.foto.path);
    console.error('Error en uploadFotografia (menú):', err);
    return res.status(500).send({ message: 'Ocurrió un error al subir la fotografía.' });
  }
}

  function getFotografia(req, res) {
  const fotografia = (req.params.fotografia || '').trim();
  const useThumb = String(req.params.thumb || '').toLowerCase() === 'true';

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

function safeUnlink(p) { fs.unlink(p, () => {}); }

module.exports = {
    create,
    update,
    eliminar,
    getAll,
    uploadFotografia,
    getFotografia

  };