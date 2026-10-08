const admin = require("../firebase");
const db = require("../db");

function nomePadrao(decoded) {
  if (decoded.name) return decoded.name;
  if (decoded.email) return decoded.email.split("@")[0];
  return "Usuário";
}

function query(sql, valores = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, valores, (erro, resultado) => {
      if (erro) reject(erro);
      else resolve(resultado);
    });
  });
}

async function sincronizarUsuario(decoded) {
  const firebaseUid = decoded.uid;

  let usuarios = await query(
    "SELECT * FROM usuarios WHERE firebase_uid = ? LIMIT 1",
    [firebaseUid]
  );

  if (usuarios.length > 0) {
    return usuarios[0];
  }

  // Migra usuários antigos que já existiam no MySQL usando o e-mail.
  if (decoded.email) {
    usuarios = await query(
      "SELECT * FROM usuarios WHERE email = ? LIMIT 1",
      [decoded.email]
    );

    if (usuarios.length > 0) {
      await query(
        "UPDATE usuarios SET firebase_uid = ? WHERE id_usuario = ?",
        [firebaseUid, usuarios[0].id_usuario]
      );

      return {
        ...usuarios[0],
        firebase_uid: firebaseUid,
      };
    }
  }

  const email = decoded.email || `${firebaseUid}@firebase.local`;

  const resultado = await query(
    `
      INSERT INTO usuarios (
        nome,
        email,
        senha,
        turma,
        firebase_uid,
        tipo_usuario
      )
      VALUES (?, ?, NULL, NULL, ?, 'usuario')
    `,
    [nomePadrao(decoded), email, firebaseUid]
  );

  usuarios = await query(
    "SELECT * FROM usuarios WHERE id_usuario = ? LIMIT 1",
    [resultado.insertId]
  );

  return usuarios[0];
}

module.exports = async (req, res, next) => {
  try {
    if (!admin) {
      return res.status(503).json({
        erro:
          "Autenticação do servidor não configurada. " +
          "Configure o Firebase Admin nas variáveis de ambiente.",
      });
    }

    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.substring(7)
      : null;

    if (!token) {
      return res.status(401).json({ erro: "Token não enviado." });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const usuarioBanco = await sincronizarUsuario(decoded);

    req.usuario = decoded;
    req.usuarioBanco = usuarioBanco;

    next();
  } catch (erro) {
    console.error("Erro na autenticação/sincronização:", erro.message);

    if (erro?.code === "auth/id-token-expired" || erro?.code === "auth/argument-error") {
      return res.status(401).json({ erro: "Token inválido ou expirado." });
    }

    if (erro?.code?.startsWith?.("ER_")) {
      return res.status(500).json({
        erro: "Não foi possível sincronizar o usuário com o banco de dados.",
      });
    }

    return res.status(401).json({ erro: "Token inválido." });
  }
};
