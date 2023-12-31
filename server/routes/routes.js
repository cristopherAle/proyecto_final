const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const router = express.Router();
const pool = require('../db/conexion');

const {
  registrarUsuario,
  ingresoPosts,
  ingresoFavoritos,
  obtenerDatosDeUsuario,
  verificarCredenciales,
} = require('../consultas/consultas');

const { checkCredentialsExists, tokenVerification } = require('../middlewares/middleware');

// Ruta principal
router.get('/', (req, res) => {
  res.send('Bienvenido a MegaloManiac');
});

// Registro de nuevo usuario
router.post('/usuarios', async (req, res) => {
  try {
    const usuario = req.body;
    await registrarUsuario(usuario);
    res.json({ message: 'Usuario registrado', name: usuario.name });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});

// Agregar nuevo post (disco)
router.post('/posts', tokenVerification, async (req, res) => {
  try {
    const { email } = req.user;
    const usuario = await obtenerDatosDeUsuario(email);

    if (!usuario) {
      throw {
        code: 404,
        message: 'No se encontró ningún usuario con este correo electrónico',
      };
    }

    const ps_us_id = usuario.us_id;
    const { banda, album, albumImage, categoria } = req.body;
    const newDisco = {
      ps_us_id,
      ps_band: banda,
      ps_album: album,
      ps_albumimage: albumImage,
      ps_category: categoria,
    };

    await ingresoPosts(newDisco);
    res.json({ message: 'Post agregado' });
  } catch (error) {
    console.error(error);
    res.status(error.code || 500).json({ error: error.message || 'Error interno del servidor' });
  }
});

// Añadir a Favoritos
router.post('/favoritos', async (req, res) => {
  try {
    const favoritos = req.body;
    await ingresoFavoritos(favoritos);
    res.json({ message: 'Agregado a Favoritos' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al agregar a Favoritos' });
  }
});

// Visualizar todos los usuarios
router.get('/usuarios', async (req, res) => {
  try {
    const consulta = 'SELECT * FROM usuarios';
    const { rows } = await pool.query(consulta);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});

// Visualizar un usuario por email
router.get('/usuarios/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const consulta = 'SELECT us_id FROM usuarios WHERE us_email = $1';
    const values = [email];
    const { rows } = await pool.query(consulta, values);

    if (rows.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
    } else {
      res.json(rows);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Visualizar todos los discos
router.get('/posts', async (req, res) => {
  try {
    const consulta = 'SELECT * FROM posts';
    const { rows } = await pool.query(consulta);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});

// Visualizar un disco por Id
router.get('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const consulta = 'SELECT * FROM posts where ps_id = $1';
    const values = [id];
    const { rows } = await pool.query(consulta, values);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});

// Visualizar discos por Usuario
router.get('/usuarios_posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const consulta = `
    SELECT us_email, ps_id, ps_band, ps_album, ps_albumimage, ps_albumyear, ps_category, ps_us_id
    FROM posts
    INNER JOIN usuarios ON ps_us_id = us_id
    WHERE ps_us_id = $1`;
    const values = [id];
    const { rows } = await pool.query(consulta, values);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});

// Ver todos los Favoritos
router.get('/favoritos/', async (req, res) => {
  try {
    const consulta = `SELECT fv_id, us_id, us_email, ps_band, ps_album, ps_albumimage, ps_albumyear, ps_category
      FROM favoritos
      INNER JOIN usuarios ON fv_us_id = us_id
      INNER JOIN posts ON fv_ps_id = ps_id`;
    const { rows } = await pool.query(consulta);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});

// Ver Favoritos por Usuario
router.get('/favoritos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const consulta = `SELECT fv_id, us_id, us_email, ps_titulo, ps_descripcion, ps_img
      FROM favoritos
      INNER JOIN usuarios ON fv_us_id = us_id
      INNER JOIN posts ON fv_ps_id = ps_id
      WHERE fv_us_id = $1`;
    const values = [id];
    const { rows } = await pool.query(consulta, values);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});

// Acceso a datos del usuario protegido por token
router.get('/profile', tokenVerification, async (req, res) => {
  try {
    const { email } = req.user;
    const usuario = await obtenerDatosDeUsuario(email);
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});

// Inicio de sesión
router.post('/login', checkCredentialsExists, async (req, res) => {
  try {
    const { email, password } = req.body;
    await verificarCredenciales(email, password);
    const token = jwt.sign({ email }, process.env.SECRET_KEY);
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});

// Actualización de un post (disco)
router.put('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { banda, album, albumImage, albumYear, categoria } = req.body;
    const consulta = `UPDATE posts
      SET ps_band = $2, ps_album = $3, ps_albumimage = $4, ps_albumyear = $5, ps_category = $6
      WHERE ps_id = $1`;
    const values = [id, banda, album, albumImage, albumYear, categoria];
    const { rows } = await pool.query(consulta, values);
    res.send('Datos Actualizados');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});

// Eliminación de un post (disco)
router.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const consulta = 'DELETE FROM posts WHERE ps_id = $1';
    const values = [id];
    const { rows } = await pool.query(consulta, values);
    res.send('Post Eliminado');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});

// Eliminación de un Favorito
router.delete('/favoritos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const consulta = 'DELETE FROM favoritos WHERE fv_id = $1';
    const values = [id];
    const { rows } = await pool.query(consulta, values);
    res.send('Favorito Eliminado');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});

module.exports = router;





// const express = require('express');
// const jwt = require('jsonwebtoken');
// require('dotenv').config();
// const router = express.Router();
// const pool = require("../db/conexion");


// const { registrarUsuario, ingresoPosts, ingresoFavoritos, obtenerDatosDeUsuario, verificarCredenciales } = require('../consultas/consultas');
// const { checkCredentialsExists, tokenVerification } = require('../middlewares/middleware');

// router.get('/', (req, res) => {
//     res.send('Bienvenido a MegaloManiac');
// });

// //Insertar nuevo usuario
// router.post('/usuarios', async (req, res) => {
//     try {
//         const usuario = req.body;
//         await registrarUsuario(usuario);
//         res.send('Usuario registrado');
//     } catch (error) {
//         //res.status(500).send(error)
//         console.log(error)
//     }
// })

// //Agregar Nuevo Posts (disco)

// router.post('/posts', tokenVerification, async (req, res) => {
//     try {
//         // Obtén el token del encabezado de la solicitud
//         const token = req.header('Authorization').split('Bearer ')[1];

//         // Decodifica el token para obtener el correo electrónico del usuario
//         const { email } = jwt.decode(token);

//         // Busca el usuario en la base de datos por su correo electrónico
//         const usuario = await obtenerDatosDeUsuario(email);

//         // Verifica que el usuario exista
//         if (!usuario) {
//             throw {
//                 code: 404,
//                 message: 'No se encontró ningún usuario con este correo electrónico',
//             };
//         }

//         // Obtén el id del usuario autenticado
//         const ps_us_id = usuario.us_id;

//         // Obtén los datos del post del cuerpo de la solicitud
//         const { banda, album, albumImage, categoria } = req.body;

//         // Crea un objeto con los datos del post incluyendo ps_us_id
//         const newDisco = {
//             ps_us_id,
//             ps_band: banda,
//             ps_album: album,
//             ps_albumimage: albumImage,
//             ps_category: categoria,
//         };

//         // Inserta el nuevo post en la base de datos
//         await ingresoPosts(newDisco);

//         res.json({ message: 'Post agregado' });
//     } catch (error) {
//         res.status(error.code || 500).json({ error: error.message });
//     }
// });


// // Añadir a Favoritos
// router.post('/favoritos', async (req, res) => {
//     try {
//         const favoritos = req.body;
//         await ingresoFavoritos(favoritos);
//         res.json({ message: 'Agregado a Favoritos' }); // Enviar una respuesta JSON válida
//     } catch (error) {
//         res.status(500).json({ error: 'Error al agregar a Favoritos' }); // Enviar una respuesta JSON válida en caso de error
//     }
// });

// //Visualizar un usuario

// router.get('/usuarios', async (req, res) => {
//     try {
//         const consulta = "SELECT * FROM usuarios";
//         const { rows } = await pool.query(consulta)
//         res.json(rows);
//     } catch (error) {
//         //res.status(500).send(error)
//         console.log(error.message)
//     }
// })

// //Visualizar un usuario por email

// router.get('/usuarios/:email', async (req, res) => {
//     try {
//         const { email } = req.params;
//         const consulta = "SELECT us_id FROM usuarios WHERE us_email = $1";
//         const values = [email];
//         const { rows } = await pool.query(consulta, values);

//         if (rows.length === 0) {
//             res.status(404).json({ error: 'Usuario no encontrado' });
//         } else {
//             res.json(rows);
//         }
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });



// //Visualizar discos

// router.get('/posts', async (req, res) => {
//     try {
//         const consulta = "SELECT * FROM posts";
//         const { rows } = await pool.query(consulta)
//         res.json(rows);
//     } catch (error) {
//         res.status(500).send(error)
//         //console.log(error.message)
//     }
// })

// //Visualizar discos por Id

// router.get('/posts/:id', async (req, res) => {
//     try {
//         const { id } = req.params;
//         const consulta = "SELECT * FROM posts where ps_id = $1";
//         const values = [id];
//         const { rows } = await pool.query(consulta, values)
//         res.json(rows);
//     } catch (error) {
//         res.status(500).send(error)
//         //console.log(error.message)
//     }
// })

// //Visualizar discos por Usuario

// router.get('/usuarios_posts/:id', async (req, res) => {
//     try {

//         const { id } = req.params;
//         const consulta = "SELECT us_email, ps_id, ps_band, ps_album, ps_albumimage, ps_albumyear, ps_category FROM posts inner join usuarios on ps_us_id = us_id where us_id = $1";
//         const values = [id];
//         const { rows } = await pool.query(consulta, values)
//         res.json(rows);
//     } catch (error) {
//         //res.status(500).send(error)
//         console.log(error.message)
//     }
// })


// // Ver todos los Favoritos
// router.get('/favoritos/', async (req, res) => {
//     try {
//         const consulta = "select fv_id, us_id, us_email, ps_band,  ps_album, ps_albumimage, ps_albumyear, ps_category from favoritos inner join usuarios on fv_us_id = us_id inner join posts on fv_ps_id = ps_id";
//         const { rows } = await pool.query(consulta)
//         res.json(rows);
//     } catch (error) {
//         console.log(error.message)
//     }
// })

// // Ver Favoritos por Usuario
// router.get('/favoritos/:id', async (req, res) => {
//     try {
//         const { id } = req.params;
//         console.log(id)
//         const consulta = "select fv_id, us_id, us_email, ps_titulo, ps_descripcion, ps_img from favoritos inner join usuarios on fv_us_id = us_id inner join posts on fv_ps_id = ps_id where fv_us_id = $1";
//         const values = [id];
//         const { rows } = await pool.query(consulta, values)
//         res.json(rows);
//     } catch (error) {
//         res.status(500).send(error)
//         //console.log(error.message)
//     }
// })



// //Login o Acceso a Usuario

// router.get("/usuarios", tokenVerification, async (req, res) => {
//     try {
//         const token = req.header("Authorization").split("Bearer ")[1];
//         const { email } = jwt.decode(token);
//         const usuario = await obtenerDatosDeUsuario(email);
//         res.json(usuario);
//     } catch (error) {
//         res.status(500).send(error.message);
//     }
// });


// router.post("/login", checkCredentialsExists, async (req, res) => {
//     try {
//       const { email, password } = req.body;
//       await verificarCredenciales(email, password);
//       const token = jwt.sign({ email }, process.env.SECRET_KEY)
//       res.json({ token }); // Enviar el token como un objeto JSON
//     } catch (error) {
//      res.status(500).json({ error: error.message }); // Enviar un objeto JSON con el mensaje de error
//     }
// });




// //Actualizacion de Posts (disco)

// router.put('/posts/:id', async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { banda, album, albumImage, albumYear, categoria } = req.body;
//         const consulta = 'UPDATE posts SET ps_band = $2, ps_album = $3, ps_albumimage = $4, ps_albumyear = $5, ps_category = $6 WHERE ps_id = $1';
//         const values = [id, banda, album, albumImage, albumYear, categoria];
//         const { rows } = await pool.query(consulta, values)
//         res.send('Datos Actualizados')

//     } catch (error) {
//         res.status(500).send(error)
//         //console.log(error.message)
//     }
// })

// //Eliminacion de Posts (disco)

// router.delete('/posts/:id', async (req, res) => {
//     try {
//         const { id } = req.params;
//         const consulta = 'DELETE FROM posts WHERE ps_id = $1';
//         const values = [id];
//         const { rows } = await pool.query(consulta, values)
//         res.send('Post Eliminado')
//     } catch (error) {
//         res.status(500).send(error)
//     }
// })

// //Eliminacion de Favoritos

// router.delete('/favoritos/:id', async (req, res) => {
//     try {
//         const { id } = req.params;
//         const consulta = 'DELETE FROM favoritos WHERE fv_id = $1';
//         const values = [id];
//         const { rows } = await pool.query(consulta, values)
//         res.send('Favorito Eliminado')
//     } catch (error) {
//         res.status(500).send(error)
//         //console.log(error.message)
//     }
// })


// module.exports = router