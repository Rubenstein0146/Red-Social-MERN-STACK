const express = require("express")// Librería para usar express
const PublicationController = require("../controllers/publication") // Controlador
const auth = require("../middlewares/authorization") // Middleware de autorización creado por nosotros
const multer = require("multer") // Librería para subir archivos a nuestro servidor
const router = express.Router() // Router de express

// Configuracion de subida
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/publications/")
    },
    filename: (req, file, cb) => {
        cb(null, "pub-" + Date.now() + "-" + file.originalname);
    }
});

const uploads = multer({ storage });

// Rutas de pruebas
router.get("/prueba-publication", PublicationController.pruebaPublication)

// Ruta útil
router.post("/save", auth.auth, PublicationController.save)
router.get("/detail/:id", auth.auth, PublicationController.detail)
router.delete("/remove/:id", auth.auth, PublicationController.remove)
router.get("/user/:id/:page?", auth.auth, PublicationController.user)
// Cargar middleware de subidas con multer
router.put("/upload/:id/", [auth.auth, uploads.single("file0")], PublicationController.upload)
router.get("/media/:file/", PublicationController.media)
router.get("/feed/:page", auth.auth, PublicationController.feed)

module.exports = router