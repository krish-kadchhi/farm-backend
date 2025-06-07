const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
    orderDate: {
        type: Date,
        default: Date.now,
    },
    payStatus: {
        type: String,
        default: "Pending",
    }
    

},{strict: false});

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;