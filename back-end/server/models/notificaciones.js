// models/modelo.notificaciones.js
module.exports = (sequelize, DataTypes) => {
  const Notificacion = sequelize.define('notificaciones', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    codigocliente: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    tipo: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    idreserva: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    leida: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    creado_en: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  }, {
    tableName: 'notificaciones',
    freezeTableName: true,
    timestamps: false
  });

  Notificacion.associate = (models) => {
    Notificacion.belongsTo(models.clientes, {
      foreignKey: 'codigocliente',
      as: 'cliente'
    });
    Notificacion.belongsTo(models.reservas, {
      foreignKey: 'idreserva',
      as: 'reserva'
    });
  };

  return Notificacion;
};
