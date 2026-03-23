const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// File storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Load posts
const DATA_FILE = "posts.json";

function loadPosts() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function savePosts(posts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

// HOME PAGE
app.get("/", (req, res) => {
  const posts = loadPosts();

  let html = `
  <html>
  <head>
    <title>AI Tools Blog</title>
    <style>
      body { font-family: Arial; padding: 20px; background:#f5f5f5; }
      .card { background:white; padding:15px; margin:15px 0; border-radius:10px; }
      img { max-width:100%; border-radius:10px; }
    </style>
  </head>
  <body>
    <h1>🔥 AI Tools Blog</h1>
    <a href="/admin">Admin Panel</a>
  `;

  posts.reverse().forEach(post => {
    html += `
      <div class="card">
        <h2>${post.title}</h2>
        ${post.image ? `<img src="${post.image}" />` : ""}
        <p>${post.content}</p>
      </div>
    `;
  });

  html += "</body></html>";
  res.send(html);
});

// ADMIN PAGE
app.get("/admin", (req, res) => {
  const posts = loadPosts();

  let html = `
  <html>
  <head>
    <title>Admin</title>
  </head>
  <body>
    <h1>Admin Panel</h1>

    <form action="/add" method="post" enctype="multipart/form-data">
      <input name="title" placeholder="Title" required /><br><br>
      <textarea name="content" placeholder="Content" required></textarea><br><br>
      <input type="file" name="image" /><br><br>
      <button type="submit">Add Post</button>
    </form>

    <h2>All Posts</h2>
  `;

  posts.forEach((post, index) => {
    html += `
      <div>
        <b>${post.title}</b>
        <form action="/delete/${index}" method="post" style="display:inline;">
          <button type="submit">Delete</button>
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
  let posts = loadPosts();
  posts.splice(req.params.index, 1);
  savePosts(posts);

  res.redirect("/admin");
});

// START SERVER
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
