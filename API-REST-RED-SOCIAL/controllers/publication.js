// Importar modelo
const Publication = require("../models/publication")
const fs = require("fs") // Librería para manipular el file system  del servidor
const path = require("path") // Librería para obtejer un path absoluto o ruta física de nuestro servidor

// Importar servicios
const followService = require("../services/followService")

// Acciones de prueba
const pruebaPublication = (req, res) => {
    return res.status(200).send({
        message: "Mensaje enviado desde: controllers/publication.js"
    })
}

// Guardar publicación
const save = (req, res) => {
    // Recoger datos del body
    let params = req.body
    // Si no me llegan dar respuesta negativa
    if (!params.text) return res.status(400).send({ status: "error", mesage: "Debes enviar el texto de la publicacion" })
    // Crear y rellenar el objeto del modelo
    let newPublication = new Publication(params)
    // Adjuntar datos del usuario identificado
    newPublication.user = req.user.id
    // Guardar objeto en bbdd
    newPublication.save((error, publicationStored) => {
        if (error || !publicationStored) return res.status(404).send({ status: "error", mesage: "No se ha guardado la publicación" })
        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Publicación guardada",
            publicationStored
        })
    })


}

// Sacar una sola publicación
const detail = (req, res) => {
    // Sacar id de la publicación de la url
    const publicacionId = req.params.id
    // Buscar la publicación cuyo id sea el mismo que el ingresao por la url
    Publication.findById(publicacionId, (error, publicationStored) => {
        if (error || !publicationStored) return res.status(404).send({ status: "error", mesage: "No exite la publicación" })

        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Mostrar publicación",
            publicationStored
        })
    })

}
// Eliminar publicaciones

const remove = (req, res) => {
    // Sacar id de la publicación de la url
    const publicacionId = req.params.id
    // Eliminar la publicación sólo si es del usuario identificado, y su id sea el ingresado por la url
    Publication.findById({ "user": req.user.id, "_id": publicacionId }).remove((error, publicationRemoved) => {
        if (error || !publicationRemoved) return res.status(404).send({ status: "error", mesage: "No se ha eliminado la publicación" })
        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            message: "Publicación eliminada",
            publicacionId
        })
    })

}

// Listar publicaciones de un usuario en contreto
const user = (req, res) => {
    // Sacar el id de usuario
    let userId = req.params.id
    // Controlar la página
    let page = 1
    if (req.params.page) page = req.params.page
    const itemsPerPage = 5
    // Find, populate, ordernar, paginar
    Publication.find({ "user": userId })
        .sort("-created_at")
        .populate("user", "nick")
        .paginate(page, itemsPerPage, (error, publications, total) => {
            if (error || !publications || publications.length <= 0) return res.status(404).send({ status: "error", mesage: "No existen publicaciones" })
            // Devolver respuesta
            return res.status(200).send({
                status: "success",
                message: "Publicaciones del perfil de un usuario",
                publications,
                page,
                total,
                pages: Math.ceil(total / itemsPerPage)
            })
        })
}
// Listar publicaciones (feed)

// Subir ficheros
const upload = (req, res) => {
    // Sacar publication id
    const publicationId = req.params.id;

    // Recoger el fichero de imagen y comprobar que existe
    if (!req.file) {
        return res.status(404).send({
            status: "error",
            message: "Petición no incluye la imagen"
        });
    }

    // Conseguir el nombre del archivo
    let image = req.file.originalname;

    // Sacar la extension del archivo
    const imageSplit = image.split("\.");
    const extension = imageSplit[1];

    // Comprobar extension
    if (extension != "png" && extension != "jpg" && extension != "jpeg" && extension != "gif") {

        // Borrar archivo subido
        const filePath = req.file.path;
        const fileDeleted = fs.unlinkSync(filePath);

        // Devolver respuesta negativa
        return res.status(400).send({
            status: "error",
            message: "Extensión del fichero invalida"
        });
    }

    // Si si es correcta, guardar imagen en bbdd
    Publication.findOneAndUpdate({ "user": req.user.id, "_id": publicationId }, { file: req.file.filename }, { new: true }, (error, publicationUpdated) => {
        if (error || !publicationUpdated) {
            return res.status(500).send({
                status: "error",
                message: "Error en la subida del avatar"
            })
        }

        // Devolver respuesta
        return res.status(200).send({
            status: "success",
            publication: publicationUpdated,
            file: req.file,
        });
    });

}

// Devolver archivos multimedia imagenes
const media = (req, res) => {
    // Sacar el parametro de la url
    const file = req.params.file;

    // Montar el path real de la imagen
    const filePath = "./uploads/publications/" + file;
    console.log(filePath)

    // Comprobar que existe
    fs.stat(filePath, (error, exists) => {

        if (!exists) {
            return res.status(404).send({
                status: "error",
                message: "No existe la imagen"
            });
        }

        // Devolver un file
        return res.sendFile(path.resolve(filePath))
    })
}

// Listar todas las publicaciones (FEED)
const feed = async (req, res) => {
    // Sacar la pagina actual
    let page = 1;

    if (req.params.page) {
        page = req.params.page;
    }

    // Establecer numero de elementos por pagina
    let itemsPerPage = 3

    // Sacar un array de identificadores de usuarios que yo sigo como usuario logueado
    try {
        const myFollows = await followService.followUserIds(req.user.id)

        // Find a publicaciones , ordenar, popular, paginar
        const publications = Publication.find({ user: myFollows.following })// Que user contenga cualquiera de mis following)
            .populate("user", "-password -role -__v -email")
            .sort("-created_at")
            .paginate(page, itemsPerPage, (error, publications, total) => {

                if (error || !publications) {
                    return res.status(500).send({
                        status: "error",
                        message: "No hay publicaciones para mostrar",
                    })
                }

                return res.status(200).send({
                    status: "success",
                    message: "Feed de publicaciones",
                    following: myFollows.following,
                    total,
                    page,
                    pages: Math.ceil(total / itemsPerPage),
                    publications
                })
            })

    } catch (error) {

        return res.status(500).send({
            status: "error",
            message: "Error al obtener usuarios que sigues",
        })
    }

}

// Exportar acciones
module.exports = {
    pruebaPublication,
    save,
    detail,
    remove,
    user,
    upload,
    media,
    feed
}