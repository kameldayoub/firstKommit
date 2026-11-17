// =========================================================
// services/usuariosService.js
// =========================================================

const supabase = require('../config/supabase');
const ApiError = require('../utils/ApiError');

// La comparación de contraseñas la hace la función fn_login dentro de la
// base de datos (que conoce el hash). El servidor nunca lee la contraseña guardada.
async function login(usuario, password) {
  const { data, error } = await supabase.rpc('fn_login', {
    p_usuario: usuario,
    p_password: password,
  });

  if (error) throw ApiError.baseDeDatos(error, 'login');

  // 401 Unauthorized. El mensaje es el mismo si falla el usuario o la
  // contraseña, para no revelar cuál de los dos existe.
  if (!data || data.length === 0) {
    throw new ApiError(401, 'Usuario o contraseña incorrectos');
  }

  const u = data[0];
  return { id_usuario: u.id_usuario, nom_usuario: u.nom_usuario, tipo: u.tipo };
}

// Nunca se devuelve la contraseña: solo los campos públicos.
async function obtenerPorId(id) {
  const { data, error } = await supabase
    .from('usuario')
    .select('id_usuario, nom_usuario, tipo, foto_perfil')
    .eq('id_usuario', id)
    .maybeSingle();

  if (error) throw ApiError.baseDeDatos(error, 'obtener usuario');
  if (!data) throw new ApiError(404, `No existe el usuario con id ${id}`);

  return data;
}

module.exports = { login, obtenerPorId };