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

module.exports = {
  create,
  login
};