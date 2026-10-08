const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const controller = require("../controllers/usuariosController");

router.post("/", auth, controller.sincronizar);
router.get("/me", auth, controller.me);

module.exports = router;
