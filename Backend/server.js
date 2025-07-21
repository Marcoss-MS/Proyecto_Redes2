const http = require("http");
const mysql = require("mysql");

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === "/api/contacto") {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

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
            res.end(JSON.stringify({ mensaje: "Guardado exitosamente" }));
          }
        );
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error de formato" }));
      }
    });
  } else {
    res.writeHead(404);
    res.end("Ruta no encontrada");
  }
});

server.listen(3000, () => {
  console.log("Servidor Node escuchando en http://localhost:3000");
});