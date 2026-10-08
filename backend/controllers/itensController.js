const db = require("../db");
const fs = require("fs");
const path = require("path");

const pastaUploads = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, "..", "uploads");

function removerArquivoAntigo(nomeArquivo) {
  if (!nomeArquivo) return;

  const caminho = path.join(pastaUploads, path.basename(nomeArquivo));

  fs.unlink(caminho, () => {
    // Se o arquivo já não existir, não há nada a fazer.
  });
}

exports.listar = (_req, res) => {
  const sql = `
    SELECT
      o.id_objeto,
      o.codigo_rastreio,
      o.nome_objeto,
      o.descricao,
      o.data_encontro,
      o.local_encontro,
      o.foto_principal,
      o.estado_objeto,
      o.status_objeto,
      o.id_categoria,
      o.id_usuario_cadastro,
      c.nome_categoria,
      c.icone,
      o.data_registro
    FROM objetos_perdidos o
    LEFT JOIN categorias c ON c.id_categoria = o.id_categoria
    ORDER BY o.data_registro DESC
  `;

  db.query(sql, (erro, resultado) => {
    if (erro) {
      return res.status(500).json({ erro: erro.message });
    }

    res.json(resultado);
  });
};

exports.buscarPorId = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM objetos_perdidos WHERE id_objeto = ?",
    [id],
    (erro, resultado) => {
      if (erro) {
        return res.status(500).json({ erro: erro.message });
      }

      if (resultado.length === 0) {
        return res.status(404).json({ erro: "Item não encontrado." });
      }

      res.json(resultado[0]);
    }
  );
};

exports.cadastrar = (req, res) => {
  const {
    nome_objeto,
    descricao,
    data_encontro,
    local_encontro,
    estado_objeto,
    status_objeto,
    id_categoria,
  } = req.body;

  if (
    !nome_objeto ||
    !data_encontro ||
    !local_encontro ||
    !estado_objeto ||
    !id_categoria
  ) {
    if (req.file) removerArquivoAntigo(req.file.filename);

    return res.status(400).json({
      erro:
        "Campos obrigatórios faltando: nome_objeto, data_encontro, " +
        "local_encontro, estado_objeto e id_categoria.",
    });
  }

  const usuarioId = req.usuarioBanco?.id_usuario || null;
  const foto = req.file ? req.file.filename : null;
  const codigo = `OBJ-${Date.now()}`;

  const sql = `
    INSERT INTO objetos_perdidos (
      codigo_rastreio,
      nome_objeto,
      descricao,
      data_encontro,
      local_encontro,
      foto_principal,
      estado_objeto,
      status_objeto,
      id_categoria,
      id_usuario_cadastro
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      codigo,
      nome_objeto,
      descricao || null,
      data_encontro,
      local_encontro,
      foto,
      estado_objeto,
      status_objeto || "perdido",
      id_categoria || null,
      usuarioId,
    ],
    (erro, resultado) => {
      if (erro) {
        if (foto) removerArquivoAntigo(foto);
        return res.status(500).json({ erro: erro.message });
      }

      res.status(201).json({
        sucesso: true,
        id_objeto: resultado.insertId,
        codigo_rastreio: codigo,
        foto_principal: foto,
      });
    }
  );
};

exports.atualizar = (req, res) => {
  const { id } = req.params;

  const {
    nome_objeto,
    descricao,
    data_encontro,
    local_encontro,
    estado_objeto,
    status_objeto,
    id_categoria,
  } = req.body;

  const novaFoto = req.file ? req.file.filename : undefined;

  const campos = [];
  const valores = [];

  const possiveis = {
    nome_objeto,
    descricao,
    data_encontro,
    local_encontro,
    estado_objeto,
    status_objeto,
    id_categoria,
    foto_principal: novaFoto,
  };

  for (const chave in possiveis) {
    if (possiveis[chave] !== undefined) {
      campos.push(`${chave} = ?`);
      valores.push(possiveis[chave]);
    }
  }

  if (campos.length === 0) {
    if (novaFoto) removerArquivoAntigo(novaFoto);
    return res.status(400).json({ erro: "Nenhum campo para atualizar." });
  }

  valores.push(id);

  const sql = `
    UPDATE objetos_perdidos
    SET ${campos.join(", ")}
    WHERE id_objeto = ?
  `;

  const concluir = (fotoAntiga) => {
    db.query(sql, valores, (erro, resultado) => {
      if (erro) {
        if (novaFoto) removerArquivoAntigo(novaFoto);
        return res.status(500).json({ erro: erro.message });
      }

      if (resultado.affectedRows === 0) {
        if (novaFoto) removerArquivoAntigo(novaFoto);
        return res.status(404).json({ erro: "Item não encontrado." });
      }

      if (novaFoto && fotoAntiga && fotoAntiga !== novaFoto) {
        removerArquivoAntigo(fotoAntiga);
      }

      res.json({ sucesso: true });
    });
  };

  if (!novaFoto) {
    return concluir(null);
  }

  db.query(
    "SELECT foto_principal FROM objetos_perdidos WHERE id_objeto = ?",
    [id],
    (erro, resultado) => {
      if (erro) {
        removerArquivoAntigo(novaFoto);
        return res.status(500).json({ erro: erro.message });
      }

      if (resultado.length === 0) {
        removerArquivoAntigo(novaFoto);
        return res.status(404).json({ erro: "Item não encontrado." });
      }

      concluir(resultado[0].foto_principal);
    }
  );
};

exports.excluir = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT foto_principal FROM objetos_perdidos WHERE id_objeto = ?",
    [id],
    (erroBusca, resultadoBusca) => {
      if (erroBusca) {
        return res.status(500).json({ erro: erroBusca.message });
      }

      if (resultadoBusca.length === 0) {
        return res.status(404).json({ erro: "Item não encontrado." });
      }

      const foto = resultadoBusca[0].foto_principal;

      db.query(
        "DELETE FROM objetos_perdidos WHERE id_objeto = ?",
        [id],
        (erro, resultado) => {
          if (erro) {
            return res.status(500).json({ erro: erro.message });
          }

          if (resultado.affectedRows === 0) {
            return res.status(404).json({ erro: "Item não encontrado." });
          }

          removerArquivoAntigo(foto);
          res.json({ sucesso: true });
        }
      );
    }
  );
};
