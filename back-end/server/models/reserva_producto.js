// server/models/reserva_producto.js
module.exports = (sequelize, DataTypes) => {
  const ReservaProducto = sequelize.define('reserva_producto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    idreserva: {
      type: DataTypes.STRING,
      allowNull: false
    },
    idproducto: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'reserva_producto',
    freezeTableName: true,
    timestamps: false
  });

  ReservaProducto.associate = models => {
    ReservaProducto.belongsTo(models.reservas, {
      foreignKey: 'idreserva',
      as: 'reserva'
    });
    ReservaProducto.belongsTo(models.productos, {
      foreignKey: 'idproducto',
      as: 'producto'
    });
  };

  return ReservaProducto;
};
