//  Un error que "sabe" con qué código HTTP responder
//
// Cualquier capa puede hacer:   throw new ApiError(404, 'No existe ...')
// y el manejador de errores (middlewares/errorHandler.js) lo convierte
// en una respuesta HTTP con ese status y un mensaje claro.

class ApiError extends Error {
  constructor(status, mensaje, errores) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;   // 400, 401, 404, 500...
    this.errores = errores; // opcional:por ejemplo, qué campos fallaron)
  }

  // Error de Supabase: el detalle técnico  en el servidor,
  // pero al cliente solo le llega un mensaje genérico.
  static baseDeDatos(error, contexto) {
    console.error(`[DB] ${contexto}:`, error.message);
    return new ApiError(500, 'Error en la base de datos');
  }
}

module.exports = ApiError;