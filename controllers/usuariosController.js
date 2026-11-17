// =========================================================
// controllers/usuariosController.js
// =========================================================

const usuariosService = require('../services/usuariosService');

// POST /api/usuarios/login
async function login(req, res) {
  const { usuario, password } = req.datos; // ya validado
  const usuarioLogueado = await usuariosService.login(usuario, password);

  res.status(200).json({ ok: true, datos: usuarioLogueado });
}

// GET /api/usuarios/:id
async function obtenerUno(req, res) {
  const usuario = await usuariosService.obtenerPorId(req.params.id);

  res.status(200).json({ ok: true, datos: usuario });
}

module.exports = { login, obtenerUno };
