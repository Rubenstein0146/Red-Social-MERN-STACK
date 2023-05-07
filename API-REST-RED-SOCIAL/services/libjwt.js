// Importar dependencias
const jwt = require("jwt-simple")
const moment = require("moment")

// Clave secreta
const secret = "clave_secreta_del_proyecto_de_la_red_social010203"

// Crear una función para generar tokens
const createToken = (user) => {
    const payload = {
        id: user._id,
        name: user.name,
        surname: user.surname,
        nick: user.nick,
        email: user.email,
        role: user.role,
        imagen: user.image,
        // Momento en el que creamos el payload en formato unix
        iat: moment().unix(),
        // Fecha de expiración del token en formato unix
        exp: moment().add(30, "days").unix()
    }
    // Devolver jwt token codificado
    return jwt.encode(payload, secret)
}

module.exports = {
    secret,
    createToken
}