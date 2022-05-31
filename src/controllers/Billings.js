const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');
const pdfCreator = require('html-pdf-node');

function generateSoftCode() {
    let length = 4, charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

module.exports = {
    async getDocInfo(req, res){
        const tempAccessToken = req.body.tempAccessToken;
        const tempDocRow = await prisma.docsTempTokens.findUnique({
            where: {
                tempTokenId: tempAccessToken
            }
        });
        if(tempDocRow){
            if(new Date() >= new Date(tempDocRow.expiration)){
                await prisma.docsTempTokens.delete({
                    where: {
                        tempTokenId: tempAccessToken
                    }
                });
                res.status(200).json({
                    "status": "error",
                    "message": "Token de acesso expirado."
                });
            }else{
                const documentIssued = await prisma.documentsHeader.findUnique({
                    where: {
                        id: tempDocRow.docId
                    },
                    include: {
                        clientAssociated: true,
                        details: true,
                        serieAssociated: true
                    }
                });
                await prisma.docsTempTokens.delete({
                    where: {
                        tempTokenId: tempAccessToken
                    }
                });
                res.status(200).json({
                    "status": "ok",
                    documentIssued
                });
            }
        }
    },
    async printDocument(req, res){
        const tempAccessToken = req.params.tempAccessToken;
        const tempDocRow = await prisma.docsTempTokens.findUnique({
            where: {
                tempTokenId: tempAccessToken
            }
        });
        if(tempDocRow){
            if(new Date() >= new Date(tempDocRow.expiration)){
                await prisma.docsTempTokens.delete({
                    where: {
                        tempTokenId: tempAccessToken
                    }
                });
                res.status(200).json({
                    "status": "error",
                    "message": "Token de acesso expirado."
                });
            }else{
                const options = { format: 'A4' };
                const file = { url: "http://192.168.1.10:8080/templates/billingDoc?tempAccessToken=" + req.params.tempAccessToken };
                pdfCreator.generatePdf(file, options).then(pdfBuffer => {
                    res.end(pdfBuffer);
                });
            }
        }
    },
    async saveDocument(req, res){
        const { clientId, items, observations, docDesc } = req.body;
        let totalIvaVT = 0;
        let totalIvaTR = 0;
        let totalIvaSS = 0;
        let totalDoc = 0;
        const documentId = uuidv4();
        const serie = await prisma.series.findMany({
            orderBy: {
                serieId: 'desc'
            },
            take: 1
        });
        if(new Date() >= new Date(serie[0].expiration)){
            res.status(200).json({
                "status": "error",
                "message": "Não existe nenhuma serie atualmente ativa."
            });
        }else{
            const newDocNumber = serie[0].lastDocNumber + 1;
            await prisma.series.update({
                where: {
                    serieId: serie[0].serieId
                },
                data: {
                    lastDocNumber: newDocNumber
                }
            });
            for(let i = 0; i <= items.length-1; i++){
                if(items[i].ivaType === 0){
                    totalIvaSS = totalIvaSS + (items[i].unitPriceWI-(items[i].unitPriceWI/1.06)) * items[i].itemQtd;
                }else if(items[i].ivaType === 1){
                    totalIvaTR = totalIvaTR + (items[i].unitPriceWI-(items[i].unitPriceWI/1.13)) * items[i].itemQtd;
                }else{
                    totalIvaVT = totalIvaVT + (items[i].unitPriceWI-(items[i].unitPriceWI/1.23)) * items[i].itemQtd;
                }
                totalDoc = totalDoc + items[i].unitPriceWI * items[i].itemQtd;
            }
            for(let i = 0; i <= items.length-1; i++){
                    await prisma.documentsBody.create({
                        data: {
                            descriptionItem: items[i].description,
                            detailId: uuidv4(),
                            ivaItem: items[i].ivaType,
                            priceItemIva: items[i].unitPriceWI,
                            qtdItem: items[i].itemQtd,
                            documentAssociated: {
                                connectOrCreate: {
                                    where: {
                                        id: documentId
                                    },
                                    create: {
                                        softwareCode: generateSoftCode(),
                                        atCode: '0-324634',
                                        date: new Date(),
                                        documentTotal: Math.round(totalDoc * 100) / 100,
                                        documentTotalIvaVT: Math.round(totalIvaVT * 100) / 100,
                                        documentTotalIvaTR: Math.round(totalIvaTR * 100) / 100,
                                        documentTotalIvaSS: Math.round(totalIvaSS * 100) / 100,
                                        docDescription: docDesc,
                                        typePeriodPay: 1,
                                        vencimento: new Date(),
                                        docNumber: newDocNumber,
                                        createdBy: 'Sistema',
                                        observations,
                                        // mbReference: '654731567',
                                        payMethod: 0,
                                        type: 3,
                                        id: documentId,
                                        clientAssociated: {
                                            connect: {
                                                clientId
                                            }
                                        },
                                        serieAssociated: {
                                            connect: {
                                                serieId: serie[0].serieId
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
        }
        res.status(200).json({
            "status": "ok",
            "message": "Documento gravado com sucesso!",
            documentId
        });
    },
    async getListOfDocuments(req, res){
        const clientId = req.clientId;
        const listDocuments = await prisma.documentsHeader.findMany({
            where: {
                clientAssociated: {
                    clientId
                }
            },
            select: {
                date: true,
                docNumber: true,
                documentTotal: true,
                id: true,
                type: true,
                serieAssociated: {
                    select: {
                        serieNumber: true
                    }
                }
            }
        });
        res.status(200).json(listDocuments);
    },
    async docsTempToken(req, res){
        const docId = req.body.docId;
        const tempTokenId = uuidv4();
        const atualTime = new Date();
        await prisma.docsTempTokens.create({
            data: {
                docId,
                tempTokenId,
                expiration: new Date(atualTime.setMinutes(atualTime.getMinutes()+1))
            }
        });
        res.status(200).json({
            "status": "ok",
            "message": "Token criado.",
            tempTokenId
        });
    }
};