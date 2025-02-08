const { validarCedulaEcuador, validarEmail, validarTelefono } = require('../utils/validaciones'); // Importar la función de validación
const modelos = require('../models'); // Importar los modelos
const bcrypt = require('bcrypt');

async function create(req, res) {
    const { ci, nombre, telefono, direccion, correo, contrasenia } = req.body;

    try {
        // Validar datos antes de la inserción
        if (!validarCedulaEcuador(ci)) {
            return res.status(400).send({ message: 'La cédula ingresada no es válida.' });
        }

        if (!validarEmail(correo)) {
            return res.status(400).send({ message: 'El correo ingresado no es válido.' });
        }

        if (!validarTelefono(telefono)) {
            return res.status(400).send({ message: 'El teléfono ingresado no es válido.' });
        }

        // Obtener el último valor de idprecliente
        const lastProv = await modelos.preclientes.findOne({
            order: [['idprecliente', 'DESC']],
        });

        // Generar el siguiente código para idprecliente
        let nextCodigo = 'PRE001'; // Valor inicial por defecto
        if (lastProv && lastProv.idprecliente) {
            const lastNumber = parseInt(lastProv.idprecliente.slice(3), 10); // Extraer número
            nextCodigo = `PRE${String(lastNumber + 1).padStart(3, '0')}`; // Incrementar y formatear
        }

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(contrasenia, 10);

        // Crear el nuevo precliente con la contraseña encriptada
        const proveedor = await modelos.preclientes.create({
            idprecliente: nextCodigo,
            ci,
            nombre,
            
            telefono,
            direccion,
            correo,
            contrasenia: hashedPassword // Usar la contraseña encriptada aquí
        });

        // Generar el siguiente idcuenta para la tabla cuentasusuarios
        const lastUser = await modelos.cuentasusuarios.findOne({
            order: [['idcuenta', 'DESC']],
        });

        let nextIdCuenta = 'CU001'; // Valor inicial por defecto
        if (lastUser && lastUser.idcuenta) {
            const lastNumber = parseInt(lastUser.idcuenta.slice(2), 10); // Extraer número
            nextIdCuenta = `CU${String(lastNumber + 1).padStart(3, '0')}`; // Incrementar y formatear
        }

        // Ahora, insertamos el usuario en la tabla cuentasusuarios
        await modelos.cuentasusuarios.create({
            idcuenta: nextIdCuenta, // Usamos el id generado
            correo,
            contrasenia: hashedPassword, // La contraseña ya encriptada
            rol: proveedor.idprecliente // Asignamos el 'idprecliente' como 'rol' en cuentasusuarios
        });

        // Responder con el proveedor creado
        res.status(201).send(proveedor); // Enviar el registro creado
    } catch (err) {
        console.error('Error al registrarse:', err);
        res.status(500).send({ message: 'Ocurrió un error al registrarse.', error: err.message });
    }
}

async function verificarCedula(req, res) {
    const { ci } = req.params;
    try {
        const cliente = await modelos.preclientes.findOne({ where: { ci } });
        if (cliente) {
            return res.status(200).send({ existe: true });
        }
        res.status(200).send({ existe: false });
    } catch (err) {
        console.error("Error al verificar cédula:", err);
        res.status(500).send({ message: "Error al verificar la cédula.", error: err.message });
    }
}

async function verificarEmail(req, res) {
    const { email } = req.params;
    try {
        const cliente = await modelos.preclientes.findOne({ where: { correo: email } });
        if (cliente) {
            return res.status(200).send({ existe: true });
        }
        res.status(200).send({ existe: false });
    } catch (err) {
        console.error("Error al verificar email:", err);
        res.status(500).send({ message: "Error al verificar el email.", error: err.message });
    }
}

async function verificarTelefono(req, res) {
    const { telefono } = req.params;
    try {
        const cliente = await modelos.preclientes.findOne({ where: { telefono } });
        if (cliente) {
            return res.status(200).send({ existe: true });
        }
        res.status(200).send({ existe: false });
    } catch (err) {
        console.error("Error al verificar teléfono:", err);
        res.status(500).send({ message: "Error al verificar el teléfono.", error: err.message });
    }
}


module.exports = {
    create,
    verificarCedula,
    verificarEmail,
    verificarTelefono
};
