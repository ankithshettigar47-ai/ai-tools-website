const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// ---------------- HOME ----------------
app.get("/", (req, res) => {
  res.send(`
  <html>
  <head>
    <title>AI Tools Hub</title>

    <!-- AdSense -->
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3320175178558120"
     crossorigin="anonymous"></script>

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
      .container {
        padding:20px;
      }
      .card {
        background:#1e293b;
        padding:20px;
        margin:15px 0;
        border-radius:10px;
      }
      .btn {
        background:#22c55e;
        padding:8px 12px;
        text-decoration:none;
        color:white;
        border-radius:5px;
      }
    </style>
  </head>

  <body>

    <div class="nav">
      <div>🤖 AI Tools Hub</div>
      <div>
        <a href="/tools">AI Tools</a>
        <a href="/shortcuts">Shortcuts</a>
      </div>
    </div>

    <div class="container">
      <h1>🔥 Best AI Tools & Shortcuts</h1>

      <div class="card">
        <h2>🚀 Explore AI Tools</h2>
        <p>Find best tools for productivity, design & coding</p>
        <a class="btn" href="/tools">View Tools</a>
      </div>

      <div class="card">
        <h2>⌨️ Learn Shortcuts</h2>
        <p>Boost speed using keyboard shortcuts</p>
        <a class="btn" href="/shortcuts">View Shortcuts</a>
      </div>
    </div>

  </body>
  </html>
  `);
});


// ---------------- AI TOOLS PAGE ----------------
app.get("/tools", (req, res) => {
  res.send(`
  <html>
  <head>
    <title>AI Tools</title>

    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3320175178558120"
     crossorigin="anonymous"></script>

    <style>
      body { font-family: Arial; background:#0f172a; color:white; padding:20px; }
      .card { background:#1e293b; padding:15px; margin:15px 0; border-radius:10px; }
      a { color:#22c55e; }
    </style>
  </head>

  <body>
    <h1>🤖 Best AI Tools</h1>

    <div class="card">
      <h2>ChatGPT</h2>
      <p>AI chatbot for writing, coding & answers</p>
      <a href="https://chat.openai.com" target="_blank">Visit</a>
    </div>

    <div class="card">
      <h2>Canva AI</h2>
      <p>Create designs with AI easily</p>
      <a href="https://www.canva.com" target="_blank">Visit</a>
    </div>

    <div class="card">
      <h2>Remove.bg</h2>
      <p>Remove image background instantly</p>
      <a href="https://www.remove.bg" target="_blank">Visit</a>
    </div>

    <!-- Ad -->
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="ca-pub-3320175178558120"
         data-ad-slot="1811439645"
         data-ad-format="auto"></ins>

    <script>
      (adsbygoogle = window.adsbygoogle || []).push({});
    </script>

  </body>
  </html>
  `);
});


// ---------------- SHORTCUTS PAGE ----------------
app.get("/shortcuts", (req, res) => {
  res.send(`
  <html>
  <head>
    <title>Shortcuts</title>

    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3320175178558120"
     crossorigin="anonymous"></script>

    <style>
      body { font-family: Arial; background:#0f172a; color:white; padding:20px; }
      .card { background:#1e293b; padding:15px; margin:15px 0; border-radius:10px; }
    </style>
  </head>

  <body>
    <h1>⌨️ Keyboard Shortcuts</h1>

    <div class="card">
      <h3>Windows Shortcuts</h3>
      <p>Copy → Ctrl + C</p>
      <p>Paste → Ctrl + V</p>
      <p>Undo → Ctrl + Z</p>
    </div>

    <div class="card">
      <h3>VS Code Shortcuts</h3>
      <p>Command Palette → Ctrl + Shift + P</p>
      <p>New File → Ctrl + N</p>
      <p>Search → Ctrl + F</p>
    </div>

    <!-- Ad -->
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="ca-pub-3320175178558120"
         data-ad-slot="1811439645"
         data-ad-format="auto"></ins>

    <script>
      (adsbygoogle = window.adsbygoogle || []).push({});
    </script>

  </body>
  </html>
  `);
});


// ---------------- START ----------------
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});