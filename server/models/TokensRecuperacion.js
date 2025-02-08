module.exports = (sequelize, DataTypes) => {
  const TokensRecuperacion = sequelize.define('tokens_recuperacion', {
    correo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expira_en: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'tokens_recuperacion',
    timestamps: false,
  });

  return TokensRecuperacion;
};
