const modelos = require('../models');
const bcrypt = require('bcrypt');

async function create(req, res) {
  try {
      // Obtener el último ID de usuario con el formato de 'CU001', 'CU002', etc.
      const lastUser = await modelos.cuentasusuarios.findOne({
          order: [['idcuenta', 'DESC']],
      });

      // Generar el siguiente ID
      let nextCodigo = 'CU001'; // Valor inicial por defecto
      if (lastUser && lastUser.idcuenta) {
          const lastNumber = parseInt(lastUser.idcuenta.slice(2), 10); // Extraer el número después de 'CU'
          nextCodigo = `CU${String(lastNumber + 1).padStart(3, '0')}`; // Incrementar y formatear
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(req.body.contrasenia, 10);
      req.body.contrasenia = hashedPassword;

      // Incluir el ID generado en la creación del usuario
      req.body.idcuenta = nextCodigo;

      // Crear el nuevo usuario
      const usuario = await modelos.cuentasusuarios.create(req.body);

      // Respuesta exitosa
      res.status(200).send({ usuario });
  } catch (err) {
      // Manejo de errores
      res.status(500).send({ err });
  }
}

async function update(req, res) {
  const { idcuenta } = req.params; // Código del usuario desde los parámetros de la URL
  const { correo, contrasenia } = req.body; // Datos a actualizar

  try {
      // Buscar al usuario por ID
      const usuario = await modelos.cuentasusuarios.findOne({ where: { idcuenta } });
      if (usuario.rol.startsWith('CL')) {
        const cliente = await modelos.clientes.findOne({
          where: { codigocliente: usuario.rol }
        });
        // Añadirlo a la respuesta
        return res.status(200).json({
          usuario: {
            idcuenta: usuario.idcuenta,
            correo: usuario.correo,
            rol: usuario.rol,
            codigocliente: cliente.codigocliente,
            
            // etcétera si deseas
          }
        });
      }
      if (!usuario) {
          return res.status(404).send({ message: 'Usuario no encontrado.' });
      }

      // Si la contraseña es proporcionada, la encriptamos antes de actualizar
      if (contrasenia) {
          const hashedPassword = await bcrypt.hash(contrasenia, 10);
          req.body.contrasenia = hashedPassword;
      }

      // Actualizar los datos del usuario, pero no modificar el idcuenta
      await usuario.update({
          correo: correo || usuario.correo,
          contrasenia: req.body.contrasenia || usuario.contrasenia,
          
      });

      res.status(200).send({ message: 'Usuario actualizado exitosamente.', usuario });
  } catch (err) {
      console.error('Error al actualizar el usuario:', err);
      res.status(500).send({ message: 'Ocurrió un error al actualizar el usuario.', error: err.message });
  }
}

function eliminar(req, res) {
  const { idcuenta } = req.params;

  // Buscar si el empleado existe
  modelos.cuentasusuarios.findOne({
      where: { idcuenta },
  })
      .then((cuenta) => {
          if (!cuenta) {
              // Si no existe el empleado, devolver un mensaje de error
              return res.status(404).send({ message: 'Usuario no encontrado.' });
          }

          // Eliminar el empleado
          modelos.cuentasusuarios
              .destroy({
                  where: { idcuenta },
              })
              .then(() => {
                  // Asegurarse de restablecer la secuencia con el valor máximo actual de codigoempleado
                  modelos.sequelize.query(`
                      SELECT setval('cuentasusuarios_id_seq', COALESCE((SELECT MAX(CAST(SUBSTRING(idcuenta FROM 3) AS INT)) FROM public.cuentasusuarios), 0), false)
                  `)
                      .then(([result]) => {
                          // Revisar si la consulta tuvo éxito
                          if (result) {
                              return res.status(200).send({ message: 'Usuario eliminado correctamente y secuencia restablecida.' });
                          } else {
                              console.error('No se pudo restablecer la secuencia.');
                              return res.status(500).send({ message: 'Error al restablecer la secuencia del usuario.' });
                          }
                      })
                      .catch((err) => {
                          console.error('Error al restablecer la secuencia:', err);
                          return res.status(500).send({ message: 'Error al restablecer la secuencia del usuario.' });
                      });
              })
              .catch((err) => {
                  console.error('Error al eliminar el usuario:', err);
                  return res.status(500).send({ message: 'Ocurrió un error al eliminar el usuario.' });
              });
      })
      .catch((err) => {
          console.error('Error al buscar el usuario:', err);
          return res.status(500).send({ message: 'Ocurrió un error al buscar el usuario.' });
      });
}


async function login(req, res) {
  try {
    /* 1. Buscar la cuenta --------------------------- */
    const cuenta = await modelos.cuentasusuarios.findOne({
    where: { correo: req.body.correo }
  });
  if (!cuenta) return res.status(401).json({ message: 'Correo no encontrado' });

  /* 2. Contraseña -------------------------------------------------- */
  const ok = await bcrypt.compare(req.body.contrasenia, cuenta.contrasenia);
  if (!ok) return res.status(400).json({ message: 'Contraseña incorrecta' });

  /* 3. Traer datos personales segun rol --------------------------- */
  let datosPersona = {};

  if (cuenta.rol === 1) {                      // PRE-cliente
    const enlace = await modelos.cuenta_administrador.findOne({
      where: { id_cuenta: cuenta.idcuenta }     // FK en la tabla puente
    });
    if (enlace) {
      const admin = await modelos.administrador.findByPk(enlace.codigoadmin);
      if (admin) datosPersona = {
        codigoadmin: admin.ci,
        ci: admin.ci,
        nombre: admin.nombre,
        direccion: admin.direccion,
        e_mail: admin.e_mail,
        telefono: admin.telefono,
        
                              // o cuenta.correo
      };
    }
  }

  if (cuenta.rol === 2) {                      // PRE-cliente
    const enlace = await modelos.cuenta_preclientes.findOne({
      where: { idcuenta: cuenta.idcuenta }     // FK en la tabla puente
    });
    if (enlace) {
      const pre = await modelos.preclientes.findByPk(enlace.idprecliente);
      if (pre) datosPersona = {
        idprecliente: pre.idprecliente,
        ci: pre.ci,
        nombre: pre.nombre,
        telefono: pre.telefono,
        direccion: pre.direccion,
        correo: pre.correo                       // o cuenta.correo
      };
    }
  }

  if (cuenta.rol === 3) {                      // Cliente
    const enlace = await modelos.cuenta_clientes.findOne({
      where: { id_cuenta: cuenta.idcuenta }
    });
    if (enlace) {
      const cli = await modelos.clientes.findByPk(enlace.id_cliente);
      if (cli) datosPersona = {
        codigocliente: cli.codigocliente,
        ci: cli.ci,
        nombre: cli.nombre,
        telefono: cli.telefono,
        direccion: cli.direccion,
        correo: cli.e_mail                       // campo en tabla clientes
      };
    }
  }

    /* 4. Respuesta completa ------------------------- */
    return res.status(200).json({
      message: 'Login exitoso', 
      usuario: {
        idcuenta: cuenta.idcuenta,
        rol: cuenta.rol,
        correo:  cuenta.correo,
        ...datosPersona                               // ← aquí van ci, nombre, etc.
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en el servidor', error: err.message });
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
  update,
  eliminar,
  login,
  getAll
  
};
