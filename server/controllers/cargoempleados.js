//const { validarCedulaEcuador, validarEmail, validarTelefono } = require('../utils/validaciones'); // Importar la función de validación
const modelos = require('../models');

function create(req, res) {
  const { idcargo, nombrecargo,descripcion } = req.body;

  modelos.cargo.create({
    idcargo, nombrecargo,descripcion
  })
    .then(cargos => {
      res.status(201).send(cargos); // Enviar el cliente creado
    })
    .catch(err => {
      console.error("Error al crear cargo:", err); // Imprime el error en la consola
      res.status(500).send({ message: "Ocurrió un error al ingresar el cargo.", error: err.message });
    });
}

function update(req, res) {
  const { idcargo } = req.params; // Obtener el código del cliente de los parámetros
  const { nombrecargo,descripcion } = req.body; // Obtener los nuevos datos
  // Buscar el cliente y actualizar sus datos
  modelos.cargo.findOne({ where: { idcargo } })
    .then(cargos => {
      if (!cargos) {
        return res.status(404).send({ message: 'Cargo no encontrado.' }); // Cliente no existe
      }

      // Actualizar los datos del cliente
      cargos.update({
        idcargo: idcargo || cargos.ci,
        nombrecargo: nombrecargo|| cargos.nombrecargo,
        descripcion: descripcion || cargos.descripcion,
      
      })
        .then(cargoActualizado => {
          res.status(200).send({ message: 'Cargo actualizado exitosamente.', cargo: cargoActualizado });
        })
        .catch(err => {
          console.error("Error al actualizar cargo:", err);
          res.status(500).send({ message: "Ocurrió un error al actualizar el cargo.", error: err.message });
        });
    })
    .catch(err => {
      console.error("Error al buscar cargo:", err);
      res.status(500).send({ message: "Ocurrió un error al buscar el cargo.", error: err.message });
    });
}


function eliminar(req, res) { 
    const { idcargo } = req.params;

    // Buscar si el cargo existe
    modelos.cargo.findOne({
        where: { idcargo }
    })
    .then(cargo => {
        if (!cargo) {
            // Si no existe el cargo, devolver un mensaje de error
            return res.status(404).send({ message: 'Cargo no encontrado' });
        }

        // Eliminar el cargo
        modelos.cargo.destroy({
            where: { idcargo }
        })
        .then(() => {
            // Asegúrate de restablecer la secuencia con el valor máximo actual de idcargo
            modelos.sequelize.query(`
                SELECT setval('cargo_id_seq', COALESCE((SELECT MAX(CAST(SUBSTRING(idcargo FROM 2) AS INT)) FROM public.cargo), 0))
            `)
            .then(() => {
                res.status(200).send({ message: 'Cargo eliminado correctamente y secuencia restablecida' });
            })
            .catch(err => {
                console.error('Error al restablecer la secuencia:', err);
                res.status(500).send({ message: 'Error al restablecer la secuencia' });
            });
        })
        .catch(err => {
            console.error('Error al eliminar el cargo:', err);
            res.status(500).send({ message: 'Error al eliminar el cargo' });
        });
    })
    .catch(err => {
        console.error('Error al buscar el cargo:', err);
        res.status(500).send({ message: 'Error al buscar el cargo' });
    });
}

function getAll(req, res) {
  modelos.cargo.findAll({
    order: [['idcargo', 'ASC']] // Ordenar por codigocliente en orden ascendente
  })
    .then(cargos => {
      if (cargos.length === 0) {
        return res.status(404).send({ message: 'No se encontraron cargos.' });
      }
      res.status(200).send(cargos); // Enviar el listado de clientes ordenado
    })
    .catch(err => {
      console.error("Error al obtener los cargos:", err);
      res.status(500).send({ message: "Ocurrió un error al obtener los cargos.", error: err.message });
    });

}
module.exports = {
    create,
    update,
    eliminar,
    getAll
    
  };