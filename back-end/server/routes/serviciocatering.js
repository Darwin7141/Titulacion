const servicioController = require('../controllers').serviciocatering;
const cm= require ('connect-multiparty');

const path = require('path');
const fs = require('fs');

const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER;
const UPLOAD_BASE = process.env.UPLOAD_BASE_DIR || (isProd
  ? '/var/data'
  : path.join(__dirname, '..', 'uploads')
);

const FOTOS_DIR  = path.join(UPLOAD_BASE, 'fotografias');
const THUMBS_DIR = path.join(FOTOS_DIR, 'thumbs');

// Asegurar carpetas (necesario para connect-multiparty)
fs.mkdirSync(THUMBS_DIR, { recursive: true });

// Multiparty guardará directamente en FOTOS_DIR
const md_upload = cm({ uploadDir: FOTOS_DIR });

module.exports = (app) => {
    app.post('/api/servicio',  servicioController.create);
    app.put('/api/servicio/:idservicio',  servicioController.update);
    app.delete('/api/servicio/:idservicio',  servicioController.eliminar);
    app.get('/api/servicio',  servicioController.getAll);

    app.post('/api/upload-fotografia/:idservicio', md_upload, servicioController.uploadFotografia);
    app.get('/api/getfotografia/:fotografia/:thumb', servicioController.getFotografia);
};