module.exports = (sequelize, DataTypes) => {
    // Definición del modelo 'usuarios'
    const cuenta_preclientes = sequelize.define('cuenta_preclientes', {
        idprecliente: {
            type: DataTypes.STRING,
            
            primaryKey: true,
            // autoIncrement: true
        },
        idcuenta: {
            type: DataTypes.STRING
        
    }, 
    
},{
        tableName: 'cuenta_preclientes',
        freezeTableName: true, 
         // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    return cuenta_preclientes;
};