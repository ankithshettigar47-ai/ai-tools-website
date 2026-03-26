const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const questionBank = JSON.parse(
  fs.readFileSync(path.join(__dirname, "posts.json"), "utf8")
);

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function allQuestions() {
  return questionBank.flatMap((category) =>
    category.questions.map((item) => ({
      ...item,
      categorySlug: category.slug,
      categoryTitle: category.title,
      categorySummary: category.summary
    }))
  );
}

function byCategory(slug) {
  return questionBank.find((item) => item.slug === slug);
}

function byQuestion(categorySlug, questionSlug) {
  const category = byCategory(categorySlug);
  if (!category) return null;
  const question = category.questions.find((item) => item.slug === questionSlug);
  return question ? { category, question } : null;
}

function searchQuestions(searchTerm, categorySlug) {
  const query = String(searchTerm || "").trim().toLowerCase();
  return allQuestions().filter((item) => {
    const categoryMatch = !categorySlug || item.categorySlug === categorySlug;
    const textMatch =
      !query ||
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query) ||
      item.categoryTitle.toLowerCase().includes(query);
    return categoryMatch && textMatch;
  });
}

function card(item) {
  return `
    <article class="card">
      <div class="eyebrow">${escapeHtml(item.categoryTitle)}</div>
      <h3>${escapeHtml(item.question)}</h3>
      <p>${escapeHtml(item.answer)}</p>
      <a class="text-link" href="/question/${escapeHtml(item.categorySlug)}/${escapeHtml(item.slug)}">Read answer</a>
    </article>
  `;
}

