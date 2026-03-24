const express = require("express");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 IMPORTANT (form data)
app.use(express.urlencoded({ extended: true }));

// Serve uploads
app.use("/uploads", express.static("uploads"));

// -------------------- FILES --------------------
const DATA_FILE = "posts.json";
const EVENT_FILE = "events.json";

// -------------------- LOAD/SAVE --------------------
function loadEvents() {
  if (!fs.existsSync(EVENT_FILE)) return [];
  return JSON.parse(fs.readFileSync(EVENT_FILE));
}

function saveEvents(events) {
  fs.writeFileSync(EVENT_FILE, JSON.stringify(events, null, 2));
}

// -------------------- HOME --------------------
app.get("/", (req, res) => {
  res.send(`
    <h1>🚀 AI Tools Website</h1>
    <a href="/events">📦 Events</a><br><br>
    <a href="/admin-events">➕ Add Event</a>
  `);
});

// -------------------- EVENTS PAGE --------------------
app.get("/events", (req, res) => {
  const events = loadEvents();

  let html = `
  <html>
  <head>
    <title>Events</title>
    <style>
      body { font-family: Arial; background:#0f172a; color:white; padding:20px; }
      .box {
        background:#1e293b;
        padding:15px;
        margin:15px 0;
        border-radius:10px;
      }
      a { color:lightblue; }
    </style>
  </head>
  <body>

  <h1>📦 Events</h1>
  <a href="/admin-events">➕ Add Event</a>
  `;

  events.forEach(e => {
    html += `
      <div class="box">
        <h2>${e.name}</h2>
        <p><b>Team:</b> ${e.team}</p>
        ${e.updated ? `<p style="color:yellow;">🆕 Updated</p>` : ""}
      </div>
    `;
  });

  html += "</body></html>";

  res.send(html);
});

// -------------------- ADMIN PAGE --------------------
app.get("/admin-events", (req, res) => {
  res.send(`
    <html>
    <head>
      <title>Add Event</title>
      <style>
        body { font-family: Arial; padding:20px; background:#0f172a; color:white; }
        input, button { width:100%; padding:10px; margin:10px 0; }
        button { background:#22c55e; border:none; color:white; }
      </style>
    </head>

    <body>
      <h1>➕ Add Event</h1>

      <form action="/add-event" method="post">
        <input name="name" placeholder="Event Name" required />
        <input name="team" placeholder="Team Members (comma separated)" required />

        <label>
          <input type="checkbox" name="updated" />
          Mark as Updated
        </label>

        <button type="submit">Create Event</button>
      </form>

      <br>
      <a href="/events">📦 View Events</a>
    </body>
    </html>
  `);
});

// -------------------- SAVE EVENT --------------------
app.post("/add-event", (req, res) => {
  const events = loadEvents();

  const newEvent = {
    name: req.body.name,
    team: req.body.team,
    updated: req.body.updated ? true : false
  };

  events.push(newEvent);
  saveEvents(events);

  res.redirect("/events");
});

// -------------------- DEBUG --------------------
app.get("/check", (req, res) => {
  res.send("✅ NEW CODE WORKING");
});

// -------------------- START --------------------
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});