// =========================================================
// controllers/pasantiasController.js  ·  Capa HTTP
//
// El controlador es el "traductor" entre HTTP y la lógica:
//   * lee lo que llegó (req.params, req.query, req.datos)
//   * le pide el trabajo al service
//   * arma la respuesta (status + JSON)
// No habla con la base de datos y no valida (eso ya lo hizo el middleware).
//
// No hace falta try/catch: Express 5 captura solo los errores de las
// funciones async y los manda al manejador de errores de server.js.
// =========================================================

const pasantiasService = require('../services/pasantiasService');

// GET /api/pasantias
async function listar(req, res) {
  const { cantidad, from, estado, empresa } = req.consulta; // ya validado
  const { datos, total } = await pasantiasService.listar({ cantidad, from, estado, empresa });

  res.status(200).json({ ok: true, cantidad, from, total, datos });
}

// GET /api/pasantias/:id
async function obtenerUna(req, res) {
  const pasantia = await pasantiasService.obtenerPorId(req.params.id);

  res.status(200).json({ ok: true, datos: pasantia });
}

// POST /api/pasantias
async function crear(req, res) {
  const pasantia = await pasantiasService.crear(req.datos);

  // 201 Created + cabecera Location con la URL del recurso nuevo
  res
    .status(201)
    .location(`/api/pasantias/${pasantia.id_pasantia}`)
    .json({ ok: true, datos: pasantia });
}

// PUT /api/pasantias/:id
async function actualizar(req, res) {
  const pasantia = await pasantiasService.actualizar(req.params.id, req.datos);

  res.status(200).json({ ok: true, datos: pasantia });
}

module.exports = { listar, obtenerUna, crear, actualizar };
