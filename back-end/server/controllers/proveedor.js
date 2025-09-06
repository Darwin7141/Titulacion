const { validarIdentificacionEcuador, validarEmail, validarTelefono } = require('../utils/validaciones'); // Importar la función de validación
const modelos = require('../models'); // Importar los modelos

async function create(req, res) {
  const { ci, nombre, direccion, e_mail, telefono} = req.body;

  const id_admin = req.session.admin.codigoadmin;

  try {
      // Validar datos antes de la inserción
      if (!validarIdentificacionEcuador(ci)) {
  return res.status(400).send({ message: 'La identificación (Cédula/RUC) no es válida.' });
      }

      if (!validarEmail(e_mail)) {
          return res.status(400).send({ message: 'El correo ingresado no es válido.' });
      }

      if (!validarTelefono(telefono)) {
          return res.status(400).send({ message: 'El teléfono ingresado no es válido.' });
      }

      // Obtener el último valor de codigoempleado
      const lastProv = await modelos.proveedor.findOne({
          order: [['codigoproveedor', 'DESC']],
      });

      // Generar el siguiente código
      let nextCodigo = 'P001'; // Valor inicial por defecto
      if (lastProv && lastProv.codigoproveedor) {
          const lastNumber = parseInt(lastProv.codigoproveedor.slice(1), 10); // Extraer número
          nextCodigo = `P${String(lastNumber + 1).padStart(3, '0')}`; // Incrementar y formatear
      }

      // Crear el nuevo empleado con el código generado
      const proveedor = await modelos.proveedor.create({
          codigoproveedor: nextCodigo,
          ci,
          nombre,
          direccion,
          e_mail,
          telefono,
          id_admin
          
      });

      res.status(201).send(proveedor); // Enviar el empleado creado
  } catch (err) {
      console.error('Error al crear proveedor:', err);
      res.status(500).send({ message: 'Ocurrió un error al ingresar el proveedor.', error: err.message });
  }
}

async function update(req, res) {
  const { codigoproveedor } = req.params; // Código del empleado desde los parámetros de la URL
  const { ci, nombre, direccion, e_mail, telefono, id_admin } = req.body; // Datos a actualizar

  try {
      // Validar los campos antes de la actualización
      if (ci && !validarIdentificacionEcuador(ci)) {
          return res.status(400).send({ message: 'La identificación (Cédula/RUC) no es válida.' });
      }

      if (e_mail && !validarEmail(e_mail)) {
          return res.status(400).send({ message: 'El correo ingresado no es válido.' });
      }

      if (telefono && !validarTelefono(telefono)) {
          return res.status(400).send({ message: 'El teléfono ingresado no es válido.' });
      }

      // Buscar al empleado en la base de datos
      const proveedor = await modelos.proveedor.findOne({ where: { codigoproveedor } });

      if (!proveedor) {
          return res.status(404).send({ message: 'Administrador no encontrado.' });
      }

      // Actualizar los datos del empleado
      await proveedor.update({
          ci: ci || proveedor.ci,
          nombre: nombre || proveedor.nombre,
          direccion: direccion || proveedor.direccion,
          e_mail: e_mail || proveedor.e_mail,
          telefono: telefono || proveedor.telefono,
          id_admin: id_admin || proveedor.id_admin
      });

      res.status(200).send({ message: 'Proveedor actualizado exitosamente.', proveedor });
  } catch (err) {
      console.error('Error al actualizar el proveedor:', err);
      res.status(500).send({ message: 'Ocurrió un error al actualizar el proveedor.', error: err.message });
  }
}

function eliminar(req, res) {
  const { codigoproveedor } = req.params;

  modelos.proveedor.findOne({
    where: { codigoproveedor },
  })
  .then((proveedor) => {
    if (!proveedor) {
      return res.status(404).send({ message: 'Proveedor no encontrado.' });
    }

    return modelos.proveedor.destroy({
      where: { codigoproveedor },
    });
  })
  .then((rowsDeleted) => {
    if (rowsDeleted === 0) {
      // por si falla el destroy por alguna razón
      return res.status(500).send({ message: 'No se pudo eliminar el proveedor.' });
    }
    // ¡Listo! No tocamos la secuencia
    return res.status(200).send({ message: 'Proveedor eliminado correctamente.' });
  })
  .catch((err) => {
    console.error(err);
    return res.status(500).send({ message: 'Ocurrió un error en la operación.' });
  });
}

