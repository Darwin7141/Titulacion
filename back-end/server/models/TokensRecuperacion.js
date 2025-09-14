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
    cuenta: {
            type: DataTypes.STRING,
            allowNull: false,
        },
  }, {
    tableName: 'tokens_recuperacion',
    freezeTableName: true,
    timestamps: false,
  });

  return TokensRecuperacion;
};
