const express = require("express");
const router = express.Router();
const itemController = require("../controllers/itemController");
const multer = require("multer");
const upload = require("../middlewares/multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});


router.get("/search", itemController.searchItems);
router.get("/items", itemController.getAllItems);
router.get("/showPro", itemController.showPro);
router.post("/add", upload.fields([{
  name: "image", maxCount: 1
}]), itemController.addProduct);
router.delete("/deleteProduct/:id", itemController.deleteProduct);
router.get("/searchProduct", itemController.searchItems);
router.post("/add", itemController.addProduct);
router.get("/all-products", itemController.getAllProducts); // Add this route
router.put("/edit/:id", itemController.editProduct); // Add this route

module.exports = router;


