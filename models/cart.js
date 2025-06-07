const { type } = require("express/lib/response");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema({
  item: {
    type: String,
    required: true,
  },
  category: String,
  price: Number,
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
