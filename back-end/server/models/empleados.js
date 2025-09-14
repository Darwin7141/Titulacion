module.exports = (sequelize, DataTypes) => {
    const empleados = sequelize.define('empleado', {
        codigoempleado: {
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

        idcargo: {
            type: DataTypes.STRING
        },

        id_admin: {
            type: DataTypes.STRING
        },
        
    
    }, {
        tableName: 'empleado', 
        freezeTableName: true, // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    empleados.associate = (models) => {
        empleados.belongsTo(models.cargo, {
            foreignKey: 'idcargo',
            as: 'cargo',
        });
    }
    return empleados;
};
