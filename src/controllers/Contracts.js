const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

module.exports = {
    async getTarrifs(req, res){
        const tarrifs = await prisma.tariffs.findMany();
        res.status(200).json(tarrifs);
    },
    async createContract(req, res){
        const tarrifId = req.body.tarrifId;
        const clientId = req.body.clientId;
        const personalizedContract = req.body.personalizedContract;
        const fidelizationDuration = req.body.fidelizationDuration;
        const priceDuringContract = req.body.priceDuringContract;
        const priceAfterContract = req.body.priceAfterContract;
        const tarrif = await prisma.tariffs.findUnique({
            where: {
                id: tarrifId
            }
        });
        if(personalizedContract){
            if(fidelizationDuration === undefined || priceAfterContract === undefined || priceDuringContract === undefined){
                res.status(200).json({
                    "status": "error",
                    "message": "Falta parametrizar alguns dados do contrato."
                });
            }
        }
        await prisma.contracts.create({
            data: {
                contractId: uuidv4(),
                priceDuringContract: priceDuringContract === undefined ? tarrif.priceDuringContract : priceDuringContract,
                priceAfterContract: priceAfterContract === undefined ? tarrif.priceAfterContract : priceAfterContract,
                isContract: tarrif.haveFidelization,
                fidelizationDuration: fidelizationDuration === undefined ? tarrif.fidelizationDuration : fidelizationDuration,
                paidType: tarrif.paidType,
                tarrifAssociated: {
                    connect: {
                        id: tarrifId
                    }
                },
                clientAssociation: {
                    connect: {
                        clientId
                    }
                }
            }
        });
        res.status(200).json({
            "status": "ok",
            "messageApp": "Pedido de ativação realizado. Dentro de 24 horas recebera um SMS quando o seu novo tarifário entrar em vigor.",
            "messageInternal": "Pedido de ativação realizado. Informar cliente que dentro de 24 horas recebera um SMS quando o tarifário entrar em vigor."
        });
    },
    async getClientTariffs(req, res){
        const clientId = req.body.clientId;
        const clientTariffs = await prisma.clientes.findMany({
            where: {
                clientId
            },
            include: {
                contracts: {
                    include: {
                        tarrifAssociated: true
                    }
                }
            }
        });
        res.status(200).json(clientTariffs);
    }
};