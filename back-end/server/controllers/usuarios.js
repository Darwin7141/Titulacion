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
      // 1. Buscar el usuario (cuentasusuarios) por correo
      const usuario = await modelos.cuentasusuarios.findOne({
        where: { correo: req.body.correo }
      });
  
      // 2. Validar si el usuario existe
      if (!usuario) {
        return res.status(401).json({ message: "Correo no encontrado" });
      }
  
      // 3. Comparar la contraseña
      const isMatch = await bcrypt.compare(req.body.contrasenia, usuario.contrasenia);
      if (!isMatch) {
        return res.status(400).json({ error: "Contraseña incorrecta" });
      }
  
      // 4. Si el rol comienza con "PRE" (ej. "PRE001"), buscar datos en la tabla preclientes
      let datosPrecliente = {};
      if (usuario.rol.startsWith('P')) {
        const precliente = await modelos.preclientes.findOne({
          where: { idprecliente: usuario.rol }  // Asumiendo que "rol" = "PRE001" coincide con "idprecliente"
        });
  
        if (precliente) {
          datosPrecliente = {
            ci: precliente.ci,
            nombre: precliente.nombre,
            telefono: precliente.telefono,
            direccion: precliente.direccion,
            // Y todo lo que necesites:
            // correo: precliente.correo, // si hace falta
            idprecliente: precliente.idprecliente
          };
        }
      }

      let datosCliente = {};
      if (usuario.rol.startsWith('CL')) {
        const cliente = await modelos.clientes.findOne({
          where: { codigocliente: usuario.rol }  // Asumiendo que "rol" = "PRE001" coincide con "idprecliente"
        });
  
        if (cliente) {
          datosCliente = {
            ci: cliente.ci,
            nombre: cliente.nombre,
            telefono: cliente.telefono,
            direccion: cliente.direccion,
            // Y todo lo que necesites:
            // correo: precliente.correo, // si hace falta
            codigocliente: cliente.codigocliente
          };
        }
      }
  
      // 5. Respuesta exitosa, adjuntando campos del precliente si existe
      //    Observa que "usuario" es de la tabla cuentasusuarios, y "datosPrecliente" son los datos personales
      return res.status(200).send({
        message: "Login exitoso",
        usuario: {
          idcuenta: usuario.idcuenta,
          correo: usuario.correo,
          rol: usuario.rol,
          // OPCIONAL: contrasenia (quizá no lo quieras devolver)
          // Añade los campos del precliente, si existen
          ...datosPrecliente,
          ...datosCliente
        }
      });

      
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
  update,
  eliminar,
  login,
  getAll
  
};
