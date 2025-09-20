const menuController = require('../controllers').menucatering;
const cm= require ('connect-multiparty');

const path = require('path');
const fs = require('fs');

const isProd = process.env.NODE_ENV === 'production' || process.env.RENDER;
const UPLOAD_BASE = process.env.UPLOAD_BASE_DIR || (isProd
  ? '/var/data'
  : path.join(__dirname, '..', 'uploads')
);

// Carpeta para menús
const FOTOS_DIR  = path.join(UPLOAD_BASE, 'fotografiasMenus');
const THUMBS_DIR = path.join(FOTOS_DIR, 'thumbs');

fs.mkdirSync(THUMBS_DIR, { recursive: true });

// connect-multiparty guardará directo en FOTOS_DIR
const md_upload = cm({ uploadDir: FOTOS_DIR });


module.exports = (app) => {
    app.post('/api/menu',  menuController.create);
    app.put('/api/menu/:idmenu',  menuController.update);
    app.delete('/api/menu/:idmenu',  menuController.eliminar);
    app.get('/api/menu',  menuController.getAll);
    app.post('/api/uploadMenu/:idmenu', md_upload, menuController.uploadFotografia);
  app.get('/api/getMenu/:fotografia/:thumb', menuController.getFotografia);

};