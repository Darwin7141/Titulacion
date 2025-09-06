
const modelos = require('../models'); // Importar los modelos


const uStock = ['unidades','kg','g','l','ml','paquetes','cajas'];
async function create(req, res) {

  const { nombre, stock, codigoproveedor, idcategoria, fecha_caducidad, unidad_stock} = req.body;

   const id_admin = req.session.admin.codigoadmin;
  if (stock == null || isNaN(stock)) {
    return res.status(400).send({ message: 'El campo "stock" es requerido y debe ser un número.' });

}
  try {
    
      const lastProducto = await modelos.productos.findOne({
          order: [['idproducto', 'DESC']],
      });

      let nextCodigo = 'PR001'; 
if (lastProducto && lastProducto.idproducto) {
    const lastNumber = parseInt(lastProducto.idproducto.slice(2), 10); // Extraer el número después de "PR"
    nextCodigo = `PR${(lastNumber + 1).toString().padStart(3, '0')}`; // Asegurarse de que el número tenga tres dígitos
}

      const regex = /^[A-Za-z]{2}[0-9]+$/;
if (!regex.test(nextCodigo)) {
    return res.status(400).send({ message: 'El formato de idproducto es inválido.' });
}

      // Crear el nuevo empleado con el código generado
      const productos = await modelos.productos.create({
          idproducto: nextCodigo,
          nombre,
          stock,
          codigoproveedor,
          idcategoria,
          id_admin, 
          fecha_caducidad,
          unidad_stock: uStock.includes((unidad_stock || '').toLowerCase()) ? unidad_stock : 'unidades'
         
      });

      res.status(201).send(productos); // Enviar el empleado creado
  } catch (err) {
      console.error('Error al crear producto:', err);
      res.status(500).send({ message: 'Ocurrió un error al ingresar el producto.', error: err.message });
  }
}


async function update(req, res) {
  const { idproducto } = req.params; // Código del empleado desde los parámetros de la URL
  const { nombre, stock, codigoproveedor, idcategoria, id_admin, fecha_caducidad, unidad_stock} = req.body; // Datos a actualizar

  try {
      
      const productos = await modelos.productos.findOne({ where: { idproducto } });

      if (!productos) {
          return res.status(404).send({ message: 'Producto no encontrado.' });
      }

      // Actualizar los datos del empleado
      await productos.update({
          nombre: nombre || productos.nombre,
          stock : stock || productos. stock,
          codigoproveedor : codigoproveedor || productos.codigoproveedor,
          idcategoria : idcategoria || productos. idcategoria,
          id_admin: id_admin || productos. id_admin,
          fecha_caducidad :fecha_caducidad|| productos. fecha_caducidad,
          unidad_stock: unidad_stock || productos. unidad_stock
          
      });

      res.status(200).send({ message: 'Producto actualizado exitosamente.', productos });
  } catch (err) {
      console.error('Error al actualizar el producto:', err);
      res.status(500).send({ message: 'Ocurrió un error al actualizar el producto.', error: err.message });
  }
}

function eliminar(req, res) {
  const { idproducto } = req.params;

  // Buscar si el empleado existe
  modelos.productos.findOne({
      where: { idproducto },
  })
      .then((productos) => {
          if (!productos) {
              // Si no existe el empleado, devolver un mensaje de error
              return res.status(404).send({ message: 'Producto no encontrado.' });
          }

          // Eliminar el empleado
          modelos.productos
              .destroy({
                  where: { idproducto },
              })
              .then(() => {
                  // Asegurarse de restablecer la secuencia con el valor máximo actual de codigoempleado
                  modelos.sequelize.query(`
                      SELECT setval(
                        'productos_id_seq', 
                            COALESCE((SELECT MAX(CAST(SUBSTRING(idproducto FROM 3) AS INT)) FROM public.productos), 0), false)`)
                      .then(([result]) => {
                          // Revisar si la consulta tuvo éxito
                          if (result) {
                              return res.status(200).send({ message: 'Producto eliminado correctamente y secuencia restablecida.' });
                          } else {
                              console.error('No se pudo restablecer la secuencia.');
                              return res.status(500).send({ message: 'Error al restablecer la secuencia del producto.' });
                          }
                      })
                      .catch((err) => {
                          console.error('Error al restablecer la secuencia:', err);
                          return res.status(500).send({ message: 'Error al restablecer la secuencia del prodcuto.' });
                      });
              })
              .catch((err) => {
                  console.error('Error al eliminar el producto:', err);
                  return res.status(500).send({ message: 'Ocurrió un error al eliminar el producto.' });
              });
      })
      .catch((err) => {
          console.error('Error al buscar el producto:', err);
          return res.status(500).send({ message: 'Ocurrió un error al buscar el producto.' });
      });
}



function getAll(req, res) {
  modelos.productos.findAll({
    include: [
        {
          model: modelos.proveedor,
          as: 'proveedor', // Este alias debe coincidir con el definido en el modelo
          attributes: ['nombre'], // Seleccionar solo el campo necesario
        },

        {
            model: modelos.categoria_productos,
            as: 'categorias', // Este alias debe coincidir con el definido en el modelo
            attributes: ['categoria'], // Seleccionar solo el campo necesario
          },
      ],

    order: [['idproducto', 'ASC']] // Ordenar por codigocliente en orden ascendente
  })
    .then(productos => {
      if (productos.length === 0) {
        return res.status(404).send({ message: 'No se encontraron productos.' });
      }
      res.status(200).send(productos); // Enviar el listado de clientes ordenado
    })
    .catch(err => {
      console.error("Error al obtener los productos:", err);
      res.status(500).send({ message: "Ocurrió un error al obtener los productos.", error: err.message });
    });
}

async function getByCategoria(req, res) {
    const { idcategoria } = req.params;
  
    try {
      const productos = await modelos.productos.findAll({
        where: { idcategoria: idcategoria },
        include: [
          {
            model: modelos.proveedor,
            as: 'proveedor',
            attributes: ['nombre'],
          },
          {
            model: modelos.categoria_productos,
            as: 'categorias',
            attributes: ['categoria'],
          }
        ],
        order: [['idproducto', 'ASC']]
      });
  
      if (productos.length === 0) {
        return res.status(404).send({ message: 'No se encontraron productos en esta categoría.' });
      }
  
      res.status(200).send(productos);
    } catch (err) {
      console.error('Error al obtener productos por categoría:', err);
      res.status(500).send({
        message: 'Ocurrió un error al obtener productos por categoría.',
        error: err.message
      });
    }
  }
  

module.exports = {
    create,
    update,
    eliminar,
    getAll,
    getByCategoria
  };