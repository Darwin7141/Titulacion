module.exports = (sequelize, DataTypes) => {
    const precliente = sequelize.define('preclientes', {
        idprecliente: {
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

        telefono: {
            type: DataTypes.CHAR
        },

        direccion: {
            type: DataTypes.STRING
        },

        correo: {
            type: DataTypes.STRING
        },
        contrasenia: {
            type: DataTypes.STRING
        },

    }, {
        tableName: 'preclientes',  // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });


    return precliente;
};
