// Importar librerías
const bcrypt = require("bcrypt") // Librería para encriptar contraseñas
const mongoosePagination = require("mongoose-pagination") //Librería para paginar resultados de búsquedas con mongoose
const fs = require("fs") // Librería para manipular el file system  del servidor
const path = require("path") // Librería para obtejer un path absoluto o ruta física de nuestro servidor


// Importar modelos
const User = require("../models/user")
const Follow = require("../models/follow")
const Publication = require("../models/publication")

// Importar servicios
const jwt = require("../services/libjwt")
const followService = require("../services/followService")
const validate = require("../helpers/validate")


// Acciones de prueba
const pruebaUser = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/user.js",
        usuario: req.user
    })
}

// Regisstro de usuarios
const register = (req, res) => {
    // Recoger datos de la peticions
    let params = req.body

    // Comprobar que me llegan bien (+ validacion)
    if (!params.name || !params.email || !params.password || !params.nick) {
        return res.status(400).json({
            status: "error",
            message: "Faltan datos por enviar",
        })
    }

    // Validación avanzada
    try {
        validate(params);
    } catch (error) {
        return res.status(400).json({
            status: "error",
            message: "Valición no superada",
        });
    }


    // Control usuarios duplicados
    User.find({
        $or: [
            { email: params.email.toLowerCase() },
            { nick: params.nick.toLowerCase() }
        ]
    })
        .exec(async (error, users) => {

            if (error) return res.status(500).json({ status: "error", message: "Error en la consulta de usuarios" });

            // Comprobar si el usuario ya existe
            if (users && users.length >= 1) {
                return res.status(200).send({
                    status: "success",
                    message: "El usuario ya existe"
                })
            }

            // Cifrar la contraseña
            let pwd = await bcrypt.hash(params.password, 10)
            // Actualizar contraseña cifrada en los parámetros
            params.password = pwd;

            // Crear objeto de usuario
            let user_to_save = new User(params)

            // Guardar usuario en la bbdd
            user_to_save.save((error, userStored) => {
                if (error || !userStored) return res.status(500).send({ status: "error", "message": "Error al guardar el ususario" });

                if (userStored) {
                    // Devolver resultado
                    return res.status(200).json({
                        status: "success",
                        message: "Usuario registrado correctamente",
                        user: userStored
                    })
                }
            })
        })
}

const login = (req, res) => {
    // Recoger parametros body
    let params = req.body
    if (!params.email || !params.password) {
        return res.status(400).send({
            status: "error",
            message: "Faltan datos por enviar"
        })
    }
    // Buscar en la bbdd si existe
    User.findOne({ email: params.email })
        // No devolver el password dentro de la busqueda
        // .select({ "password": 0 })
        .exec((error, user) => {
            if (error || !user) return res.status(404).send({ status: "error", message: "No existe el usuario" })
            // Comparar la contraseña que llega por parámetro con la contraseña cifrada de la base de datos
            const pwd = bcrypt.compareSync(params.password, user.password)
            if (!pwd) {
                return res.status(400).send({ status: "error", message: "No te has identificado correctamente" })
            }
            // Conseguir el Token
            const token = jwt.createToken(user)

            // Devolver Datos del usuario
            return res.status(200).send({
                status: "success",
                message: "Te has identificado correctamente",
                user: {
                    id: user._id,
                    name: user.name,
                    nicK: user.nick
                },
                token
            })
        })
}

const profile = (req, res) => {
    // Recibir id usuario identificado
    const identity = req.user.id
    // id del usuario que estamos viendo (por url)
    const id = req.params.id
    // Consulta para sacar los datos del usuario
    User.findById(id)
        .select({ password: 0, role: 0 }) // No devolver ni el password ni el role
        .exec(async (error, userProfile) => { // followService es asíncrono, por lo tanto el callback de .exec también los será
            if (error || !userProfile) return res.status(404).send({ status: "error", message: "El usuario no existe o hay un error", error })
            // Info de seguimiento
            const followInfo = await followService.followThisUser(identity, id)

            return res.status(200).send({
                status: "success",
                user: userProfile,
                following: followInfo.following,
                follower: followInfo.follower
            })
        })
}

