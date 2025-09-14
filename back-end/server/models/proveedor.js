module.exports = (sequelize, DataTypes) => {
    const proveedores = sequelize.define('proveedor', {
        codigoproveedor: {
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

        direccion: {
            type: DataTypes.STRING
        },

        e_mail: {
            type: DataTypes.STRING
        },

        telefono: {
            type: DataTypes.CHAR
        },
        id_admin: {
            type: DataTypes.STRING
        },
    
    }, {
        tableName: 'proveedor',
        freezeTableName: true,  // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    proveedores.associate = (models) => {
        proveedores.hasMany(models.productos, {
          foreignKey: 'codigoproveedor',
          as: 'tipoProductos',
        });
      };
    return proveedores;
};
