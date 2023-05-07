const { connection } = require("./database/connection")
const express = require("express")
const cors = require("cors")

// Ruta estática para cargar el front-end en el build de producción
var path = require("path")

// Mensaje Bienvenida
console.log("API Node para Red Social de node arrancada")

// Conectar a la base de datos
connection()

// Crear servidor Node
const app = express()
const puerto = 3900

// Configurar cors {} acceso a todo el mundo
app.use(cors({}))

// MIDDLEWARES 
// Convertir body a objeto js
app.use(express.json()) // recibir datos con content-type app/json
app.use(express.urlencoded({ extended: true })) // form-urlencoded
app.set('view engine', 'pug')

// Definir RUTAS
const userRoutes = require("./routes/user")
const publicationRoutes = require("./routes/publication")
const followRoutes = require("./routes/follow")

// Cargo las rutas
// app.use se usa para ejecutar algo dentro de express
// * CORREGIR RUTAS EN PRODUCCIÓN * //
// app.use(express.static(path.join(__dirname, "client"))) // 	PASO 1. Ruta estática para cargar el front-end en el build de producción
app.use("/", express.static("client", { redirect: false })) // 	PASO 2. Corregir problema de rutas al recargar página en producción
app.use("/api/user", userRoutes)
app.use("/api/publication", publicationRoutes)
app.use("/api/follow", followRoutes)

// PASO 3. Devolver el fichero ./client/index.html para cualquier otra ruta
app.get("*", function (req, res, next) {
    return res.sendFile(path.resolve("client/index.html")) //
})

// Rutas prueba hardcodeadas
app.get("/prueba", (req, res) => {

    console.log("Se ha ejecutado el endpoint probando")

    return res.status(200).json([{
        curso: "Master en React"
    }
    ])

})

// Crear servidor y escuchar peticiones http
app.listen(puerto, () => {
    console.log("Servidor corriendo en el puerto http://localhost:" + puerto)
})

