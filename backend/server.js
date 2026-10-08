require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const pastaUploads = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, "uploads");

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(pastaUploads));

const itensRoutes = require("./routes/itens");
const categoriasRoutes = require("./routes/categorias");
const usuariosRoutes = require("./routes/usuarios");

app.get("/health", (_req, res) => {
  res.json({ ok: true, mensagem: "AchouNoIF API funcionando." });
});

app.use("/itens", itensRoutes);
app.use("/categorias", categoriasRoutes);
app.use("/usuarios", usuariosRoutes);

app.use((erro, _req, res, _next) => {
  console.error(erro);

  if (erro.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      erro: "A imagem deve ter no máximo 5 MB.",
    });
  }

  return res.status(400).json({
    erro: erro.message || "Erro ao processar a requisição.",
  });
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
