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
        
        
        cantpersonas: {
            type: DataTypes.INTEGER
        },
        total: {
            type: DataTypes.DOUBLE
        },
        pagorealizado: {
            type: DataTypes.DOUBLE
        },
        saldopendiente: {
            type: DataTypes.DOUBLE
        },
        idestado: {
            type: DataTypes.INTEGER
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

          reserva.belongsTo(models.estado_reserva, {
            foreignKey: 'idestado',
            as: 'nombre'
          });

       
      };

      
    return reserva;
};