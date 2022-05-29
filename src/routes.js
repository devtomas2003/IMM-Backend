const express = require('express');
const routes = express.Router();

const Clientes = require('./controllers/Clientes');
const Contracts = require('./controllers/Contracts');
const Billings = require('./controllers/Billings');
const Auth = require('./middlewares/Auth');

routes.post('/tempPassword', Clientes.tempPassword);
routes.get('/tarrifs', Contracts.getTarrifs);
routes.post('/login', Clientes.login);
routes.get('/printDocument/:tempAccessToken', Billings.printDocument);
routes.post('/billDocInfo', Billings.getDocInfo);
routes.use('/templates', express.static(__dirname + '/pdf-templates'));
routes.use(Auth);
routes.post('/createContract', Contracts.createContract);
routes.post('/getClientTariffs', Contracts.getClientTariffs);
routes.post('/saveBillDocument', Billings.saveDocument);
routes.get('/checkAuth', Clientes.checkAuth);
routes.get('/getListOfBills', Billings.getListOfDocuments);
routes.post('/docsTempToken', Billings.docsTempToken);

module.exports = routes;