const modelos = require('../models'); // Importar los modelos

function create(req, res) {
  const {  estado_reserva } = req.body;

  modelos.estado_reserva.create({
    estado_reserva,
    
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
  const {  estado_reserva } = req.body; // Obtener los nuevos datos

  modelos.estado_reserva.findOne({ where: { idestado } })
    .then(estados => {
      if (!estados) {
        return res.status(404).send({ message: 'Estado no encontrado.' }); // Cliente no existe
      }

      // Actualizar los datos del cliente
      estados.update({

        estado_reserva: estado_reserva || estados.estado_reserva,
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
  modelos.estado_reserva.findAll({
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