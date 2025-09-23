require('dotenv').config(); // Cargar las variables de entorno desde .env

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT || 5432,
  dialect:  'postgres'
};

module.exports = {
  development: {
    ...base
  },
  test: {
    
    username: "root",
    password: null,
    database: "database_test",
    host: "127.0.0.1",
    dialect: "mysql"
  },
  production: {
    ...base,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false }  
    }
  }
};