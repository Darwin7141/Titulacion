const servicioController = require('../controllers').serviciocatering;
const cm= require ('connect-multiparty');
const md_upload = cm ({uploadDir:'./server/uploads/fotografias'});


module.exports = (app) => {
    app.post('/api/servicio',  servicioController.create);
    app.put('/api/servicio/:idservicio',  servicioController.update);
    app.delete('/api/servicio/:idservicio',  servicioController.eliminar);
    app.get('/api/servicio',  servicioController.getAll);
    app.post('/api/upload-fotografia/:idservicio',md_upload,  servicioController.uploadFotografia);
    app.get('/api/getfotografia/:fotografia/:thumb',md_upload,  servicioController.getFotografia);
};