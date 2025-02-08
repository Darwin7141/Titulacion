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

    cargoempleados.associate = (models) => {
        cargoempleados.hasMany(models.empleado, {
          foreignKey: 'idcargo',
          as: 'empleados',
        });
      };
    return cargoempleados;
};
