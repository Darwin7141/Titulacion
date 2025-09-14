module.exports = (sequelize, DataTypes) => {
    const admin = sequelize.define('administrador', {
        codigoadmin: {
            type: DataTypes.STRING,
            primaryKey: true,
            autoIncrement: true
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

        contrasenia: {
            type: DataTypes.STRING
        },

         rol: {
            type: DataTypes.INTEGER
        },
    
    }, {
        tableName: 'administrador',
        freezeTableName: true,  // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    return admin;
};
