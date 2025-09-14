module.exports = (sequelize, DataTypes) => {
    const estados = sequelize.define('estadocatering', {
        idestado: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        estado: {
            type: DataTypes.CHAR
        },
       
    
    }, {
        tableName: 'estadocatering',
        freezeTableName: true,  // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    estados.associate = (models) => {
        estados.hasMany(models.servicios, {
            foreignKey: 'idestado',
            as: 'estados',
        });
    }

    return estados;
};
