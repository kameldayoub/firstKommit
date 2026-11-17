# FirstKommit

FirstKommit es una aplicación web de pasantías. Las **empresas** publican, editan y finalizan ofertas, y los **estudiantes** las exploran y miran su detalle.

Este documento explica **cómo está pensado el proyecto**: qué hace cada parte, cómo se conectan entre sí y por qué se decidió así. Si querés entender el código antes de leerlo, empezá por acá

## 1. La idea general

El proyecto tiene tres piezas:

```
┌────────────────┐      ┌──────────────────────┐      ┌────────────────┐
│   FRONTEND     │      │       BACKEND        │      │   BASE DE      │
│  HTML/CSS/JS   │ ───► │  API REST (Express)  │ ───► │   DATOS        │
│  (public/)     │ ◄─── │   Node.js            │ ◄─── │   Supabase     │
└────────────────┘      └──────────────────────┘      └────────────────┘
  lo que ve y toca        decide qué se puede           guarda la
  el usuario              pedir, valida y consulta      información
```

- **Frontend:** las páginas que ve el usuario. No tiene frameworks: es HTML, CSS y JavaScript plano
- **Backend (API):** un servidor Node con Express. Recibe pedidos del frontend (por ejemplo, "dame las pasantías activas"), los valida, consulta la base y responde en formato JSON
- **Base de datos:** Supabase (PostgreSQL), donde viven los usuarios, empresas y pasantías

l frontend nunca habla directamente con la base. Siempre pasa por la API.

### ¿Por qué pasar siempre por la API?

- **Seguridad:** las claves de Supabase quedan solo en el servidor. Si el navegador hablara directo con la base, cualquiera podría ver las claves en el código de la página y consultar los datos sin pasar por ninguna regla.
- **Validación en un solo lugar:** todos los datos que entran se revisan en el servidor, sin importar desde dónde lleguen.
- **Orden:** si la base cambia, solo se toca el servidor. Las páginas no se enteran.

## 2. El backend: 

El código del servidor está dividido en carpetas. Cada una hace una sola cosa, y eso evita tener un archivo gigante donde todo se mezcla

```
server.js          →  arma la aplicación y la pone a escuchar
routes/            →  mapa de direcciones: "esta URL va a esta función"
middlewares/       →  controles que se ejecutan antes: validaciones y errores
controllers/       →  traducen entre HTTP y la lógica
services/          →  hablan con la base de datos
config/            →  la conexión a Supabase
utils/             →  piezas auxiliares (el error con código HTTP)
```

### Qué pasa cuando llega un pedido

Tomemos el ejemplo `GET /api/pasantias?cantidad=5&from=0` ("dame 5 pasantías, empezando desde la primera"):

```
1. server.js        recibe el pedido y lo deriva al router de pasantías
        ▼
2. routes/          ve que es un GET a "/" y arma la cadena: validación → controlador
        ▼
3. middlewares/     revisa que cantidad y from sean números válidos
   validaciones     (si no lo son, responde 400 y el pedido no sigue)
        ▼
4. controllers/     toma los datos ya validados y se los pasa al service
        ▼
5. services/        consulta Supabase: "las pasantías activas, de la 0 a la 4"
        ▼
6. controllers/     recibe el resultado y responde 200 con el JSON
```

Si en cualquier punto algo sale mal, se lanza un error con su código HTTP (`ApiError`) y el **manejador de errores** (`middlewares/errorHandler.js`) lo transforma en una respuesta clara. Por eso los controladores no necesitan escribir `try/catch` en cada función.

### Qué hace cada capa (y qué NO hace)

| Capa            | Hace                                                                         | No hace                  |
|------           |------                                                                        |---------                 |
| **routes**      | Asocia cada URL y verbo con su validación y su controlador                   | No tiene lógica          |
| **middlewares** | Valida los datos y limpia el formato (espacios, tipos)                       | No consulta la base      |
| **controllers** | Lee el pedido, llama al service y elige el código de respuesta (200, 201...) | No valida ni toca la base|
| **services**    | Es el **único** que consulta Supabase                                        | No sabe nada de HTTP     |

