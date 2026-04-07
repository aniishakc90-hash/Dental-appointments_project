const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// connect database
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Database error:", err.message);
  } else {
    console.log("Connected to SQLite database");
  }
});

// create table
db.run(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    treatment TEXT NOT NULL
  )
`);

// test route
app.get("/", (req, res) => {
  res.send("API is working ✅");
});

/**
 * @api {get} /appointments Get All Appointments
 * @apiName GetAppointments
 * @apiGroup Appointment
 *
 * @apiSuccess {Object[]} appointments List of appointments
 */
app.get("/appointments", (req, res) => {
  db.all("SELECT * FROM appointments ORDER BY id ASC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

/**
 * @api {get} /appointments/:id Get Single Appointment
 * @apiName GetAppointmentById
 * @apiGroup Appointment
 *
 * @apiParam {Number} id Appointment ID
 */
app.get("/appointments/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM appointments WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(row);
  });
});

/**
 * @api {post} /appointments Create Appointment
 * @apiName CreateAppointment
 * @apiGroup Appointment
 *
 * @apiBody {String} first_name First Name
 * @apiBody {String} last_name Last Name
 * @apiBody {String} date Date
 * @apiBody {String} time Time
 * @apiBody {String} treatment Treatment
 */
app.post("/appointments", (req, res) => {
  const { first_name, last_name, date, time, treatment } = req.body;

  if (!first_name || !last_name || !date || !time || !treatment) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = `
    INSERT INTO appointments (first_name, last_name, date, time, treatment)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(sql, [first_name, last_name, date, time, treatment], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(201).json({
      message: "Appointment added successfully",
      id: this.lastID,
    });
  });
});

/**
 * @api {put} /appointments/:id Update Appointment
 * @apiName UpdateAppointment
 * @apiGroup Appointment
 *
 * @apiParam {Number} id Appointment ID
 */
app.put("/appointments/:id", (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, date, time, treatment } = req.body;

  if (!first_name || !last_name || !date || !time || !treatment) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = `
    UPDATE appointments
    SET first_name = ?, last_name = ?, date = ?, time = ?, treatment = ?
    WHERE id = ?
  `;

  db.run(sql, [first_name, last_name, date, time, treatment, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment updated successfully" });
  });
});

/**
 * @api {delete} /appointments/:id Delete Appointment
 * @apiName DeleteAppointment
 * @apiGroup Appointment
 *
 * @apiParam {Number} id Appointment ID
 */
app.delete("/appointments/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM appointments WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json({ message: "Appointment deleted successfully" });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});