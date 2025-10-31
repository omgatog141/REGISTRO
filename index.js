
//  DEPENDENCIAS PRINCIPALES

import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";

// Cargar las variables de entorno desde .env
dotenv.config();

// Inicializar la aplicación Express
const app = express();
app.use(cors());
app.use(express.json()); // Permite procesar cuerpos JSON en peticiones

//  CONFIGURACIÓN DE CONEXIÓN CON MYSQL

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "registro",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Prueba de conexión inicial
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("Conexión exitosa a MySQL:", process.env.DB_NAME);
    conn.release();
  } catch (error) {
    console.error("Error al conectar a MySQL:", error.message);
  }
})();


//  RUTAS DE LA API


// Ruta base de prueba
app.get("/", (req, res) => {
  res.send("Servidor Node + MySQL funcionando correctamente.");
});

// Ruta de verificación de salud del servicio
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "API activa y corriendo correctamente." });
});


// MÉTODO GET: Obtener todos los registros de usuarios

app.get("/api/usuarios", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM usuarios ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({
      error: "Error al listar usuarios",
      detalle: error.message,
    });
  }
});


// MÉTODO GET (por ID): Obtener un usuario específico

app.get("/api/usuarios/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE id_expediente = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({
      error: "Error al buscar el usuario",
      detalle: error.message,
    });
  }
});


// MÉTODO POST: Insertar un nuevo usuario

app.post("/api/usuarios", async (req, res) => {
  const { id_expediente, nombre, area } = req.body;

  // Validación de datos obligatorios
  if (!id_expediente || !nombre || !area) {
    return res.status(400).json({ message: "Error: Todos los campos son obligatorios." });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO usuarios (id_expediente, nombre, area) VALUES (?, ?, ?)",
      [id_expediente, nombre, area]
    );

    // Si la inserción fue exitosa
    if (result.affectedRows === 1) {
      return res.status(201).json({ message: "Usuario registrado correctamente." });
    }

    res.status(500).json({ message: "Error: No se pudo registrar el usuario." });
  } catch (error) {
    res.status(500).json({
      message: "Error al insertar el usuario.",
      detalle: error.message,
    });
  }
});

// MÉTODO PATCH: Actualizar datos de un usuario existente

app.patch("/api/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, area } = req.body;

  if (!nombre && !area) {
    return res.status(400).json({ message: "Error: Debe enviar al menos un campo para actualizar." });
  }

  try {
    const [result] = await pool.query(
      "UPDATE usuarios SET nombre = COALESCE(?, nombre), area = COALESCE(?, area) WHERE id_expediente = ?",
      [nombre, area, id]
    );

    if (result.affectedRows === 1) {
      return res.status(200).json({ message: "Usuario actualizado correctamente." });
    }

    res.status(404).json({ message: "Usuario no encontrado o no modificado." });
  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar el usuario.",
      detalle: error.message,
    });
  }
});


// MÉTODO DELETE: Eliminar un usuario existente

app.delete("/api/usuarios/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM usuarios WHERE id_expediente = ?", [id]);

    if (result.affectedRows === 1) {
      return res.status(200).json({ message: "Usuario eliminado correctamente." });
    }

    res.status(404).json({ message: "Usuario no encontrado." });
  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar el usuario.",
      detalle: error.message,
    });
  }
});


//   CONEXION DEL SERVIDOR 

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log("API lista y conectada con MySQL.");
});
