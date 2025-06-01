module.exports = (sequelize, DataTypes) => {
    // Definición del modelo 'usuarios'
    const cuenta_admin = sequelize.define('cuenta_administrador', {
        id_admin: {
            type: DataTypes.STRING,
            
            primaryKey: true,
            // autoIncrement: true
        },
        id_cuenta: {
            type: DataTypes.STRING
        
    }, 
    
},{
        tableName: 'cuenta_administrador',  // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    return cuenta_admin;
};