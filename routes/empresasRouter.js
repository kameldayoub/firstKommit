

const express = require('express');
const controller = require('../controllers/empresasController');
const { validarId } = require('../middlewares/validaciones');

const router = express.Router();

// Una empresa (el id es el id_usuario de la empresa):   GET /api/empresas/:id
router.get('/:id', validarId, controller.obtenerUna);

module.exports = router;