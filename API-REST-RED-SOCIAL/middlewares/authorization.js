// IMPORTAR MÓDULOS
const jwt = require("jwt-simple")
const moment = require("moment")

// IMPORTAR CLAVE SECRETA
const libjwt = require("../services/libjwt")
const secret = libjwt.secret

// MIDDLEWARE DE AUTENTICACIÓN. next es un método que nos permite saltar al siguiente método o acción en la cuál
// está aplicado éste middlewate
const auth = (req, res, next) => {
    // Comprobar si me llega la cabecera de auth
    if (!req.headers.authorization) {
        return res.status(403).send({ status: "error", message: "La petición no tiene la cabecera de autenticación" })
    }

    // Removemos las comillas simples y dobles, y se reemplazan por vacío ''
    let token = req.headers.authorization.replace(/['"]+/g, '')

    // DECODIFICAR EL TOKEN
    try {
        let payload = jwt.decode(token, secret)
        console.log({ payload: payload })
        // Comprobar expiración del token es más antigua a la fecha actual
        if (payload.exp <= moment().unix()) {
            return res.status(401).send({ status: "error", message: "Token expirado" })
        }
        // AGREGAR DATOS DEL USUARIO A LA REQUEST
        req.user = payload
    } catch (error) {
        return res.status(404).send({ status: "error", message: "Token inválido", error })
    }

    //PASAR A LA EJECUCIÓN DE LA ACCIÓN (RUTA)
    next()
}

module.exports = {
    auth
}

