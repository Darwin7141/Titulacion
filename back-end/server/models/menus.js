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

    return menu;
};