const { Schema, model } = require("mongoose");

const FollowSchema = Schema({
    user: {
        type: Schema.ObjectId, // Objeto externo
        ref: "User" // Referencia al objeto externo "User"
    },
    followed: {
        type: Schema.ObjectId, // Objeto externo
        ref: "User" // Referencia al objeto externo "User"
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = model("Follow", FollowSchema, "follows");