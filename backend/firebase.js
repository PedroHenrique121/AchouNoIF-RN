const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

let appFirebase = null;

function obterServiceAccount() {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (jsonEnv) {
    try {
      const conta = JSON.parse(jsonEnv);
      if (conta.private_key) {
        conta.private_key = conta.private_key.replace(/\\n/g, "\n");
      }
      return conta;
    } catch (erro) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_JSON inválido: ${erro.message}`
      );
    }
  }

  const projeto = process.env.FIREBASE_PROJECT_ID;
  const email = process.env.FIREBASE_CLIENT_EMAIL;
  const chave = process.env.FIREBASE_PRIVATE_KEY;

  if (projeto && email && chave) {
    return {
      project_id: projeto,
      client_email: email,
      private_key: chave.replace(/\\n/g, "\n"),
    };
  }

  const caminhoChave = path.join(__dirname, "serviceAccountKey.json");

  if (fs.existsSync(caminhoChave)) {
    return require(caminhoChave);
  }

  return null;
}

try {
  const serviceAccount = obterServiceAccount();

  if (serviceAccount && !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  if (admin.apps.length) {
    appFirebase = admin;
  } else {
    console.warn(
      "AVISO: Firebase Admin não configurado. " +
      "Defina FIREBASE_SERVICE_ACCOUNT_JSON ou as variáveis " +
      "FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY."
    );
  }
} catch (erro) {
  console.error("Erro ao configurar Firebase Admin:", erro.message);
}

module.exports = appFirebase;