const list = (req, res) => {
    // Controlar en qué página estamos
    let page = 1
    if (req.params.page) {
        page = req.params.page
    }
    page = parseInt(page)

    // Consulta con mongoose paginate
    let itemsPerPage = 5
    // el método paginate nos permite paginar el resultado de la búsqueda
    User.find().select("-password -email -role -__v").sort('_id').paginate(page, itemsPerPage, async (error, users, total) => {
        if (error || !users) return res.status(404).send({ status: "error", message: "No hay usuarios", error })

        // Sacar un array de ids de los usuarios que me siguen y los que sigo como usario identificado
        let followUserIds = await followService.followUserIds(req.user.id)
        // Devolver el resultado (posteriormente info follow)
        return res.status(200).send({
            status: "success",
            users,
            page,
            itemsPerPage,
            total,
            pages: Math.ceil(total / itemsPerPage),
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        })
    })
}

const update = (req, res) => {
    // Recoger info del usuario a actualizar
    let userIdentity = req.user
    let userToUpdate = req.body

    // Eliminar campos sobrantes
    delete userToUpdate.iat
    delete userToUpdate.exp
    delete userToUpdate.role
    delete userToUpdate.image

    // Comprobar si el usuario ya existe
    User.find({
        $or: [
            { email: userToUpdate.email },
            { nick: userToUpdate.nick }
        ]
    }).exec(async (error, users) => {

        if (error) return res.status(500).json({ status: "error", message: "Error en la consulta de usuarios" })

        let userIsset = false
        users.forEach(user => {
            if (user && user._id != userIdentity.id) userIsset = true
        })

        if (userIsset) {
            return res.status(200).send({
                status: "success",
                message: "El usuario ya existe"
            })
        }

        // Cifrar la contraseña
        if (userToUpdate.password) {
            let pwd = await bcrypt.hash(userToUpdate.password, 10)
            userToUpdate.password = pwd

            //Añadido eliminar contraseña para no sobre-escribirla
        } else {
            delete userToUpdate.password
        }

        // Buscar y actualizar 
        try {
            let userUpdated = await User.findByIdAndUpdate({ _id: userIdentity.id }, userToUpdate, { new: true })

            if (!userUpdated) {
                return res.status(400).json({ status: "error", message: "Error al actualizar" })
            }

            // Devolver respuesta
            return res.status(200).send({
                status: "success",
                message: "Metodo de actualizar usuario",
                user: userUpdated
            })

        } catch (error) {
            return res.status(500).send({
                status: "error",
                message: "Error al actualizar",
            })
        }

    })
}

const upload = (req, res) => {
    // Recoger el fichero de imagen y comprobar que existe
    if (!req.file) {
        return res.status(404).send({ status: "error", message: "Petición no incluye la imagen" })
    }
    // Conseguir el nombre del archivo del form-data en Postman
    let image = req.file.originalname
    // Sacar la extensión del archivo, haciendo split con ".", nos va a devolver dos índices
    const imageSplit = image.split("\.")
    console.log(imageSplit)
    const extension = imageSplit[1]

    // Comprobar extension
    if (extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif") {

        // Borrar archivo subido
        const filePath = req.file.path
        console.log(filePath)
        const fileDeleted = fs.unlinkSync(filePath);

        // Devolver respuesta negativa
        return res.status(400).send({
            status: "error",
            message: "Extensión del fichero invalida"
        })
    }

    // Si si es correcta, guardar imagen en bbdd
    User.findOneAndUpdate({ _id: req.user.id }, { image: req.file.filename }, { new: true }, (error, userUpdated) => {
        if (error || !userUpdated) {
            return res.status(500).send({
                status: "error",
                message: "Error en la subida del avatar"
            })
        }
        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            user: userUpdated,
            file: req.file,
            image
        })
    })
}

const avatar = (req, res) => {
    // Sacar el parametro de la url
    const file = req.params.file

    // Montar el path real de la imagen
    const filePath = "./uploads/avatars/" + file

    // Comprobar que existe
    fs.stat(filePath, (error, exists) => {

        if (error || !exists) {
            return res.status(404).send({
                status: "error",
                message: "No existe la imagen"
            })
        }

        // Devolver un file. Es necesaria la librería path para enviar un path absoluto o ruta física.
        return res.sendFile(path.resolve(filePath))
    })
}

// añadido
const counters = async (req, res) => {

    let userId = req.user.id
    console.log(userId)

    if (req.params.id) {
        userId = req.params.id
    }

    try {
        const following = await Follow.count({ "user": userId });

        const followed = await Follow.count({ "followed": userId });

        const publications = await Publication.count({ "user": userId });

        return res.status(200).send({
            userId,
            following: following,
            followed: followed,
            publications: publications
        });
    } catch (error) {
        return res.status(500).send({
            status: "error",
            message: "Error en los contadores",
            error
        });
    }
}

// Exportar acciones
module.exports = {
    pruebaUser,
    register,
    login,
    profile,
    list,
    update,
    upload,
    avatar,
    counters
}