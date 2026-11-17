

const express = require('express');
const controller = require('../controllers/usuariosController');
const { validarId, validarLogin } = require('../middlewares/validaciones');

const router = express.Router();

// Iniciar sesión:   POST /api/usuarios/login   body: { usuario, password }
// Es POST (y no GET) para que la contraseña viaje en el cuerpo y no en la URL
router.post('/login', validarLogin, controller.login);

// Datos públicos de un usuario (nombre, tipo, foto):   GET /api/usuarios/:id
router.get('/:id', validarId, controller.obtenerUno);

module.exports = router;