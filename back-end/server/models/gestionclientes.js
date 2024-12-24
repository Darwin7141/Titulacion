module.exports = (sequelize, DataTypes) => {
    // Definición del modelo 'usuarios'
    const cliente = sequelize.define('clientes', {
        codigocliente: {
            type: DataTypes.STRING,
            
            primaryKey: true,
            // autoIncrement: true
        },
        ci: {
            type: DataTypes.CHAR
        },
        nombre: {
            type: DataTypes.STRING
        },

        direccion: {
            type: DataTypes.STRING
        },

        e_mail: {
            type: DataTypes.STRING
        },

        telefono: {
            type: DataTypes.CHAR
        },
    
    
        createdAt: {
            type: DataTypes.DATE
        },
        updatedAt: {
            type: DataTypes.DATE
        }
    });

    return cliente;
};