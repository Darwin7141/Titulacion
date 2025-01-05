module.exports = (sequelize, DataTypes) => {
    const tipo = sequelize.define('tipocatering', {
        idtipo: {
            type: DataTypes.STRING,
            primaryKey: true,
            autoIncrement: true
        },
        nombre: {
            type: DataTypes.STRING
        },
        descripcion: {
            type: DataTypes.TEXT
        },
        idestado: {
            type: DataTypes.INTEGER
        }
    }, {
        tableName: 'tipocatering',  // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    return tipo;
};