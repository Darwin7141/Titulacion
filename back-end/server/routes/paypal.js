const paypalController = require('../controllers/paypal');

module.exports = (app) => {
  app.post('/api/paypal/capture', paypalController.capture);
};