Esta separación permite, por ejemplo, cambiar Supabase por otra base reescribiendo solo `services/`, sin tocar el resto

### Los endpoints

|Verbo| URL                                 | Qué hace                                                                               |
|---  |---                                  |---                                                                                     |
| GET | `/api/pasantias?cantidad=10&from=0` | Lista paginada. Filtros opcionales: `estado` (activas, finalizadas, todas) y `empresa` |
| GET | `/api/pasantias/:id`                | Detalle de una pasantía, con sus requisitos y tareas. Da **404** si no existe          |
| POST| `/api/pasantias`                    | Crea una pasantía con sus requisitos y tareas                                          |
| PUT | `/api/pasantias/:id`                | Modifica los datos de una pasantía                                                     |
| POST| `/api/usuarios/login`               | Inicia sesión                                                                          |
| GET | `/api/usuarios/:id`                 | Datos públicos de un usuario (nombre, tipo, foto)                                      |
| GET | `/api/empresas/:id`                 | Datos de una empresa                                                                   |

Se sigue una convención: todo empieza con `/api/` y usa el nombre del recurso en **plural**, incluso para un único recurso (`/api/pasantias/:id`)

### Decisiones de diseño

**Paginación (`cantidad` y `from`).** Traer todas las pasantías de una vez es lento y no escala. En cambio, el listado pide de a pocas (`cantidad`), empezando desde cierta posición (`from`). La respuesta incluye además `total`, para saber si quedan más y mostrar el botón "Ver más". Se limita `cantidad` a un máximo de 50 para que nadie pueda pedir miles de filas.

**Validación y códigos de error.** Cada endpoint revisa lo que recibe y responde con el código HTTP que corresponde, con un mensaje que explica el problema:

| Código | Significa                | Ejemplo                                                 |
|---     |---                       |---                                                      |
| 200    | Todo bien                | Se devuelve una lista                                   |
| 201    | Creado                   | Se publicó una pasantía                                 |
| 400    | El pedido está mal hecho | `cantidad=abc`, un id que no es UUID, un campo faltante |
| 401    | Credenciales incorrectas | Contraseña errónea en el login                          |
| 404    | No existe                | Una pasantía con un id inexistente                      |
| 500    | Falla del servidor       | Error en la base de datos                               |

Todas las respuestas de error tienen el mismo formato: `{ "ok": false, "mensaje": "...", "errores": [...] }`. Del error 500 solo se muestra un mensaje genérico; el detalle técnico queda en el registro del servidor, para no exponer info

**Una pasantía es varias tablas.** Al crear una pasantía hay que insertar en cinco tablas. Como Supabase no permite hacerlo en una sola transacción desde este servidor, el service inserta de a una y, si algo falla en el medio, **borra lo que ya había creado** para no dejar pasantías incompletas

**Activa o finalizada.** No existe un campo "estado". Una pasantía está activa si su `fecha_fin` es posterior a ahora. Por eso "finalizar" una pasantía es simplemente ponerle como fecha de fin la de hoy (un `PUT`), y "reabrirla" es ponerle una fecha futura

## 3. El frontend

Todas las páginas están en `public/`, y Express las entrega tal cual (`express.static`). Cada página tiene su script en `public/js/`.

| Página                |Quién la usa| Qué muestra                     | Qué le pide a la API             |
|---                    |---         |---                              |---                               |
| `index.html`          | Todos      | Inicio de sesión                | `POST /api/usuarios/login`       |
| `main.html`           | Estudiante | Carrusel y listado de pasantías | `GET /api/pasantias` (paginado)  |
| `pasantia.html`       | Todos      | Detalle de una pasantía         | `GET /api/pasantias/:id`         |
| `perfil.html`         | Estudiante | Su perfil                       | `GET /api/usuarios/:id`          |
| `mainEmpresa.html`    | Empresa    | Panel con sus pasantías         | `GET /api/pasantias?empresa=..`  |
| `perfilEmpresa.html`  | Empresa    | Perfil y pasantías publicadas   | `GET /api/empresas/:id`          |
| `nuevaPasantia.html`  | Empresa    | Formulario para publicar        | `POST /api/pasantias`            |
| `editarPasantia.html` | Empresa    | Formulario para editar          | `GET` y `PUT /api/pasantias/:id` |

