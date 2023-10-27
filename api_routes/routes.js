'use strict';

const controller = require('../controllers/controller');

module.exports = (app) => {
app.route('/about').get(controller.about);
app.route('/apiPaises').post(controller.callAPIpaises)
app.route('/tufin').post(controller.createTufinTicket)
}