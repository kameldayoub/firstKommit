


// server.js  ·  
//solo se "arma" la app Express
// enchufando cada pieza en el orden correcto y se la pone a escuchar.
// =========================================================

//  Lee el archivo .env y  valores en process.env
require('dotenv').config();

const path = require('path');
const express = require('express');

const pasantiasRouter = require('./routes/pasantiasRouter');
const usuariosRouter = require('./routes/usuariosRouter');
const empresasRouter = require('./routes/empresasRouter');
const { noEncontrado, manejarErrores } = require('./middlewares/errorHandler');

const app = express();

//  Middlewares globales, de ejecutan, en este orden, ante CADA petición.
//    express.json() convierte el cuerpo JSON de un POST/PUT en req.body.
app.use(express.json());


//    Si la URL coincide con un archivo, responde acá y la petición no sigue.
app.use(express.static(path.join(__dirname, 'public')));

//  Rutas de la API
app.use('/api/pasantias', pasantiasRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/empresas', empresasRouter);

//  Lo que llegue a /api y no coincidió con nada:404 en formato JSON
app.use('/api', noEncontrado);

//  Manejador de errores, recibe todo lo que
//    cualquier capa anterior haya tirado con "throw" o "next(error)".
app.use(manejarErrores);

// Solo se pone a escuchar si se ejecuta con "node server.js"
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
