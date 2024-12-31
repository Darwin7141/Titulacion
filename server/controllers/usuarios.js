const modelos = require('../models');

const bcrypt = require('bcrypt');

function create(req, res) {
    bcrypt.hash(req.body.contrasenia, 10)
        .then(hashedPassword => {
            req.body.contrasenia = hashedPassword;

            return modelos.cuentasusuarios.create(req.body);
        })
        .then(usuario => {
            res.status(200).send({ usuario });
        })
        .catch(err => {
            res.status(500).send({ err });
        })
}


async function login(req, res) {
    try {
        // Buscar el usuario por correo
        const usuario = await modelos.cuentasusuarios.findOne({
            where: { correo: req.body.correo }
        });

        // Validar si el usuario existe
        if (!usuario) {
            return res.status(401).json({ message: "Correo no encontrado" });
        }

        // Comparar la contraseña ingresada con la almacenada
        const isMatch = await bcrypt.compare(req.body.contrasenia, usuario.contrasenia);

        if (!isMatch) {
            return res.status(400).json({ error: "Contraseña incorrecta" });
        }

        // Respuesta exitosa
        res.status(200).send({ message: "Login exitoso", usuario });
    } catch (err) {
        // Manejo de errores
        res.status(500).json({ error: "Error en el servidor", details: err.message });
    }
}

function getAll(req, res) {
    modelos.cuentasusuarios.findAll({
      order: [['idcuenta', 'ASC']] // Ordenar por codigocliente en orden ascendente
    })
      .then(usuario => {
        if (usuario.length === 0) {
          return res.status(404).send({ message: 'No se encontraron los usuarios.' });
        }
        res.status(200).send(usuario); // Enviar el listado de clientes ordenado
      })
      .catch(err => {
        console.error("Error al obtener los usuarios:", err);
        res.status(500).send({ message: "Ocurrió un error al obtener los usuarios.", error: err.message });
      });
  }

 


module.exports = {
  create,
  login,
  getAll
  
};
