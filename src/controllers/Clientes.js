const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");

function generatePassword() {
    let length = 8, charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

module.exports = {
    async tempPassword(req, res){
        const { nif } = req.body;
        const findClient = await prisma.Clientes.findMany({
            where: {
                nif: parseInt(nif)
            }
        });
        if(findClient.length === 0){
            res.status(200).json({
                status: "error",
                message: "Cliente não encontrado!"
            });
        }else{
            const tempPass = generatePassword();
            bcrypt.genSalt(12, function(err, salt) {
                bcrypt.hash(tempPass, salt, async function(err, hash) {
                    await prisma.Clientes.update({
                        where: {
                            clientId: findClient[0].clientId
                        },
                        data: {
                            password: hash
                        }
                    });
                });
            });
            await axios.get('http://192.168.1.42:8090/SendSMS?username=tomas&password=tomas&phone=00351' + findClient[0].telef + '&message=A sua password temporaria para aceder ao My IMM e ' + tempPass);
            res.status(200).json({
                status: "ok",
                message: "Password enviada para o seu telemóvel."
            });
        }
    },
    async login(req, res){
        const { user, password } = req.body;
        const mailSearch = await prisma.Clientes.findMany({
            where: {
                email: user
            }
        });
        const teleSearch = await prisma.Clientes.findMany({
            where: {
                telef: parseInt(user) || 0
            }
        });
        if(mailSearch.length === 0 && teleSearch.length === 0){
            res.status(200).json({
                status: "error",
                message: "Utilizador não encontrado, tente novamente."
            });
        }else{
            if(mailSearch.length !== 0){
                bcrypt.compare(password, mailSearch[0].password, function(err, result) {
                    if(result){
                        const token = jwt.sign({ id: mailSearch[0].clientId }, "IMMTelecomAPP", {
                            expiresIn: 3600*5
                        });
                        res.status(200).json({
                            status: "ok",
                            message: "Utilizador autenticado.",
                            token
                        });
                    }else{
                        res.status(200).json({
                            status: "error",
                            message: "Utilizador não encontrado, tente novamente."
                        });
                    }
                });
            }
            if(teleSearch.length !== 0){
                bcrypt.compare(password, teleSearch[0].password, function(err, result) {
                    if(result){
                        const token = jwt.sign({ id: teleSearch[0].clientId }, "IMMTelecomAPP", {
                            expiresIn: 3600*5
                        });
                        res.status(200).json({
                            status: "ok",
                            message: "Utilizador autenticado.",
                            token
                        });
                    }else{
                        res.status(200).json({
                            status: "error",
                            message: "Utilizador não encontrado, tente novamente."
                        });
                    }
                });
            }
        }
    },
    async checkAuth(req, res){
        res.status(200).json({
            status: "ok"
        });
    }
};