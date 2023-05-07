const express = require("express") // Librería para usar express
const UserController = require("../controllers/user") // Controlador
const auth = require("../middlewares/authorization") // Middleware de autorización creado por nosotros
const multer = require("multer") // Librería para subir archivos a nuestro servidor
const router = express.Router() // Router de express

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/avatars")
    },
    filename: (req, file, cb) => {
        cb(null, "avatar-" + Date.now() + "-" + file.originalname)
    }
})
const uploads = multer({ storage })

// Rutas de pruebas
// Middleware se ejecuta antes que la acción del controlador (método auth dentro del const auth = require("../middlewares/auth"))
router.get("/prueba-user", auth.auth, UserController.pruebaUser)

// Ruta útil
router.post("/register", UserController.register)
router.post("/login", UserController.login)
router.get("/profile/:id", auth.auth, UserController.profile)
router.get("/list/:page?", auth.auth, UserController.list)
router.put("/update", auth.auth, UserController.update)
// Aplicar middleware para subir archivos con multer, definimos como "file0" al nombre del campo para la petición Postman
router.post("/upload", [auth.auth, uploads.single("file0")], UserController.upload)
router.get("/avatar/:file",UserController.avatar)
router.get("/counters/:id", auth.auth, UserController.counters)

module.exports = router