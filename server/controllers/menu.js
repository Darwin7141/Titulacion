
const modelos = require('../models'); // Importar los modelos

async function create(req, res) {
  const { idtipo, nombre, descripcion, precio } = req.body;
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
          idtipo, 
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
  const { idtipo, nombre, descripcion, precio  } = req.body; // Datos a actualizar

  try {
     
      
      const menu = await modelos.menu.findOne({ where: { idmenu } });

      if (!menu) {
          return res.status(404).send({ message: 'Menu no encontrado.' });
      }

      // Actualizar los datos del empleado
      await menu.update({
          
          idtipo: idtipo || menu.id,
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


module.exports = {
    create,
    update,
    eliminar,
    getAll,
  };