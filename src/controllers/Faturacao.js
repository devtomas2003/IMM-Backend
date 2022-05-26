const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

module.exports = {
    async printInvoice(req, res){
        const documentId = req.params.documentId;
        const invoice = await prisma.invoices.findUnique({
            where: {
                id: documentId
            },
            include: {
                clientAssociated: true,
                details: true
            }
        });
        let products = [];
        for(let i = 0; i <= invoice.details.length-1; i++){
            products.push({ text: invoice.details[i].qtdItem.toString(), style: ['tabPad'] }, { text: invoice.details[i].descriptionItem, style: ['tabPad'] }, { text: '23%', style: ['tabPad'] }, { text: '1,00 €', style: ['tabPad'] }, { text: invoice.details[i].priceItemIva + " €", style: ['tabPad'] }, { text: invoice.details[i].priceItemIva * invoice.details[i].qtdItem + " €", style: ['tabPad'] });
        }
        console.log(products);
        const PdfPrinter = require('pdfmake');
        const fonts = {
            Helvetica: {
                normal: "Helvetica",
                bold: "Helvetica-Bold",
                italics: "Helvetica-Oblique",
                bolditalics: "Helvetica-BoldOblique"
            }
        }
        const printer = new PdfPrinter(fonts);
        const docDefinitions = {
            pageMargins: [ 25, 20, 20, 20 ],
            defaultStyle: { font: "Helvetica" },
            info: {
                title: invoice.type === 0 ? 'FT ' + invoice.docNumber : invoice.type === 1 ? "NC " + invoice.docNumber : 'REC' + invoice.docNumber,
                author: 'IMM',
            },
            content: [
                {
                    columns: [
                        {
                            image: 'src/assets/logoFat.png',
                            width: 100
                        },
                        [
                            {
                                text: invoice.type === 0 ? 'Tipo de documento: Fatura' : invoice.type === 1 ? "Tipo de documento: Nota de credito" : 'Tipo de documento: Recibo',
                                width: '*',
                                style: ['invoiceDetailsType']
                            },
                            {
                                text: invoice.type === 0 ? 'FT ' + invoice.docNumber : invoice.type === 1 ? "NC " + invoice.docNumber : 'REC' + invoice.docNumber,
                                width: '*',
                                style: ['invoiceDetailsNumber']
                            },
                            {
                                text: 'Data: ' + parseInt(new Date(invoice.date).getDate()+1).toString().padStart(2, "0") + "/" + parseInt(new Date(invoice.date).getMonth()+1).toString().padStart(2, "0") + "/" + new Date(invoice.date).getFullYear(),
                                width: '*',
                                style: ['invoiceDetailsDate']
                            }
                        ]
                    ]
                },
                {
                    columns: [
                        {
                            text: 'Codigo Cliente: 5245142',
                            style: ['topText']
                        },
                        {
                            text: invoice.clientAssociated.nome.toUpperCase(),
                            style: ['mailer']
                        }
                    ]
                },
                {
                    columns: [
                        {
                            text: 'Vencimento: ' + parseInt(new Date(invoice.vencimento).getDate()+1).toString().padStart(2, "0") + "/" + parseInt(new Date(invoice.vencimento).getMonth()+1).toString().padStart(2, "0") + "/" + new Date(invoice.vencimento).getFullYear(),
                            style: ['topText']
                        },
                        {
                            text:  invoice.clientAssociated.muradaFat,
                            style: ['mailer']
                        }
                    ]
                },
                {
                    columns: [
                        {
                            text: 'NIF: ' + invoice.clientAssociated.nif,
                            style: ['topText']
                        },
                        {
                            text: invoice.clientAssociated.localidadeFat,
                            style: ['mailer']
                        }
                    ]
                },
                {
                    columns: [
                        {
                            text: 'CVP: 14475275785',
                            style: ['topText']
                        },
                        {
                            text: invoice.clientAssociated.codPost,
                            style: ['mailer']
                        }
                    ]
                },
                {
                    columns: [
                        {
                            text: invoice.payMethod === 0 ? 'Metodo de Pagamento: Saldo' : invoice.payMethod === 1 ? 'Metodo de Pagamento: MbWay' : invoice.payMethod === 2 ? 'Metodo de Pagamento: Multibanco' : invoice.payMethod === 3 ? 'Metodo de Pagamento: Transferência bancária' : invoice.payMethod === 4 ? 'Metodo de Pagamento: Cartão debito/credito' : 'Metodo de Pagamento: Conta Corrente',
                            style: ['topText']
                        }
                    ]
                },
                {
                    layout: 'lightHorizontalLines',
                    style: 'tabelaProds',
                    table: {
                      headerRows: 1,
                      widths: [ 20, '*', 30, 50, 80, 90 ],
                      body: [
                        [ { text: 'Qtd', style: ['tabPad'] }, { text: 'Descrição', style: ['tabPad'] }, { text: 'IVA', style: ['tabPad'] }, { text: 'Valor IVA', style: ['tabPad'] }, { text: 'Preço Unit (c/IVA)', style: ['tabPad'] }, { style: ['tabPad'], text: 'Preço Total (c/IVA)' }],
                        products,
                        [ { text: 'Total do documento', bold: true, colSpan: 2, style: ['tabPad'] }, '', '', { text: parseFloat(invoice.documentTotalIva).toFixed(2) + " €", style: ['tabPad'] }, '', { text: parseFloat(invoice.documentTotal).toFixed(2) + " €", bold: true, style: ['tabPad'] }]
                      ]
                    }
                },
                {
                    table: {
                        widths: [ '*' ],
                        body: [
                            [
                                {
                                    text: 'Valor a pagar: ' + parseFloat(invoice.documentTotal).toFixed(2) + " €",
                                    style: 'txtInfoTotal',
                                    bold: true
                                }
                            ]
                        ]
                    },
                    layout: 'noBorders',
                    style: 'totalTables'
                },
                {
                    columns: [
                        [
                            { text: 'AT CODE: ' + invoice.atCode, style: 'bottomFacData' },
                            { qr: 'A:508939810*B:246144564*C:PT*D:FR*E:N*F:20220520*G:FR 1/101443*H:0*I1:PT*I3:65.04*I4:14.96*N:14.96*O:80.00*Q:wFga*R:0479', fit: '150', style: [''] }
                        ],
                        [
                        {
                            text: 'Metodos de Pagamento/Carregamento via APP: MbWay, Multibanco, Transferência Bancaria, Cartão de debito/credito, PayShope e Lojas',
                            style: ['softCert', 'bottomFacData']
                        },
                        {
                            text: invoice.softwareCode + ' - Processado por programa certificado nº 2386/AT.',
                            style: ['softCert', 'softCode']
                        },
                        {
                            layout: 'noBorders',
                            table: {
                              body: [
                                [ { image: 'src/assets/mb.png', rowSpan: 3, width: 50, style: 'logoMB' }, { text: 'Entidade: 24882', style: 'multiPayInfo' }],
                                [ '', { text: 'Referência: ' + invoice.mbReference, style: 'multiPayInfo' } ],
                                [ '', { text: 'Valor: ' + parseFloat(invoice.documentTotal).toFixed(2) + "€", style: 'multiPayInfo' } ],
                              ]
                            }
                          }
                        ]
                    ]
                }
            ],
            styles: {
                invoiceDetailsNumber: {
                    alignment: 'right',
                    marginTop: 3,
                    bold: true
                },
                invoiceDetailsType: {
                    alignment: 'right'
                },
                invoiceDetailsDate: {
                    alignment: 'right',
                    marginTop: 3
                },
                topText: {
                    marginTop: 8,
                    fontSize: 10
                },
                tabelaProds: {
                    marginTop: 20
                },
                mailer: {
                    marginTop: 10,
                    fontSize: 10
                },
                tabPad: {
                    marginTop: 2,
                    marginBottom: 2,
                    fontSize: 10
                },
                bottomFacData: {
                    marginTop: 410,
                    marginLeft: 15
                },
                softCert: {
                    fontSize: 10,
                    alignment: 'right'
                },
                softCode: {
                    marginTop: 10,
                    marginBottom: 10
                },
                totalTables: {
                    fillColor: '#ccc',
                    marginTop: 10
                },
                txtInfoTotal: {
                    marginTop: 3,
                    marginBottom: 3,
                    marginRight: 3,
                    alignment: 'right',
                    fontSize: 11
                },
                multiPayInfo: {
                    fontSize: 10,
                    marginTop: 6
                },
                logoMB: {
                    marginLeft: 80
                }
            }
        };
        const pdfDoc = printer.createPdfKitDocument(docDefinitions);
        const chunks = [];
        pdfDoc.on("data", (chunk) => {
            chunks.push(chunk);
        });
        pdfDoc.end();
        pdfDoc.on("end", () => {
            const result = Buffer.concat(chunks);
            res.end(result);
        });
    },
    async saveInvoice(req, res){
        const { clientId, items } = req.body;
        let totalDocIva = 0;
        let totalIva = 0;
        const invoiceId = uuidv4();
        for(let i = 0; i <= items.length-1; i++){
            if(items[i].ivaType === 0){
                totalIva = totalIva + (items[i].unitPriceWI-(items[i].unitPriceWI/1.06)) * items[i].itemQtd;
            }else if(items[i].ivaType === 1){
                totalIva = totalIva + (items[i].unitPriceWI-(items[i].unitPriceWI/1.13)) * items[i].itemQtd;
            }else{
                totalIva = totalIva + (items[i].unitPriceWI-(items[i].unitPriceWI/1.23)) * items[i].itemQtd;
            }
            totalDocIva = totalDocIva + items[i].unitPriceWI * items[i].itemQtd;
        }
        for(let i = 0; i <= items.length-1; i++){
            await prisma.invoicesDetails.create({
                data: {
                    descriptionItem: items[i].description,
                    detailId: uuidv4(),
                    ivaItem: items[i].ivaType,
                    priceItemIva: items[i].unitPriceWI,
                    qtdItem: items[i].itemQtd,
                    invoiceAssociated: {
                        connectOrCreate: {
                            where: {
                                id: invoiceId
                            },
                            create: {
                                softwareCode: 'Tsq6',
                                atCode: '0-324634',
                                date: new Date(),
                                documentTotal: Math.round(totalDocIva * 100) / 100,
                                documentTotalIva: Math.round(totalIva * 100) / 100,
                                vencimento: new Date(),
                                mbReference: '654731567',
                                payMethod: 0,
                                type: 0,
                                id: invoiceId,
                                clientAssociated: {
                                    connect: {
                                        clientId
                                    }
                                }
                            }
                        }
                    }
                }
            });
        }
        res.status(200).json({
            "status": "ok",
            "message": "Documento gravado com sucesso!"
        });
    }
};