//  404 de la API y manejo central de errores
//
// Un middleware con 4 parámetros (err, req, res, next) 
// solo se ejecuta cuando alguien tiró un error,evita
// repetir try/catch con res.status(500) en cada controlador.
// =========================================================

const ApiError = require('../utils/ApiError');

// Se ejecuta si la URL empieza con /api pero ninguna ruta la atendió.
function noEncontrado(req, res, next) {
  next(new ApiError(404, `La ruta ${req.method} ${req.originalUrl} no existe`));
}


function manejarErrores(err, req, res, next) {
  // express.json() lanza este error cuando el cuerpo no es un JSON válido
  if (err.type === 'entity.parse.failed') {
    err = new ApiError(400, 'El cuerpo de la petición no es un JSON válido');
  }

  // Errores "esperados": ya traen su status y su mensaje
  if (err instanceof ApiError) {
    const respuesta = { ok: false, mensaje: err.message };
    if (err.errores) respuesta.errores = err.errores;
    return res.status(err.status).json(respuesta);
  }

  // Cualquier otra cosa es un bug nuestro: se loguea y se responde 500
  console.error('Error inesperado:', err);
  return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
}

module.exports = { noEncontrado, manejarErrores };