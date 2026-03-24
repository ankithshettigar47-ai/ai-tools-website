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
  <html>
  <head>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3320175178558120"
     crossorigin="anonymous"></script>
    <title>Dashboard</title>
    <style>
      body {
        margin:0;
        font-family: Arial;
        background:#020617;
        color:white;
      }
      .nav {
        background:#0f172a;
        padding:15px;
        display:flex;
        justify-content:space-between;
      }
      .nav a {
        color:white;
        margin:0 10px;
        text-decoration:none;
      }
      .hero {
        text-align:center;
        padding:50px;
      }
      .btn {
        padding:12px 20px;
        background:#22c55e;
        color:white;
        text-decoration:none;
        border-radius:5px;
      }
    </style>
  </head>

  <body>

    <div class="nav">
      <div>🚀 AI Dashboard</div>
      <div>
        <a href="/events">Events</a>
        <a href="/admin-events">Add Event</a>
      </div>
    </div>

    <div class="hero">
      <h1>Welcome to Your System</h1>
      <p>Manage events, teams & content</p>
      <a class="btn" href="/events">View Events</a>
    </div>

  </body>
  </html>
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

  eevents.forEach((e, i) => {
  html += `
    <div class="box">
      <h2>${e.name}</h2>
      <p><b>Team:</b> ${e.team}</p>
    </div>
  `;

  // 🔥 SHOW AD AFTER EVERY 2 EVENTS
  if (i % 2 === 1) {
    html += `
      <ins class="adsbygoogle"
           style="display:block; margin:20px 0;"
           data-ad-client="ca-pub-3320175178558120"
           data-ad-slot="1234567890"
           data-ad-format="auto"></ins>
      <script>
        (adsbygoogle = window.adsbygoogle || []).push({});
      </script>
    `;
  }
});

  html += "</body></html>";

  res.send(html);
});

app.get("/ai-tools", (req, res) => {
  res.send(`
    <h1>🔥 Best Free AI Tools 2026</h1>

    <p>1. ChatGPT - Best AI chatbot</p>
    <a href="#">Try Now</a>

    <p>2. Canva AI - Design tools</p>
    <a href="#">Try Now</a>

    <p>3. Remove.bg - Image background remover</p>
    <a href="#">Try Now</a>

    <hr>

    <!-- Ad -->
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="ca-pub-3320175178558120"
         data-ad-slot="1234567890"
         data-ad-format="auto"></ins>

    <script>
      (adsbygoogle = window.adsbygoogle || []).push({});
    </script>
  `);
});

// ❌ DELETE EVENT
app.get("/delete-event/:index", (req, res) => {
  const events = loadEvents();
  events.splice(req.params.index, 1);
  saveEvents(events);
  res.redirect("/events");
});

// ✏️ EDIT PAGE
app.get("/edit-event/:index", (req, res) => {
  const events = loadEvents();
  const e = events[req.params.index];

  res.send(`
    <h1>Edit Event</h1>
    <form action="/update-event/${req.params.index}" method="post">
      <input name="name" value="${e.name}" required />
      <input name="team" value="${e.team}" required />
      <label>
        <input type="checkbox" name="updated" ${e.updated ? "checked" : ""} />
        Updated
      </label>
      <button>Update</button>
    </form>
  `);
});

app.post("/update-event/:index", (req, res) => {
  const events = loadEvents();

  events[req.params.index] = {
    name: req.body.name,
    team: req.body.team,
    updated: req.body.updated ? true : false
  };

  saveEvents(events);
  res.redirect("/events");
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