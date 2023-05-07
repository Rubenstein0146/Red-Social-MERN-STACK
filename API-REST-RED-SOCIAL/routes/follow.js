const express = require("express")
const FollowController = require("../controllers/follow")
const auth = require("../middlewares/authorization")

const router = express.Router()

// Rutas de pruebas
router.get("/prueba-follow", FollowController.pruebaFollow)

// Ruta útil
router.post("/save", auth.auth, FollowController.save)
router.delete("/unfollow/:id", auth.auth, FollowController.unfollow)
router.get("/following/:id?/:page?", auth.auth, FollowController.following)
router.get("/followers/:id?/:page?", auth.auth, FollowController.followers)

module.exports = router