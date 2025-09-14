module.exports = (sequelize, DataTypes) => {
    const categorias = sequelize.define('categoria_productos', {
        idcategoria: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        categoria: {
            type: DataTypes.STRING
        },
        
    }, {
        tableName: 'categoria_productos',
        freezeTableName: true,// Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });
    categorias.associate = (models) => {
        categorias.hasMany(models.productos, {
            foreignKey: 'idcategoria',
            as: 'catProducto',
        });
    }
    
    return categorias;
};
