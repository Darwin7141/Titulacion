module.exports = (sequelize, DataTypes) => {
    // Definición del modelo 'usuarios'
    const cuenta_clientes = sequelize.define('cuenta_clientes', {
        id_cliente: {
            type: DataTypes.STRING,
            
            primaryKey: true,
            // autoIncrement: true
        },
        id_cuenta: {
            type: DataTypes.STRING
        
    }, 
    
},{
        tableName: 'cuenta_clientes',
        freezeTableName: true,  // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    return cuenta_clientes;
};