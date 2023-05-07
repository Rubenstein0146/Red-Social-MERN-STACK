// Conexion a la base de datos
const mongoose = require("mongoose");

const connection = async () => {
    const webURI = "mongodb+srv://rubenstein0146:Laharl0203@cluster0.vqrt9hh.mongodb.net/?retryWrites=true&w=majority"
    const localURI = 'mongodb://127.0.0.1:27017/mi_red_social'

    try {

        await mongoose.connect(localURI)
        // Parametros dentro de objeto // solo en caso de aviso
        // useNewUrlParser: true
        // useUnifiedTopology: true
        // useCreateIndex: true
        console.log("Conectado correctamente a la base de datos mi_red_social !!")

    } catch (error) {
        console.log(error);
        throw new Error("No se ha podido conectar a la base de datos !!")
    }

}

module.exports = {
    connection
}