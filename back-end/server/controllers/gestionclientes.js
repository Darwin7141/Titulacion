const { validarCedulaEcuador, validarEmail, validarTelefono } = require('../utils/validaciones'); // Importar la función de validación
const modelos = require('../models'); // Importar los modelos

function create(req, res) {
  const { codigocliente, ci, nombre, direccion, e_mail, telefono } = req.body;

  // Validar la cédula antes de crear el cliente
  if (!validarCedulaEcuador(ci)) {
    return res.status(400).send({ message: 'La cédula ingresada no es válida.' });
  }

  if (!validarEmail(e_mail)) {
    return res.status(400).send({ message: 'El correo ingresado no es válido.' });
  }

  if (!validarTelefono(telefono)) {
    return res.status(400).send({ message: 'El telefono ingresado no es válido.' });
  }

  // Si la cédula es válida, insertar el cliente
  modelos.clientes.create({
    codigocliente,
    ci,
    nombre,
    direccion,
    e_mail,
    telefono,
  })
    .then(cliente => {
      res.status(201).send(cliente); // Enviar el cliente creado
    })
    .catch(err => {
      console.error("Error al crear cliente:", err); // Imprime el error en la consola
      res.status(500).send({ message: "Ocurrió un error al ingresar al cliente.", error: err.message });
    });
}

// Función para buscar y actualizar un cliente
function update(req, res) {
  const { codigocliente } = req.params; // Obtener el código del cliente de los parámetros
  const { ci, nombre, direccion, e_mail, telefono } = req.body; // Obtener los nuevos datos

  // Validar los campos antes de actualizar
  if (ci && !validarCedulaEcuador(ci)) {
    return res.status(400).send({ message: 'La cédula ingresada no es válida.' });
  }

  if (e_mail && !validarEmail(e_mail)) {
    return res.status(400).send({ message: 'El correo ingresado no es válido.' });
  }

  if (telefono && !validarTelefono(telefono)) {
    return res.status(400).send({ message: 'El teléfono ingresado no es válido.' });
  }

  // Buscar el cliente y actualizar sus datos
  modelos.clientes.findOne({ where: { codigocliente } })
    .then(clientes => {
      if (!clientes) {
        return res.status(404).send({ message: 'Cliente no encontrado.' }); // Cliente no existe
      }

      // Actualizar los datos del cliente
      clientes.update({
        ci: ci || clientes.ci,
        nombre: nombre || clientes.nombre,
        direccion: direccion || clientes.direccion,
        e_mail: e_mail || clientes.e_mail,
        telefono: telefono || clientes.telefono,
      })
        .then(clienteActualizado => {
          res.status(200).send({ message: 'Cliente actualizado exitosamente.', cliente: clienteActualizado });
        })
        .catch(err => {
          console.error("Error al actualizar cliente:", err);
          res.status(500).send({ message: "Ocurrió un error al actualizar el cliente.", error: err.message });
        });
    })
    .catch(err => {
      console.error("Error al buscar cliente:", err);
      res.status(500).send({ message: "Ocurrió un error al buscar el cliente.", error: err.message });
    });
}

function eliminar(req, res) {
  const { codigocliente } = req.params;

  // Buscar el cliente por su código
  modelos.clientes.destroy({ where: { codigocliente } })
    .then(deletedRows => {
      if (deletedRows === 0) {
        return res.status(404).send({ message: 'Cliente no encontrado.' });
      }
      res.status(200).send({ message: 'Cliente eliminado exitosamente.' });
    })
    .catch(err => {
      console.error("Error al eliminar cliente:", err);
      res.status(500).send({ message: "Ocurrió un error al eliminar el cliente.", error: err.message });
    });
}


module.exports = {
    create,
    update,
    eliminar,
  };