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
        },
        imagen: {
            type: DataTypes.STRING
        },
        idestado: {
            type: DataTypes.INTEGER
        }

    }, {
        tableName: 'servicios',
        freezeTableName: true,  // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    servicio.associate = (models) => {
        servicio.belongsTo(models.tipocatering, {
          foreignKey: 'idtipo',
          as: 'tipo',
        });

        servicio.belongsTo(models.menu, {
            foreignKey: 'idservicio',
            as: 'tipoServicios',
          });

          servicio.belongsTo(models.estadocatering, {
            foreignKey: 'idestado',
            as: 'estado',
        });

        
        
      };

    
    
    return servicio;
};