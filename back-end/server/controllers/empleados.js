const { validarCedulaEcuador, validarEmail, validarTelefono } = require('../utils/validaciones'); // Importar la función de validación
const modelos = require('../models'); // Importar los modelos

function create(req, res) {
  const { codigoempleado, ci, nombre, direccion, e_mail, telefono, idcargo } = req.body;

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
  modelos.empleado.create({
    codigoempleado,
    ci,
    nombre,
    direccion,
    e_mail,
    telefono,
    idcargo
  })
    .then(empleados => {
      res.status(201).send(empleados); // Enviar el cliente creado
    })
    .catch(err => {
      console.error("Error al crear empleado:", err); // Imprime el error en la consola
      res.status(500).send({ message: "Ocurrió un error al ingresar el empleado.", error: err.message });
    });
}

function update(req, res) {
  const { codigoempleado } = req.params; // Obtener el código del cliente de los parámetros
  const {  ci,nombre, direccion, e_mail, telefono, idcargo} = req.body; // Obtener los nuevos datos

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
  modelos.empleado.findOne({ where: { codigoempleado } })
    .then(empleados => {
      if (!empleados) {
        return res.status(404).send({ message: 'Empleado no encontrado.' }); // Cliente no existe
      }

      // Actualizar los datos del cliente
      empleados.update({
        ci: ci || empleados.ci,
        nombre: nombre || empleados.nombre,
        direccion: direccion || empleados.direccion,
        e_mail: e_mail || empleados.e_mail,
        telefono: telefono || empleados.telefono,
        idcargo: idcargo|| empleados.idcargo,
      })
        .then(empleadoActualizado => {
          res.status(200).send({ message: 'Empleado actualizado exitosamente.', empleado: empleadoActualizado });
        })
        .catch(err => {
          console.error("Error al actualizar empleado:", err);
          res.status(500).send({ message: "Ocurrió un error al actualizar el empleado.", error: err.message });
        });
    })
    .catch(err => {
      console.error("Error al buscar al empleado:", err);
      res.status(500).send({ message: "Ocurrió un error al buscar el empleado.", error: err.message });
    });
}

function eliminar(req, res) { 
    const { codigoempleado } = req.params;

    // Buscar si el cargo existe
    modelos.empleado.findOne({
        where: { codigoempleado }
    })
    .then(empleados => {
        if (!empleados) {
            // Si no existe el cargo, devolver un mensaje de error
            return res.status(404).send({ message: 'Empleado no encontrado' });
        }

        // Eliminar el cargo
        modelos.empleado.destroy({
            where: { codigoempleado }
        })
        .then(() => {
            // Asegúrate de restablecer la secuencia con el valor máximo actual de idcargo
            modelos.sequelize.query(`
                SELECT setval('empleado_id_seq', COALESCE((SELECT MAX(CAST(SUBSTRING(codigoempleado FROM 2) AS INT)) FROM public.empleado), 0))
            `)
            .then(() => {
                res.status(200).send({ message: 'Empleado eliminado correctamente y secuencia restablecida' });
            })
            .catch(err => {
                console.error('Error al restablecer la secuencia:', err);
                res.status(500).send({ message: 'Error al restablecer la secuencia' });
            });
        })
        .catch(err => {
            console.error('Error al eliminar el empleado:', err);
            res.status(500).send({ message: 'Error al eliminar el empleado' });
        });
    })
    .catch(err => {
        console.error('Error al buscar el empleado:', err);
        res.status(500).send({ message: 'Error al buscar el empleado' });
    });
}

function getAll(req, res) {
  modelos.empleado.findAll({
    order: [['codigoempleado', 'ASC']] // Ordenar por codigocliente en orden ascendente
  })
    .then(empleados => {
      if (empleados.length === 0) {
        return res.status(404).send({ message: 'No se encontraron empleados.' });
      }
      res.status(200).send(empleados); // Enviar el listado de clientes ordenado
    })
    .catch(err => {
      console.error("Error al obtener los empleados:", err);
      res.status(500).send({ message: "Ocurrió un error al obtener los empleados.", error: err.message });
    });
}

module.exports = {
    create,
    update,
    eliminar,
    getAll
  };