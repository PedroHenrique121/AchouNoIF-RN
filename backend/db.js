require("dotenv").config();

const mysql = require("mysql2");

const opcoes = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

if (process.env.DB_SSL === "true") {
  opcoes.ssl = { rejectUnauthorized: false };
}

const conexao = mysql.createConnection(opcoes);

conexao.connect((erro) => {
  if (erro) {
    console.error("Erro ao conectar ao MySQL:", erro.message);
    return;
  }

  console.log("MySQL conectado com sucesso.");
});

module.exports = conexao;