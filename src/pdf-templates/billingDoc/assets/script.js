import { api } from '../../api.js';
const parametros = new URLSearchParams(window.location.search);
const tempAccessToken = parametros.get('tempAccessToken');
api('/billDocInfo', "POST", {
    tempAccessToken
}).then((res) => {
    const factTipo = res.documentIssued.type === 0 ? 'FT ' + res.documentIssued.serieAssociated.serieNumber + "/" + res.documentIssued.docNumber : res.documentIssued.type === 1 ? "NC " + res.documentIssued.serieAssociated.serieNumber + "/" + res.documentIssued.docNumber : res.documentIssued.type === 2 ? 'REC ' + res.documentIssued.serieAssociated.serieNumber + "/" + res.documentIssued.docNumber : 'FS ' + res.documentIssued.serieAssociated.serieNumber + "/" + res.documentIssued.docNumber;
    const saftTipo = res.documentIssued.type === 0 ? 'FT' : res.documentIssued.type === 1 ? "NC" : res.documentIssued.type === 2 ? 'FR' : 'FS';
    document.title = factTipo;
    document.getElementById("clientName").innerText = res.documentIssued.clientAssociated.nome.toUpperCase();
    document.getElementById("addressLine").innerText = res.documentIssued.clientAssociated.muradaBill;
    document.getElementById("adrressId").innerText = res.documentIssued.clientAssociated.codPost;
    document.getElementById("localityLine").innerText = res.documentIssued.clientAssociated.localidadeBill;
    document.getElementById("nif").innerText = res.documentIssued.clientAssociated.nif;
    document.getElementById("softCode").innerText = res.documentIssued.softwareCode;
    document.getElementById("issuedBy").innerText = res.documentIssued.createdBy;
    document.getElementById("mbTotal").innerText = parseFloat(res.documentIssued.documentTotal).toFixed(2).toString().replace(".", ",") + " €";
    document.getElementById("issuedData").innerText = parseInt(new Date(res.documentIssued.date).getDate()).toString().padStart(2, "0") + "/" + parseInt(new Date(res.documentIssued.date).getMonth()+1).toString().padStart(2, "0") + "/" + new Date(res.documentIssued.date).getFullYear();
    document.getElementById("vencData").innerText = parseInt(new Date(res.documentIssued.vencimento).getDate()).toString().padStart(2, "0") + "/" + parseInt(new Date(res.documentIssued.vencimento).getMonth()+1).toString().padStart(2, "0") + "/" + new Date(res.documentIssued.vencimento).getFullYear();
    document.getElementById("docType").innerText = res.documentIssued.type === 0 ? 'Fatura' : res.documentIssued.type === 1 ? "Nota de credito" : res.documentIssued.type === 2 ? 'Recibo' : 'Fatura simplificada';
    document.getElementById("docNumber").innerText = factTipo;
    document.getElementById("atCode").innerText = res.documentIssued.atCode;
    document.getElementById("payMethod").innerText = res.documentIssued.payMethod === 0 ? 'Saldo' : res.documentIssued.payMethod === 1 ? 'MbWay' : res.documentIssued.payMethod === 2 ? 'Multibanco' : res.documentIssued.payMethod === 3 ? 'Transferência bancária' : res.documentIssued.payMethod === 4 ? 'Cartão debito/credito' : 'Conta Corrente';
    document.getElementById("detailsDoc").innerText = res.documentIssued.docDescription;
    document.getElementById("codCliente").innerText = res.documentIssued.clientAssociated.clientNumber;
    document.getElementById("payType").innerText = res.documentIssued.typePeriodPay === 0 ? 'Pronto pagamento' : res.documentIssued.typePeriodPay === 1 ? 'Pagamento a 30 Dias' : 'Pagamento a 7 Dias'
    let qtdIvas = 0;
    if(res.documentIssued.documentTotalIvaVT){
        qtdIvas = qtdIvas + 1;
    }
    if(res.documentIssued.documentTotalIvaTR){
        qtdIvas = qtdIvas + 1;
    }
    if(res.documentIssued.documentTotalIvaSS){
        qtdIvas = qtdIvas + 1;
    }
    let ivaTable = '<tr><td colspan="' + qtdIvas + '"><p>Taxas de IVA</p></td></tr><tr>';
    if(res.documentIssued.documentTotalIvaVT){
        ivaTable = ivaTable + "<td><p>23%</p></td>";
    }        
    if(res.documentIssued.documentTotalIvaTR){
        ivaTable = ivaTable + "<td><p>13%</p></td>";
    }  
    if(res.documentIssued.documentTotalIvaSS){
        ivaTable = ivaTable + "<td><p>6%</p></td>";
    }
    ivaTable = ivaTable + "</tr><tr>";
    if(res.documentIssued.documentTotalIvaVT){
        ivaTable = ivaTable + "<td><p>" + res.documentIssued.documentTotalIvaVT.toString().replace(".", ",") + " €</p></td>";
    }
    if(res.documentIssued.documentTotalIvaTR){
        ivaTable = ivaTable + "<td><p>" + res.documentIssued.documentTotalIvaTR.toString().replace(".", ",") + " €</p></td>";
    }
    if(res.documentIssued.documentTotalIvaSS){
        ivaTable = ivaTable + "<td><p>" + res.documentIssued.documentTotalIvaSS.toString().replace(".", ",") + " €</p></td>";
    }   
    ivaTable = ivaTable + "</tr>";
    document.getElementById("ivaDetails").innerHTML = ivaTable;
    if(res.documentIssued.observations === null){
        document.getElementById("showObs").style.display = "none";
    }else{
        document.getElementById("observations").innerText = res.documentIssued.observations;
    }
    let listProds = "<tr><td><p>Qtd</p></td><td><p>Descrição</p></td><td><p>IVA</p></td><td><p>Valor unitário (s/IVA)</p></td><td><p>Total do IVA</p></td><td><p>Preço Total (c/IVA)</p></td></tr>";
    for(let i = 0; i <= res.documentIssued.details.length-1; i++){
        let ivaValue = 0;
        let precUnitSI = 0;
        if(res.documentIssued.details[i].ivaItem === 0){
            ivaValue = (res.documentIssued.details[i].priceItemIva-(res.documentIssued.details[i].priceItemIva/1.06)) * res.documentIssued.details[i].qtdItem;
            ivaValue = Math.round(ivaValue*100) / 100;
            precUnitSI = res.documentIssued.details[i].priceItemIva/1.06;
            precUnitSI = Math.round(precUnitSI*100) / 100;
        }else if(res.documentIssued.details[i].ivaItem === 1){
            ivaValue = (res.documentIssued.details[i].priceItemIva-(res.documentIssued.details[i].priceItemIva/1.13)) * res.documentIssued.details[i].qtdItem;
            ivaValue = Math.round(ivaValue*100) / 100;
            precUnitSI = res.documentIssued.details[i].priceItemIva/1.13;
            precUnitSI = Math.round(precUnitSI*100) / 100;
        }else{
            ivaValue = (res.documentIssued.details[i].priceItemIva-(res.documentIssued.details[i].priceItemIva/1.23)) * res.documentIssued.details[i].qtdItem;
            ivaValue = Math.round(ivaValue*100) / 100;
            precUnitSI = res.documentIssued.details[i].priceItemIva/1.23;
            precUnitSI = Math.round(precUnitSI*100) / 100;
        }
        const lineIva = res.documentIssued.details[i].ivaItem === 0 ? '6%' : res.documentIssued.details[i].ivaItem === 1 ? '13%' : '23%';
        listProds = listProds + "<tr><td><p>" + res.documentIssued.details[i].qtdItem + "</p></td><td><p>" + res.documentIssued.details[i].descriptionItem + "</p></td><td><p>" + lineIva + "</p></td><td><p>" + precUnitSI.toString().replace(".", ",") + " €</p></td><td><p>" + ivaValue.toString().replace(".", ",") + " €</p></td><td><p>" + (res.documentIssued.details[i].priceItemIva * res.documentIssued.details[i].qtdItem).toString().replace(".", ",") + " €</p></td></tr>";
    }
    const totalIva = res.documentIssued.documentTotalIvaVT + res.documentIssued.documentTotalIvaSS + res.documentIssued.documentTotalIvaTR;
    listProds = listProds + '<tr><td colspan="4"><p class="isBold">Total do documento:</p></td><td><p>' + parseFloat(totalIva).toFixed(2).toString().replace(".", ",") + ' €</p></td><td><p class="isBold">' + parseFloat(res.documentIssued.documentTotal).toFixed(2).toString().replace(".", ",") + ' €</p></td></tr>';
    document.getElementById("listProds").innerHTML = listProds;
    if(res.documentIssued.mbReference === null){
        document.getElementById("mbBox").style.display = "none";
    }else{
        document.getElementById("refMb").innerText = res.documentIssued.mbReference;
    }
    const qrcode = new QRCode(document.getElementById("atQrCode"), {
        width: 130,
        height: 130
    });
    qrcode.makeCode('A:514038942*B:' + res.documentIssued.clientAssociated.nif + '*C:PT*D:' + saftTipo + '*E:N*F:' + new Date(res.documentIssued.date).getFullYear() + parseInt(new Date(res.documentIssued.date).getMonth()+1).toString().padStart(2, "0") + parseInt(new Date(res.documentIssued.date).getDate()).toString().padStart(2, "0") + '*G:' + factTipo + '*H:' + res.documentIssued.atCode + '*I1:PT*I7:' + parseInt(res.documentIssued.documentTotal - totalIva) + '*I8:' + parseFloat(totalIva).toFixed(2) + '*N:' + parseFloat(totalIva).toFixed(2) + '*O:' + parseFloat(res.documentIssued.documentTotal).toFixed(2) + '*Q:' + res.documentIssued.softwareCode + '*R:0479');
});