### Cómo se conectan las páginas

```
index.html (login)
    │
    ├── tipo "estudiante" ──► main.html ──► pasantia.html
    │                            └──────► perfil.html
    │
    └── tipo "empresa" ─────► mainEmpresa.html ──► pasantia.html ──► editarPasantia.html
                                   ├────────────► nuevaPasantia.html
                                   └────────────► perfilEmpresa.html
```

### La sesión

Cuando el login es correcto, el navegador guarda en `localStorage` un objeto con `id`, `nombre` y `tipo` del usuario. Todas las páginas lo leen para saber quién está navegando. Si no hay sesión, redirigen al login. Si un estudiante intenta entrar a una página de empresa, lo mandan a su panel.

### Dos scripts compartidos

- **`utils.js`** reúne lo que usan varias páginas de empresa: la función `llamarApi()`, que hace el `fetch` y convierte los errores de la API en errores de JavaScript con su mensaje; el **paginador** con el botón "Ver más"; y los formatos de fechs
- Los demás scripts son específicos de cada página y solo dibujan los datos que reciben

### Cómo funciona "Ver más"

La página pide la primera tanda (`from=0`), la dibuja y recuerda cuántas mostró. Al apretar el botón, pide la siguiente (`from` = lo ya mostrado). Cuando `from` alcanza el `total` que informa la API, el botón desaparece

## 4. La base de datos

```
usuario ──┬── estudiante
          └── empresa ───► pasantia ───┬──► requisito
                                       └──► tarea ───► inciso
```

| Tabla                    | Qué guarda                                                                     |
|---                       |---                                                                             |
| `usuario`                | Nombre de usuario, contraseña (cifrada), tipo y foto de perfil                 |
| `estudiante` / `empresa` | Datos propios de cada tipo. Comparten el id con `usuario`                      |
| `pasantia`               | Descripción, duración, monto, horas diarias, fechas, y a qué empresa pertenece |
| `requisito`              | Cada requisito de una pasantía                                                 |
| `tarea`                  | Cada grupo de tareas de una pasantía                                           |
| `inciso`                 | Cada ítem dentro de un grupo de tareas                                         |

Requisitos, tareas e incisos no tienen un id propio: se identifican combinando la pasantía con su texto (claves compuestas). Por eso no puede haber dos requisitos iguales ni dos tareas con el mismo título dentro de una misma pasantía, y la API lo valida antes de insertar.

**El login** lo resuelve una función de la propia base (`fn_login`). Las contraseñas están cifradas, así que la comparación se hace dentro de Supabase y el servidor nunca ve la contraseña guardada.

## 5. Limitaciones conocidas

Son cosas que se dejaron fuera a propósito y a tewner presentes:

- **No hay autenticación con token.** La API no comprueba quién la llama. El `id_usuario` al crear una pasantía viaja en el cuerpo del pedido, y los botones "Editar" y "Finalizar" solo se esconden en la interfaz. Una versión real necesitaría tokens (por ejemplo JWT) y verificar en el servidor que solo la empresa dueña modifique sus pasantías.
- **Crear una pasantía no es una transacción real.** El "deshacer" manual cubre casi todos los casos, pero no es tan seguro como una transacción de base de datos.
- **El PUT solo modifica los datos de la pasantía**, no sus requisitos ni sus tareas.
- Algunas pasantías antiguas tienen duración, monto u horas vacíos y hay que completarlos antes de poder editarlas.

## 6. Para ejecutarlo (resumen)

Hace falta Node 22 o superior y un archivo `.env` con `SUPABASE_URL` (sin `/rest/v1`) y `SUPABASE_ANON_KEY`. Después:

```bash
npm install
npm run dev
```

Y se entra por `http://localhost:3000`. Hay un `.env` como modelo
