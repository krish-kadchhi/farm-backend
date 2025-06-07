const { type } = require("express/lib/response");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const otpSchema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: Number,
    },
},
{
    expireAfterSeconds: 600,
}
)

module.exports = mongoose.model("Otp", otpSchema);