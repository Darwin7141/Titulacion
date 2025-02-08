module.exports = (sequelize, DataTypes) => {
    const menu = sequelize.define('menu', {
        idmenu: {
            type: DataTypes.STRING,
            primaryKey: true,
            autoIncrement: true
        },
        idservicio: {
            type: DataTypes.STRING
        },
        nombre: {
            type: DataTypes.STRING
        },
        descripcion: {
            type: DataTypes.TEXT
        },
        precio: {
            type: DataTypes.DOUBLE
        },
        imagen: {
            type: DataTypes.STRING
        },

    }, {
        tableName: 'menu',  // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    menu.associate = (models) => {
        menu.belongsTo(models.servicios, {
          foreignKey: 'idservicio',
          as: 'servicio',
        });

        menu.hasMany(models.detalle_reserva, {
            foreignKey: 'idmenu',
            as: 'detalles'
          });

        
      };

    return menu;
};