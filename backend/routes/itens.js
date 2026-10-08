const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const staff = require("../middleware/staff");
const upload = require("../config/multer");
const controller = require("../controllers/itensController");

router.get("/", controller.listar);
router.get("/:id", controller.buscarPorId);

router.post("/", auth, upload.single("foto"), controller.cadastrar);
router.put("/:id", auth, staff, upload.single("foto"), controller.atualizar);
router.delete("/:id", auth, staff, controller.excluir);

module.exports = router;
