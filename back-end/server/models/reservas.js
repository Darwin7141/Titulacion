module.exports = (sequelize, DataTypes) => {
    const reserva = sequelize.define('reservas', {
        idreserva: {
            type: DataTypes.STRING,
            primaryKey: true,
            autoIncrement: true
        },
        fechaevento: {
            type: DataTypes.DATE
        },
        codigocliente: {
            type: DataTypes.STRING
        },
        
        direccionevento: {
            type: DataTypes.TEXT
        },
        
        precio: {
            type: DataTypes.DOUBLE
        },
        cantpersonas: {
            type: DataTypes.INTEGER
        },
        total: {
            type: DataTypes.DOUBLE
        },

    }, {
        tableName: 'reservas',  // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    reserva.associate = (models) => {
        reserva.belongsTo(models.clientes, {
            foreignKey: 'codigocliente',
            as: 'cliente',
          });

          reserva.hasMany(models.detalle_reserva, {
            foreignKey: 'idreserva',
            as: 'detalles'
          });

       
      };

      
    return reserva;
};