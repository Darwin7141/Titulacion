const menuController = require('../controllers').menucatering;
const cm= require ('connect-multiparty');
const md_upload = cm ({uploadDir:'./server/uploads/fotografiasMenus'});


module.exports = (app) => {
    app.post('/api/menu',  menuController.create);
    app.put('/api/menu/:idmenu',  menuController.update);
    app.delete('/api/menu/:idmenu',  menuController.eliminar);
    app.get('/api/menu',  menuController.getAll);
    app.post('/api/uploadMenu/:idmenu',md_upload,  menuController.uploadFotografia);
    app.get('/api/getMenu/:fotografia/:thumb',md_upload,  menuController.getFotografia);

};