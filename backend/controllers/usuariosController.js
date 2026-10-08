const db = require("../db");

exports.sincronizar = (req, res) => {
  const nome = String(req.body?.nome || req.usuario?.name || "Usuário").trim();
  const email = String(req.body?.email || req.usuario?.email || "").trim().toLowerCase();
  const turma = String(req.body?.turma || "").trim() || null;
  const firebaseUid = req.usuario?.uid;

  if (!email || !firebaseUid) {
    return res.status(400).json({ erro: "Dados do usuário incompletos." });
  }

  const sql = `
    INSERT INTO usuarios (nome, email, senha, turma, firebase_uid, tipo_usuario)
    VALUES (?, ?, NULL, ?, ?, 'usuario')
    ON DUPLICATE KEY UPDATE
      nome = VALUES(nome),
      email = VALUES(email),
      turma = VALUES(turma),
      firebase_uid = VALUES(firebase_uid)
  `;

  db.query(
    sql,
    [nome || "Usuário", email, turma, firebaseUid],
    (erro) => {
      if (erro) {
        console.error("Erro ao sincronizar usuário no MySQL:", erro.message);
        return res.status(500).json({ erro: erro.message });
      }

      db.query(
        "SELECT id_usuario, nome, email, turma, tipo_usuario, data_cadastro FROM usuarios WHERE firebase_uid = ? LIMIT 1",
        [firebaseUid],
        (erroBusca, resultado) => {
          if (erroBusca) {
            return res.status(500).json({ erro: erroBusca.message });
          }

          return res.json({ sucesso: true, usuario: resultado[0] });
        }
      );
    }
  );
};

exports.me = (req, res) => {
  res.json({
    sucesso: true,
    usuario: req.usuarioBanco,
  });
};
