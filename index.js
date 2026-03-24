const express = require("express");
const fs = require("fs");
const multer = require("multer");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// Image Upload Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Data file
const DATA_FILE = "posts.json";

const loadPosts = () => {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
};

const savePosts = (posts) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
};

// HOME PAGE
app.get("/", (req, res) => {
  const posts = loadPosts();

  let html = `
  <html>
  <head>
    <title>AI Tools Hub</title>
    <meta name="description" content="Best AI tools, apps & reviews">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- AdSense Script -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3320175178558120"
     crossorigin="anonymous"></script>

    <style>
      body {
        margin:0;
        font-family: 'Segoe UI', sans-serif;
        background:#0f172a;
        color:white;
      }
      header {
        background:#020617;
        padding:20px;
        text-align:center;
        font-size:28px;
        font-weight:bold;
      }
      .container {
        max-width:900px;
        margin:auto;
        padding:20px;
      }
      .card {
        background:#1e293b;
        padding:20px;
        margin:20px 0;
        border-radius:15px;
        box-shadow:0 0 15px rgba(0,0,0,0.5);
      }
      .card img {
        width:100%;
        border-radius:10px;
      }
      .card h2 {
        margin:10px 0;
      }
      .ad {
        margin-top:20px;
        padding:10px;
        background:#0f172a;
      }
      a {
        color:#38bdf8;
        text-decoration:none;
      }
    </style>
  </head>

  <body>
    <header>🚀 AI Tools Hub</header>

    <div class="container">
      <a href="/admin">⚙ Admin Panel</a>
  `;

  posts.reverse().forEach(post => {
    html += `
      <div class="card">
        <h2>${post.title}</h2>
        ${post.image ? `<img src="${post.image}" />` : ""}
        <p>${post.content}</p>

        <!-- AdSense Ad -->
        <div class="ad">
          <ins class="adsbygoogle"
               style="display:block"
               data-ad-client="ca-pub-3320175178558120"
               data-ad-slot="1234567890"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
          <script>
               (adsbygoogle = window.adsbygoogle || []).push({});
          </script>
        </div>
      </div>
    `;
  });

  html += `
    </div>
  </body>
  </html>
  `;

  res.send(html);
});

// ADMIN PAGE
app.get("/admin", (req, res) => {
  const posts = loadPosts();

  let html = `
  <html>
  <head>
    <title>Admin Panel</title>
    <style>
      body { font-family:Arial; padding:20px; }
      input, textarea {
        width:100%;
        padding:10px;
        margin:5px 0;
      }
      button {
        padding:10px 15px;
        background:black;
        color:white;
        border:none;
      }
    </style>
  </head>

  <body>
    <h1>⚙ Admin Panel</h1>

    <form action="/add" method="post" enctype="multipart/form-data">
      <input name="title" placeholder="Post Title" required />
      <textarea name="content" placeholder="Post Content" required></textarea>
      <input type="file" name="image" />
      <button type="submit">Add Post</button>
    </form>

    <h2>All Posts</h2>
  `;

  posts.forEach((post, i) => {
    html += `
      <div>
        ${post.title}
        <form action="/delete/${i}" method="post">
          <button>Delete</button>
        </form>
      </div>
    `;
  });

  html += "</body></html>";
  res.send(html);
});

// ADD POST
app.post("/add", upload.single("image"), (req, res) => {
  const posts = loadPosts();

  const newPost = {
    title: req.body.title,
    content: req.body.content,
    image: req.file ? "/uploads/" + req.file.filename : null,
  };

  posts.push(newPost);
  savePosts(posts);

  res.redirect("/");
});

// DELETE POST
app.post("/delete/:index", (req, res) => {
  const posts = loadPosts();
  posts.splice(req.params.index, 1);
  savePosts(posts);
  res.redirect("/admin");
});

app.get("/admin-events", (req, res) => {
  res.send(`
    <html>
    <head>
      <title>Admin Events</title>
      <style>
        body {
          font-family: Arial;
          background:#0f172a;
          color:white;
          padding:20px;
        }
        input, button {
          padding:10px;
          margin:10px 0;
          width:100%;
        }
        button {
          background:#22c55e;
          border:none;
          color:white;
          cursor:pointer;
        }
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

      <br><br>
      <a href="/events" style="color:lightblue;">📦 View Events</a>
    </body>
    </html>
  `);
});

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

// START SERVER
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
