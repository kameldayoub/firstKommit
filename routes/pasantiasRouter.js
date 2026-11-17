// =========================================================
// routes/pasantiasRouter.js  ·  Mapa de URLs -> funciones
//
// El router solo responde "¿qué pasa cuando llega GET /api/pasantias?".
// La respuesta es una cadena: [validaciones...] -> controlador.
// (El prefijo /api/pasantias se define en server.js; acá las rutas son relativas.)
// =========================================================

const express = require('express');
const controller = require('../controllers/pasantiasController');
const {
  validarId,
  validarConsultaPasantias,
  validarCrearPasantia,
  validarActualizarPasantia,
} = require('../middlewares/validaciones');

const router = express.Router();

// Varios recursos, paginados:   GET /api/pasantias?cantidad=10&from=0
router.get('/', validarConsultaPasantias, controller.listar);

// Un solo recurso (404 si no existe):   GET /api/pasantias/:id
router.get('/:id', validarId, controller.obtenerUna);

// Crear:   POST /api/pasantias
router.post('/', validarCrearPasantia, controller.crear);

// Actualizar:   PUT /api/pasantias/:id
router.put('/:id', validarId, validarActualizarPasantia, controller.actualizar);

module.exports = router;