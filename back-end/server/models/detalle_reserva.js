
module.exports = (sequelize, DataTypes) => {
  const detalle_reserva = sequelize.define("detalle_reserva", {
    iddetalle: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    idreserva: {
      type: DataTypes.STRING, // O DataTypes.INTEGER si 'reservas.idreserva' es int
      allowNull: false
    },
    idmenu: {
      type: DataTypes.STRING, // O DataTypes.INTEGER si 'menu.idmenu' es int
      allowNull: false
    },
    cantpersonas: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    preciounitario: {
      type: DataTypes.DOUBLE,
      allowNull: false
    },
    subtotal: {
      type: DataTypes.DOUBLE,
      allowNull: false
    }
  }, {
    tableName: "detalle_reserva",
    freezeTableName: true,
    timestamps: false // si tu tabla no maneja createdAt/updatedAt
  });

  detalle_reserva.associate = function(models) {
    // Asume que tu modelo de reservas se llama 'reservas'
    detalle_reserva.belongsTo(models.reservas, {
      foreignKey: "idreserva",
      as: "reserva" 
    });

    // Asume que tu modelo de menu se llama 'menu'
    detalle_reserva.belongsTo(models.menu, {
      foreignKey: "idmenu",
      as: "menu"
    });
  };

  return detalle_reserva;
};
