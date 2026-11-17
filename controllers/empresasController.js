// =========================================================
// controllers/empresasController.js
// =========================================================

const empresasService = require('../services/empresasService');

// GET /api/empresas/:id
async function obtenerUna(req, res) {
  const empresa = await empresasService.obtenerPorId(req.params.id);

  res.status(200).json({ ok: true, datos: empresa });
}

module.exports = { obtenerUna };
