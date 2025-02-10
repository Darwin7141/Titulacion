module.exports = (sequelize, DataTypes) => {
    const estado = sequelize.define('estado_reserva', {
        idestado: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        estado_reserva: {
            type: DataTypes.CHAR
        },
       
    
    }, {
        tableName: 'estado_reserva',  // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    estado.associate = (models) => {
        estado.hasMany(models.reservas, {
          foreignKey: 'idestado',
          as: 'estado',
        });

    }

   

    return estado;
};
