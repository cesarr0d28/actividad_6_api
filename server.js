const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors'); // Importa el paquete cors

const app = express();
app.use(cors()); // Usa cors para permitir solicitudes de origen cruzado
app.use(bodyParser.json());

const db = mysql.createConnection({
    host: '192.168.6.130',
    user: 'root',
    password: 'C3sar123*',
    database: 'api_futbol'
});

db.connect(err => {
    if (err) throw err;
    console.log('Conectado a la base de datos MySQL');
});

// Ingresar equipos de fútbol desde una URL
app.post('/equipos', (req, res) => {
    const { nombre, ciudad, escudoUrl } = req.body;
    const sql = 'INSERT INTO equipos (nombre, ciudad, escudoUrl) VALUES (?, ?, ?)';
    db.query(sql, [nombre, ciudad, escudoUrl], (err, result) => {
        if (err) throw err;
        res.status(201).send({ id: result.insertId, nombre, ciudad, escudoUrl });
    });
});

// Ver los equipos registrados
app.get('/equipos', (req, res) => {
    const sql = 'SELECT * FROM equipos';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.send(results);
    });
});

// Ver los equipos registrados por ID
app.get('/equipos/:id', (req, res) => {
    const sql = 'SELECT * FROM equipos WHERE id = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) throw err;
        if (result.length === 0) {
            return res.status(404).send({ message: 'Equipo no encontrado' });
        }
        res.send(result[0]);
    });
});

// Programar partidos de fútbol
app.post('/partidos', (req, res) => {
    const { equipoLocal, equipoVisitante, fecha } = req.body;

    // Verificar si los equipos existen
    const checkTeamsSql = 'SELECT COUNT(*) AS count FROM equipos WHERE nombre IN (?, ?)';
    db.query(checkTeamsSql, [equipoLocal, equipoVisitante], (err, teamResults) => {
        if (err) throw err;

        const teamCount = teamResults[0].count;
        if (teamCount !== 2) {
            return res.status(400).send({ message: 'Los equipos no están registrados' });
        }

        // Insertar el partido
        const insertPartidoSql = 'INSERT INTO partidos (equipoLocal, equipoVisitante, fecha) VALUES (?, ?, ?)';
        db.query(insertPartidoSql, [equipoLocal, equipoVisitante, fecha], (err, result) => {
            if (err) throw err;
            res.status(201).send({ id: result.insertId, equipoLocal, equipoVisitante, fecha });
        });
    });
});

// Ver los partidos registrados
app.get('/partidos', (req, res) => {
    const sql = 'SELECT * FROM partidos';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.send(results);
    });
});

// Ver partidos por ID
app.get('/partidos/:id', (req, res) => {
    const sql = 'SELECT * FROM partidos WHERE id = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) throw err;
        if (result.length === 0) {
            return res.status(404).send({ message: 'Partido no encontrado' });
        }
        res.send(result[0]);
    });
});

// Eliminar equipos
app.delete('/equipos/:id', (req, res) => {
    const equipoId = req.params.id;

    // Verificar si hay partidos asociados al equipo
    const checkMatchesSql = 'SELECT * FROM partidos WHERE equipoLocal = ?';
    db.query(checkMatchesSql, [equipoId], (err, matches) => {
        if (err) {
            // Manejar error en la consulta
            return res.status(500).send('Error al verificar partidos');
        }

        if (matches.length > 0) {
            // Hay partidos asociados, no se puede eliminar el equipo
            return res.status(409).send('No se puede eliminar el equipo: hay partidos asociados');
        }

        // No hay partidos asociados, se puede eliminar el equipo
        const sql = 'DELETE FROM equipos WHERE id = ?';
        db.query(sql, [equipoId], (err, result) => {
            if (err) {
                // Manejar error al eliminar el equipo
                return res.status(500).send('Error al eliminar el equipo');
            }

            res.status(204).send(); // No content
        });
    });
});

// Eliminar partidos
app.delete('/partidos/:id', (req, res) => {
    const sql = 'DELETE FROM partidos WHERE id = ?';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) throw err;
        res.status(204).send();
    });
});

app.listen(3000, () => {
    console.log('API de fútbol escuchando en el puerto 3000');
});
