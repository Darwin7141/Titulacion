module.exports = (sequelize, DataTypes) => {
    // Definición del modelo 'usuarios'
    const usuarios = sequelize.define('cuentasusuarios', {
        idcuenta: {
            type: DataTypes.STRING,
            
            primaryKey: true,
            // autoIncrement: true
        },
        correo: {
            type: DataTypes.STRING
        },
        contrasenia: {
            type: DataTypes.STRING
        },
    
        createdAt: {
            type: DataTypes.DATE
        },
        updatedAt: {
            type: DataTypes.DATE
        }
    });

    return usuarios;
};