function page({ title, description, body }) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <style>
      :root{--bg:#f6f0e4;--paper:#fffaf2;--ink:#1f2937;--muted:#5b6472;--line:#dccfb5;--brand:#874019;--brand-dark:#5d260c;--accent:#d5a550;--shadow:0 18px 48px rgba(63,38,11,.12)}
      *{box-sizing:border-box}body{margin:0;font-family:Georgia,"Times New Roman",serif;color:var(--ink);background:radial-gradient(circle at top left,rgba(213,165,80,.24),transparent 25%),linear-gradient(180deg,var(--bg),#efe7d7)}
      a{text-decoration:none;color:inherit}.wrap{width:min(1180px,calc(100% - 32px));margin:0 auto}.top{padding:20px 0}.topbar{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:16px 20px;background:rgba(255,250,242,.88);border:1px solid var(--line);border-radius:24px;box-shadow:var(--shadow)}
      .brand small{display:block;color:var(--brand);text-transform:uppercase;letter-spacing:.16em;font-size:.78rem}.brand strong{font-size:1.3rem}.nav{display:flex;gap:14px;flex-wrap:wrap;color:var(--muted)}
      .hero,.grid,.search-form{display:grid;gap:18px}.hero{grid-template-columns:1.4fr 1fr;margin:10px 0 28px}.hero-box,.stat,.card,.panel,.detail{background:rgba(255,250,242,.93);border:1px solid var(--line);border-radius:28px;box-shadow:var(--shadow)}
      .hero-box,.card,.panel,.detail{padding:24px}.hero-box h1,.detail h1{line-height:1.04;margin:14px 0 0}.hero-box h1{font-size:clamp(2.4rem,5vw,4.7rem);max-width:10ch}.detail h1{font-size:clamp(2rem,4vw,3.6rem);max-width:14ch}
      .eyebrow{display:inline-block;color:var(--brand-dark);text-transform:uppercase;letter-spacing:.12em;font-size:.8rem;padding:8px 12px;border-radius:999px;background:rgba(213,165,80,.16)}p{color:var(--muted);line-height:1.7}
      .cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px}.btn,.btn-alt,button{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 18px;border-radius:14px;font-weight:700}
      .btn{background:var(--brand);color:#fffaf2}.btn-alt{border:1px solid var(--line);color:var(--brand-dark)}.side{display:grid;gap:14px}.stat{padding:18px}.stat span{display:block;color:var(--muted);font-size:.78rem;text-transform:uppercase;letter-spacing:.12em}.stat strong{display:block;font-size:2rem;margin-top:8px}
      .section{display:flex;justify-content:space-between;align-items:end;gap:16px;margin:28px 0 16px;flex-wrap:wrap}.section h2,.card h3{margin:0}.grid{grid-template-columns:repeat(3,minmax(0,1fr))}
      .card h3{font-size:1.25rem;margin-top:10px}.text-link{display:inline-block;margin-top:14px;color:var(--brand-dark);font-weight:700}.search-form{grid-template-columns:1.5fr 1fr auto}
      input,select,button{width:100%;font:inherit;min-height:50px;border-radius:14px;border:1px solid var(--line);padding:0 14px;background:#fff}button{background:var(--brand-dark);color:#fffaf2;cursor:pointer}
      .stack{display:grid;gap:16px;margin:16px 0 36px}.answer-box,.tip-box{margin-top:18px;padding:18px;border-radius:18px;border:1px solid var(--line);background:rgba(255,255,255,.7)}footer{padding:0 0 40px;text-align:center;color:var(--muted)}
      @media (max-width:900px){.hero,.grid,.search-form{grid-template-columns:1fr}}
    </style>
  </head>
  <body>
    <header class="top">
      <div class="wrap">
        <div class="topbar">
          <a class="brand" href="/"><small>Interview Prep</small><strong>Career Question Bank</strong></a>
          <nav class="nav">
            <a href="/">Home</a>
            <a href="/questions">All Questions</a>
            <a href="/api/questions">API</a>
          </nav>
        </div>
      </div>
    </header>
    <main class="wrap">${body}</main>
    <footer class="wrap">
      <p>${allQuestions().length} original interview questions across ${questionBank.length} categories.</p>
    </footer>
  </body>
  </html>`;
}

app.get("/", (req, res) => {
  const featured = allQuestions().slice(0, 6)
    .map(card)
    .join("");
  const categories = questionBank.map((category) => `
    <article class="card">
      <div class="eyebrow">${category.questions.length} questions</div>
      <h3>${escapeHtml(category.title)}</h3>
      <p>${escapeHtml(category.summary)}</p>
      <a class="text-link" href="/category/${escapeHtml(category.slug)}">Explore category</a>
    </article>`).join("");

  res.send(page({
    title: "Interview Questions and Answers",
    description: "Interview question bank with categories, search, and answer pages.",
    body: `
      <section class="hero">
        <div class="hero-box">
          <span class="eyebrow">Original interview prep library</span>
          <h1>Interview questions built for real practice.</h1>
          <p>Browse software, JavaScript, React, Node.js, behavioral, and HR interview questions with sample answers and interview tips. This matches the structure of a public interview prep site without copying protected content from another website.</p>
          <div class="cta">
            <a class="btn" href="/questions">Browse all questions</a>
            <a class="btn-alt" href="/category/software-engineering">Start with software engineering</a>
          </div>
        </div>
        <aside class="side">
          <div class="stat"><span>Question library</span><strong>${allQuestions().length}</strong></div>
          <div class="stat"><span>Categories</span><strong>${questionBank.length}</strong></div>
          <div class="stat"><span>Format</span><strong>Question, answer, tip</strong></div>
        </aside>
      </section>
      <section class="section"><div><h2>Categories</h2><p>Each category has a landing page so the site can scale like a full interview portal.</p></div></section>
      <section class="grid">${categories}</section>
      <section class="section"><div><h2>Featured Questions</h2><p>Representative prompts that route users into detailed answer pages.</p></div></section>
      <section class="grid">${featured}</section>`
  }));
});

app.get("/questions", (req, res) => {
  const q = req.query.q || "";
  const category = req.query.category || "";
  const results = searchQuestions(q, category);
  const options = questionBank.map((item) => `<option value="${escapeHtml(item.slug)}" ${item.slug === category ? "selected" : ""}>${escapeHtml(item.title)}</option>`).join("");
  const list = results.length ? results.map(card).join("") : `<article class="panel"><h3>No matching questions found.</h3><p>Try a broader keyword or clear the category filter.</p></article>`;

  res.send(page({
    title: "All Interview Questions",
    description: "Search and filter the interview question archive.",
    body: `
      <section class="section"><div><h1>All Interview Questions</h1><p>Search by topic, role, or phrase. This is the main archive for the full interview library.</p></div></section>
      <section class="panel">
        <form class="search-form" method="GET" action="/questions">
          <input type="text" name="q" value="${escapeHtml(q)}" placeholder="Search interview questions or answers" />
          <select name="category"><option value="">All categories</option>${options}</select>
          <button type="submit">Search</button>
        </form>
      </section>
      <section class="stack">${list}</section>`
  }));
});

app.get("/category/:slug", (req, res) => {
  const category = byCategory(req.params.slug);
  if (!category) {
    return res.status(404).send(page({
      title: "Category not found",
      description: "The requested category does not exist.",
      body: `<section class="panel"><h1>Category not found</h1><p>The category you requested does not exist.</p><a class="btn" href="/questions">Go to all questions</a></section>`
    }));
  }

  const items = category.questions.map((item) =>
    card({ ...item, categorySlug: category.slug, categoryTitle: category.title })
  ).join("");

  return res.send(page({
    title: `${category.title} Interview Questions`,
    description: category.summary,
    body: `
      <section class="detail">
        <div class="eyebrow">Category page</div>
        <h1>${escapeHtml(category.title)}</h1>
        <p>${escapeHtml(category.summary)}</p>
        <div class="cta">
          <a class="btn" href="/questions?category=${escapeHtml(category.slug)}">Filter archive by this category</a>
          <a class="btn-alt" href="/questions">Back to all questions</a>
        </div>
      </section>
      <section class="stack">${items}</section>`
  }));
});

app.get("/question/:categorySlug/:questionSlug", (req, res) => {
  const match = byQuestion(req.params.categorySlug, req.params.questionSlug);
  if (!match) {
    return res.status(404).send(page({
      title: "Question not found",
      description: "The requested question does not exist.",
      body: `<section class="panel"><h1>Question not found</h1><p>The question you requested does not exist.</p><a class="btn" href="/questions">Browse all questions</a></section>`
    }));
  }

  const related = match.category.questions
    .filter((item) => item.slug !== match.question.slug)
    .slice(0, 3)
    .map((item) => `
      <article class="card">
        <div class="eyebrow">Related question</div>
        <h3>${escapeHtml(item.question)}</h3>
        <a class="text-link" href="/question/${escapeHtml(match.category.slug)}/${escapeHtml(item.slug)}">Open answer</a>
      </article>
    `)
    .join("");

  return res.send(page({
    title: `${match.question.question} | ${match.category.title}`,
    description: match.question.answer,
    body: `
      <article class="detail">
        <div class="eyebrow">${escapeHtml(match.category.title)}</div>
        <h1>${escapeHtml(match.question.question)}</h1>
        <p>Use this answer as a practice baseline, then adapt it to your own experience before a real interview.</p>
        <div class="answer-box"><h3>Sample Answer</h3><p>${escapeHtml(match.question.answer)}</p></div>
        <div class="tip-box"><h3>Interview Tip</h3><p>${escapeHtml(match.question.tip)}</p></div>
        <div class="cta">
          <a class="btn" href="/category/${escapeHtml(match.category.slug)}">More ${escapeHtml(match.category.title)} questions</a>
          <a class="btn-alt" href="/questions">Back to archive</a>
        </div>
      </article>
      <section class="section"><div><h2>Related Questions</h2><p>Keep users moving through the category instead of ending on a single page.</p></div></section>
      <section class="grid">${related}</section>`
  }));
});

app.get("/api/questions", (req, res) => {
  const q = req.query.q || "";
  const category = req.query.category || "";
  const results = searchQuestions(q, category);
  res.json({ total: results.length, categories: questionBank.length, results });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
