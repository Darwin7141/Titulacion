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
       
    }, {
        tableName: 'tipocatering',
        freezeTableName: true,  // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    tipo.associate = (models) => {
        tipo.hasMany(models.servicios, {
            foreignKey: 'idtipo',
            as: 'servCatering',
        });
    
        

    
    };

    
    return tipo;
};