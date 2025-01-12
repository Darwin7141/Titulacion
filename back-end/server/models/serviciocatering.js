module.exports = (sequelize, DataTypes) => {
    const servicio = sequelize.define('servicios', {
        idservicio: {
            type: DataTypes.STRING,
            primaryKey: true,
            autoIncrement: true
        },
        idtipo: {
            type: DataTypes.STRING
        },
        nombre: {
            type: DataTypes.STRING
        },
        descripcion: {
            type: DataTypes.TEXT
        }

    }, {
        tableName: 'servicios',  // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    servicio.associate = (models) => {
        servicio.belongsTo(models.tipocatering, {
          foreignKey: 'idtipo',
          as: 'tipo',
        });
      };

    
    
    return servicio;
};