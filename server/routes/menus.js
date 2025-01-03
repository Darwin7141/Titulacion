const menuController = require('../controllers').menucatering;


module.exports = (app) => {
    app.post('/api/menu',  menuController.create);
    app.put('/api/menu/:idmenu',  menuController.update);
    app.delete('/api/menu/:idmenu',  menuController.eliminar);
    app.get('/api/menu',  menuController.getAll);
};