const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  user_id:{
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  address:{
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
},
resetPasswordToken: {
  type: String,
},
resetPasswordExpires: {
  type: Date,
},
  cart: [
    {
      type: Object,
    },
  ],
});

const User = mongoose.model("User", userSchema);
module.exports = User;
