module.exports = (sequelize, DataTypes) => {
    const menu = sequelize.define('menu', {
        idmenu: {
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
        precio: {
            type: DataTypes.DOUBLE
        }

    }, {
        tableName: 'menu',  // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    menu.associate = (models) => {
        menu.belongsTo(models.tipocatering, {
          foreignKey: 'idtipo',
          as: 'tipo',
        });
      };

    return menu;
};