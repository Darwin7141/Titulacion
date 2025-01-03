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
    
    }, {
        tableName: 'proveedor',  // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    return proveedores;
};
