module.exports = (sequelize, DataTypes) => {
    // Definición del modelo 'usuarios'
    const roles = sequelize.define('roles', {
        id_rol: {
            type: DataTypes.INTEGER,
            
            primaryKey: true,
            // autoIncrement: true
        },
        descripcion: {
            type: DataTypes.STRING
        
    }, 
    
},{
        tableName: 'roles',
        freezeTableName: true,  // Especificar el nombre de la tabla como 'cargo'
        timestamps: false
    });

    return roles;
};