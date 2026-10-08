module.exports = (req, res, next) => {
  const tipo = req.usuarioBanco?.tipo_usuario;

  if (!["funcionario", "admin"].includes(tipo)) {
    return res.status(403).json({
      erro: "Apenas funcionários ou administradores podem realizar esta operação.",
    });
  }

  next();
};
