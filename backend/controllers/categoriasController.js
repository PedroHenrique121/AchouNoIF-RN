const db = require("../db");

exports.listar = (_req, res) => {
  db.query(
    "SELECT * FROM categorias ORDER BY nome_categoria",
    (erro, resultado) => {
      if (erro) {
        return res.status(500).json({ erro: erro.message });
      }

      res.json(resultado);
    }
  );
};