function getAll(req, res) {
  modelos.proveedor.findAll({
    order: [['codigoproveedor', 'ASC']] // Ordenar por codigocliente en orden ascendente
  })
    .then(proveedor => {
      if (proveedor.length === 0) {
        return res.status(404).send({ message: 'No se encontraron proveedores.' });
      }
      res.status(200).send(proveedor); // Enviar el listado de clientes ordenado
    })
    .catch(err => {
      console.error("Error al obtener los proveedores:", err);
      res.status(500).send({ message: "Ocurrió un error al obtener los proveedores.", error: err.message });
    });
}

/*async function verificarCedula(req, res) {
    const { ci } = req.params;
    try {
        const cliente = await modelos.proveedor.findOne({ where: { ci } });
        if (cliente) {
            return res.status(200).send({ existe: true });
        }
        res.status(200).send({ existe: false });
    } catch (err) {
        console.error("Error al verificar cédula:", err);
        res.status(500).send({ message: "Error al verificar la cédula.", error: err.message });
    }
}*/


async function verificarIdentificacion(req, res) {
  const id = req.params.id ?? req.params.ci;  // <-- clave
  if (!id) {
    return res.status(400).send({ message: 'Falta parámetro id/ci' });
  }
  try {
    const prov = await modelos.proveedor.findOne({ where: { ci: id } });
    return res.status(200).send({ existe: !!prov });
  } catch (err) {
    console.error("Error al verificar identificación:", err);
    res.status(500).send({ message: "Error al verificar la identificación.", error: err.message });
  }
}


async function verificarEmail(req, res) {
    const { email } = req.params;
    try {
        const cliente = await modelos.proveedor.findOne({ where: { e_mail: email } });
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
        const cliente = await modelos.proveedor.findOne({ where: { telefono } });
        if (cliente) {
            return res.status(200).send({ existe: true });
        }
        res.status(200).send({ existe: false });
    } catch (err) {
        console.error("Error al verificar teléfono:", err);
        res.status(500).send({ message: "Error al verificar el teléfono.", error: err.message });
    }
}

async function getProveedorPorCedula(req, res) {
    const { ci } = req.params;
    try {
      const cliente = await modelos.proveedor.findOne({ where: { ci } });
      if (!cliente) {
        return res.status(404).send({ message: 'No se encontró un proveedor con esa cédula.' });
      }
      // Enviamos todo el objeto cliente (o filtra lo que quieras)
      return res.status(200).send(cliente);
    } catch (err) {
      console.error("Error al obtener proveedor por cédula:", err);
      return res.status(500).send({ message: "Error al obtener proveedor por cédula.", error: err.message });
    }
  }

  async function getProveedorPorEmail(req, res) {
    const { email } = req.params;
    try {
      const cliente = await modelos.proveedor.findOne({ where: { e_mail: email } });
      if (!cliente) {
        return res.status(404).send({ message: 'No se encontró un proveedor con ese e-mail.' });
      }
      return res.status(200).send(cliente);
    } catch (err) {
      // ...
    }
  }

  async function getProveedorPorTelefono(req, res) {
    const { telefono } = req.params;
    try {
      const cliente = await modelos.proveedor.findOne({ where: { telefono } });
      if (!cliente) {
        return res.status(404).send({ message: 'No se encontró un proveedor con ese e-mail.' });
      }
      return res.status(200).send(cliente);
    } catch (err) {
      // ...
    }
  }

  async function getOneByCodigo(req, res) {
  const codigoproveedor = req.params.codigoproveedor;
  try {
    // Busca cliente por su clave primaria (codigocliente)
    const cliente = await modelos.proveedor.findByPk(codigoproveedor);
    if (!cliente) {
      return res.status(404).json({ message: 'Proveedor no encontrado.' });
    }
    // En este punto `cliente` es un objeto con todos sus campos (nombre, ci, direccion, telefono, etc.)
    return res.status(200).json(cliente);
  } catch (err) {
    console.error('Error al obtener proveedor por código:', err);
    return res.status(500).json({
      message: 'Ocurrió un error al buscar el proveedor.',
      error: err.message
    });
  }
}


module.exports = {
    create,
    update,
    eliminar,
    getAll,
    //verificarCedula,
    verificarIdentificacion,
    verificarEmail,
    verificarTelefono,
    getProveedorPorCedula,
    getProveedorPorEmail,
    getProveedorPorTelefono,
    getOneByCodigo
  };