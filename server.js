const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// 📁 Setup upload folder
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 📄 Data file
const DATA_FILE = 'posts.json';
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

function getPosts() {
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function savePosts(posts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

// 🏠 HOME PAGE
app.get('/', (req, res) => {
  const posts = getPosts().reverse();

  let html = `
  <html>
  <head>
    <title>AI Tools Hub</title>
    <meta name="description" content="Best AI tools, apps and earning methods">
    <style>
      body {margin:0; font-family:sans-serif; background:#0f172a; color:white;}
      .topbar {display:flex; justify-content:space-between; padding:15px; background:#020617;}
      .container {max-width:1100px; margin:auto; padding:20px;}
      .grid {display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:20px;}
      .card {background:#1e293b; padding:15px; border-radius:12px;}
      img {width:100%; border-radius:10px;}
      a {color:#38bdf8; text-decoration:none;}
      .btn {display:inline-block; margin-top:10px; padding:6px 10px; background:#2563eb; border-radius:6px;}
    </style>
  </head>
  <body>

  <div class="topbar">
    <div>🚀 AI Tools Hub</div>
    <a href="/admin">Admin</a>
  </div>

  <div class="container">
    <div class="grid">
  `;

  posts.forEach((p, i) => {
    html += `
      <div class="card">
        ${p.image ? `<img src="/uploads/${p.image}">` : ''}
        <h3>${p.title}</h3>
        <p>${p.content.substring(0,100)}...</p>
        <a href="/post/${i}" class="btn">Read</a>
        <br><br>
        <a href="/delete/${i}" style="color:red;">Delete</a>
      </div>
    `;
  });

  html += `</div></div></body></html>`;
  res.send(html);
});

// 📄 FULL POST
app.get('/post/:id', (req, res) => {
  const posts = getPosts();
  const post = posts[req.params.id];

  if (!post) return res.send("Post not found");

  res.send(`
    <html>
    <head>
      <title>${post.title}</title>
      <meta name="description" content="${post.content.substring(0,150)}">
      <style>
        body {background:#0f172a; color:white; font-family:sans-serif; padding:20px;}
        img {max-width:100%;}
      </style>
    </head>
    <body>
      <a href="/">⬅ Back</a>
      <h1>${post.title}</h1>
      ${post.image ? `<img src="/uploads/${post.image}">` : ''}
      <p>${post.content}</p>
    </body>
    </html>
  `);
});

// 🧠 ADMIN PANEL (WITH IMAGE UPLOAD)
app.get('/admin', (req, res) => {
  res.send(`
    <html>
    <body style="background:#0f172a;color:white;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;">
      <form action="/add" method="POST" enctype="multipart/form-data" style="background:#1e293b;padding:20px;border-radius:10px;width:350px;">
        <h2>Add Post</h2>
        <input name="title" placeholder="Title" required style="width:100%;padding:8px;"><br><br>
        <textarea name="content" placeholder="Content" required style="width:100%;padding:8px;"></textarea><br><br>
        <input type="file" name="image"><br><br>
        <button style="width:100%;padding:10px;background:#2563eb;color:white;">Publish</button>
      </form>
    </body>
    </html>
  `);
});

// ➕ ADD POST
app.post('/add', upload.single('image'), (req, res) => {
  const posts = getPosts();

  posts.push({
    title: req.body.title,
    content: req.body.content,
    image: req.file ? req.file.filename : null
  });

  savePosts(posts);
  res.redirect('/');
});

// ❌ DELETE POST
app.get('/delete/:id', (req, res) => {
  let posts = getPosts();
  posts.splice(req.params.id, 1);
  savePosts(posts);
  res.redirect('/');
});

// 🚀 START SERVER
app.listen(PORT, () => {
  console.log(`🔥 Running on http://localhost:${PORT}`);
});