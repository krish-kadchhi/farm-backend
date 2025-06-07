const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

router.post("/addCart", cartController.addToCart);
router.get("/showCart", cartController.showCart);
router.post("/deleteCart", cartController.deleteFromCart);
router.get("/showItem", cartController.showItem);

module.exports = router;
