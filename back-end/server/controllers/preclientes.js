const { validarCedulaEcuador, validarEmail, validarTelefono } = require('../utils/validaciones'); // Importar la función de validación
const modelos = require('../models'); // Importar los modelos
const bcrypt = require('bcrypt');

async function create(req, res) {
    const { ci, nombre, telefono, direccion, correo, contrasenia } = req.body;

    const { sequelize } = modelos;
    
      let t;

    try {

        t = await sequelize.transaction();
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
            transaction: t
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
        const precliente = await modelos.preclientes.create({
            idprecliente: nextCodigo,
            ci,
            nombre,
            
            telefono,
            direccion,
            correo,
            contrasenia: hashedPassword, // Usar la contraseña encriptada aquí
       rol: 2
    }, { transaction: t });


        // Generar el siguiente idcuenta para la tabla cuentasusuarios
        const lastUser = await modelos.cuentasusuarios.findOne({
              order: [['idcuenta', 'DESC']],
              transaction: t
            });
            let nextIdCuenta = 'CU001';
            if (lastUser?.idcuenta) {
              const num = parseInt(lastUser.idcuenta.slice(2), 10) + 1;
              nextIdCuenta = `CU${String(num).padStart(3, '0')}`;
            }
        
            // 6) Crear cuenta de usuario copiando el mismo rol del admin
            const cuenta = await modelos.cuentasusuarios.create({
              idcuenta: nextIdCuenta,
              correo: precliente.correo,
              contrasenia: hashedPassword,
              rol: precliente.rol     // <-- aquí aseguramos que rol en cuentasusuarios = rol de administrador
            }, { transaction: t });
        
            // 7) Crear la relación en cuenta_administrador
            await modelos.cuenta_preclientes.create({
              idprecliente: precliente.idprecliente,
              idcuenta: cuenta.idcuenta
            }, { transaction: t });
        
            // 8) Commit de la transacción
            await t.commit();
        
            // 9) Responder con el admin creado
            res.status(201).send(precliente);
    } catch (err) {
        await t.rollback();
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
