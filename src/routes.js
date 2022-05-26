const express = require('express');
const routes = express.Router();

const Clientes = require('./controllers/Clientes');
const Contracts = require('./controllers/Contracts');
const Faturacao = require('./controllers/Faturacao');

routes.post('/tempPassword', Clientes.getTempPassword);
routes.post('/createContract', Contracts.createContract);
routes.post('/getClientTariffs', Contracts.getClientTariffs);
routes.post('/saveInvoice', Faturacao.saveInvoice);
routes.get('/printInvoice/:documentId', Faturacao.printInvoice);
routes.get('/tarrifs', Contracts.getTarrifs);
routes.post('/login', Clientes.login);

module.exports = routes;