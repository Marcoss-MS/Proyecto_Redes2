const http = require("http");
const mysql = require("mysql");
const url = require("url");

const conexion = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "contactos"
});

conexion.connect(err => {
  if (err) {
    console.error("Error de conexión:", err);
    return;
  }
  console.log("Conectado a la base de datos MySQL");
});

const server = http.createServer((req, res) => {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === "/api/contacto") {

    if (req.method === "POST") {
      // Insertar nuevo mensaje
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", () => {
        try {
          const datos = JSON.parse(body);
          console.log("Datos recibidos:", datos);

          conexion.query(
            "INSERT INTO mensajes (nombre, email, mensaje) VALUES (?, ?, ?)",
            [datos.nombre, datos.email, datos.mensaje],
            (err, resultado) => {
              if (err) {
                console.error("Error al guardar:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Error al guardar en la base de datos" }));
                return;
              }
              res.writeHead(201, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ mensaje: "Guardado exitosamente", id: resultado.insertId }));
            }
          );
        } catch (error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Error de formato" }));
        }
      });

    } else if (req.method === "GET") {
      // Obtener todos los mensajes
      conexion.query("SELECT * FROM mensajes", (err, resultados) => {
        if (err) {
          console.error("Error al consultar:", err);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Error al consultar la base de datos" }));
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(resultados));
      });

    } else if (req.method === "PATCH") {
      // Actualizar mensaje por id (espera JSON con id y campos a actualizar)
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", () => {
        try {
          const datos = JSON.parse(body);
          if (!datos.id) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Falta el id para actualizar" }));
            return;
          }

          // Construimos consulta dinámicamente para solo actualizar los campos enviados
          const campos = [];
          const valores = [];

          if (datos.nombre) {
            campos.push("nombre = ?");
            valores.push(datos.nombre);
          }
          if (datos.email) {
            campos.push("email = ?");
            valores.push(datos.email);
          }
          if (datos.mensaje) {
            campos.push("mensaje = ?");
            valores.push(datos.mensaje);
          }

          if (campos.length === 0) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "No hay campos para actualizar" }));
            return;
          }

          valores.push(datos.id); // para el WHERE id=?

          const sql = `UPDATE mensajes SET ${campos.join(", ")} WHERE id = ?`;

          conexion.query(sql, valores, (err, resultado) => {
            if (err) {
              console.error("Error al actualizar:", err);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Error al actualizar en la base de datos" }));
              return;
            }

            if (resultado.affectedRows === 0) {
              res.writeHead(404, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "No se encontró el mensaje con ese id" }));
              return;
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ mensaje: "Actualizado exitosamente" }));
          });

        } catch (error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Error de formato" }));
        }
      });

    } else if (req.method === "DELETE") {
      // Eliminar mensaje por id (id debe venir en query ?id=)
      const id = parsedUrl.query.id;

      if (!id) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Falta el id para eliminar" }));
        return;
      }

      conexion.query("DELETE FROM mensajes WHERE id = ?", [id], (err, resultado) => {
        if (err) {
          console.error("Error al eliminar:", err);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Error al eliminar en la base de datos" }));
          return;
        }

        if (resultado.affectedRows === 0) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No se encontró el mensaje con ese id" }));
          return;
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ mensaje: "Eliminado exitosamente" }));
      });

    } else {
      // Método no soportado
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Método no soportado" }));
    }

  } else {
    res.writeHead(404);
    res.end("Ruta no encontrada");
  }
});

server.listen(3000, () => {
  console.log("Servidor Node escuchando en http://localhost:3000");
});
