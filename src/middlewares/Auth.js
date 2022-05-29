const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(200).json({ "status": "error", "message": "token-unexists" });
    }
    const parts = authHeader.split(' ');
    if(!parts.length === 2){
        return res.status(200).json({ "status": "error", "message": "token-error" });
    }
    const [ scheme, token ] = parts;
    if(scheme !== "Bearer"){
        return res.status(200).json({ "status": "error", "message": "token-bad-format" });
    }
    jwt.verify(token, "IMMTelecomAPP", async (err, decoded) => {
        if(err){
            return res.status(200).json({ "status": "error", "message": 'token-bad-sign'});
        }else{
            req.clientId = decoded.id;
            return next();
        }
    });
};