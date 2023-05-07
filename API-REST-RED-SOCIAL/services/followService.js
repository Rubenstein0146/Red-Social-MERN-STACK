const Follow = require("../models/follow")

// Método para obtener ids de los usuarios que sigo y me siguen
const followUserIds = async (identityUserId) => {
    try {
        // Sacar info seguimiento
        let following = await Follow.find({ "user": identityUserId })
            .select({ "followed": 1, "_id": 0 }) // Sólo devolver el usuario seguido por mi
            .exec()
        let followers = await Follow.find({ "followed": identityUserId })
            .select({ "user": 1, "_id": 0 }) // Sólo devolver el usuario seguido por mi
            .exec()

        // Procesar array de identificadores
        let followingClean = []

        following.forEach(follow => {
            followingClean.push(follow.followed)
        })

        let followersClean = []

        followers.forEach(follow => {
            followersClean.push(follow.user)
        })

        return {
            following: followingClean,
            followers: followersClean
        }
    } catch (error) {
        return false
    }
}

const followThisUser = async (identityUserId, profileUserId) => {
    // Buscar si identityUserId sigue a profileUserId (yo a él)
    let following = await Follow.findOne({ "user": identityUserId, "followed": profileUserId })
        // .select({ "followed": 1, "_id": 0 }) // Sólo devolver el usuario seguido por mi
        // .exec()

    // Buscar si profileUserId sigue a identityUserId (él a mi)
    let follower = await Follow.findOne({ "user": profileUserId, "followed": identityUserId })
        // .select({ "user": 1, "_id": 0 }) // Sólo devolver el usuario seguido por mi
        // .exec()

    return {
        following,
        follower
    }
        // Sacar info seguimiento
}

module.exports = {
    followUserIds,
    followThisUser
}