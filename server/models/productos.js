module.exports = (sequelize, DataTypes) => {
    const productos = sequelize.define('productos', {
        idproducto: {
            type: DataTypes.STRING,
            primaryKey: true,
            autoIncrement: true
        },
        nombre: {
            type: DataTypes.STRING
        },
        stock: {
            type: DataTypes.INTEGER
        },
        codigoproveedor: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'productos',// Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    productos.associate = (models) => {
        productos.belongsTo(models.proveedor, {
            foreignKey: 'codigoproveedor',
            as: 'proveedor',
        });
    }
    return productos;
};
