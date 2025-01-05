const modelos = require('../models'); // Importar los modelos

function create(req, res) {
  const {  estado } = req.body;

  modelos.estadocatering.create({
    estado,
    
  })
    .then(estado => {
      res.status(201).send(estado); // Enviar el cliente creado
    })
    .catch(err => {
      console.error("Error al crear el estado:", err); // Imprime el error en la consola
      res.status(500).send({ message: "Ocurrió un error al ingresar el estado.", error: err.message });
    });
}

function update(req, res) {
  const { idestado } = req.params; // Obtener el código del cliente de los parámetros
  const {  estado } = req.body; // Obtener los nuevos datos

  modelos.estadocatering.findOne({ where: { idestado } })
    .then(estados => {
      if (!estados) {
        return res.status(404).send({ message: 'Estado no encontrado.' }); // Cliente no existe
      }

      // Actualizar los datos del cliente
      estados.update({

        estado: estado || estados.estado,
      })
        .then(estadoActualizado => {
          res.status(200).send({ message: 'Estado actualizado exitosamente.', estados: estadoActualizado });
        })
        .catch(err => {
          console.error("Error al actualizar estado:", err);
          res.status(500).send({ message: "Ocurrió un error al actualizar el estado.", error: err.message });
        });
    })
    .catch(err => {
      console.error("Error al buscar el estado:", err);
      res.status(500).send({ message: "Ocurrió un error al buscar el estado.", error: err.message });
    });
}

function getAll(req, res) {
  modelos.estadocatering.findAll({
    order: [['idestado', 'ASC']] // Ordenar por codigocliente en orden ascendente
  })
    .then(estado => {
      if (estado.length === 0) {
        return res.status(404).send({ message: 'No se encontraron estados.' });
      }
      res.status(200).send(estado); // Enviar el listado de clientes ordenado
    })
    .catch(err => {
      console.error("Error al obtener los estados:", err);
      res.status(500).send({ message: "Ocurrió un error al obtener los estados.", error: err.message });
    });
}


module.exports = {
    create,
     update,
   // eliminar,
    getAll
  };