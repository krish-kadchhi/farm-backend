const Razorpay = require("razorpay");
const Payment = require("../models/payment");
const User = require("../models/user");
const Item = require("../models/item");
const Order = require("../models/order");
const dotenv = require("dotenv");

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

const paymentController = {
  checkout: async (req, res) => {
    try {
      const { amount, cartItems, quantity, userId } = req.body;

      if (!userId) {
        return res
          .status(400)
          .json({ success: false, message: "User ID is required" });
      }

      // Fetch all valid items from DB
      const validItems = await Item.find({}, "name stock");
      const validItemNames = new Set(validItems.map((item) => item.name));

      const validCartItems = cartItems.filter((cartItem) =>
        validItemNames.has(cartItem.item)
      );

      if (validCartItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid items in cart",
        });
      }

      for (let item of validCartItems) {
        const product = await Item.findOne({ name: item.item });
        if (product) {
          product.stock -= item.quantity;
          if (product.stock <= 0) await Item.deleteOne({ name: product.name });
          else await product.save();
        }
      }

      const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };
      const order = await razorpay.orders.create(options);

      res.json({
        success: true,
        orderId: order.id,
        amount,
        // cartItems: validCartItems,
      });
    } catch (error) {
      console.error("Checkout error:", error);
      res
        .status(500)
        .json({ success: false, message: "Error during checkout" });
    }
  },

  verify: async (req, res) => {
    try {
    const {
      orderId,
      paymentId,
      signature,
      amount,
      quantity,
      cartItems,
      userId,
    } = req.body;

      // Create payment record
      const orderConfirm = new Payment({
        orderId,
        paymentId,
        signature,
        amount,
        quantity,
        cartItems,
        userId,
        payStatus: "paid",
      });
      await orderConfirm.save();

      // Get user details for shipping address
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Create order record
      const newOrder = new Order({
        userId,
        items: cartItems,
        totalAmount: amount,
        paymentId,
        orderId,
        shippingAddress: user.address,
      });
      await newOrder.save();

      // Clear user's cart after successful order
      await User.findByIdAndUpdate(userId, { $set: { cart: [] } });

      res.json({ 
        message: "Payment and order created successfully!", 
        success: true, 
        orderConfirm,
        order: newOrder 
      });
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).send("Error verifying payment");
    }
  },
};

module.exports = paymentController;
