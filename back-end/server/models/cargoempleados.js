module.exports = (sequelize, DataTypes) => {
    const cargoempleados = sequelize.define('cargo', {
        idcargo: {
            type: DataTypes.STRING,
            primaryKey: true,
            autoIncrement: true
        },
        nombrecargo: {
            type: DataTypes.STRING
        },
        descripcion: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'cargo',  // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    return cargoempleados;
};
