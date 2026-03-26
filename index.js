const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { ensureJsonFile, readJson, writeJson } = require("./lib/storage");
const {
  SESSION_COOKIE,
  createSession,
  destroySession,
  expiredSessionCookie,
  getSession,
  hashPassword,
  parseCookies,
  sessionCookie,
  verifyPassword
} = require("./lib/auth");

const app = express();
const PORT = process.env.PORT || 3000;
const ADSENSE_CLIENT = process.env.ADSENSE_CLIENT || "ca-pub-3320175178558120";
const ADSENSE_SLOT = process.env.ADSENSE_SLOT || "1811439645";
const ADSENSE_SLOT_SECONDARY = process.env.ADSENSE_SLOT_SECONDARY || "7526169863";
const dataPath = path.join(__dirname, "posts.json");
const usersPath = path.join(__dirname, "data", "users.json");
const messagesPath = path.join(__dirname, "data", "messages.json");
let questionBank = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const dataUpdatedAt = fs.statSync(dataPath).mtime;

const guides = [
  {
    slug: "hr-interview-guide",
    title: "HR Interview Guide",
    summary: "How to answer HR and general screening questions with clarity and professional tone.",
    body: [
      "Start with direct answers, then support them with one concrete reason or example.",
      "Avoid negative language about previous employers and keep the focus on growth and alignment.",
      "Prepare short answers for strengths, weaknesses, salary expectations, relocation, and reasons for change."
    ]
  },
  {
    slug: "coding-round-guide",
    title: "Coding Round Guide",
    summary: "How to approach coding rounds with structure, correctness, and speed.",
    body: [
      "Clarify the problem, restate the input and output, and walk through a small example before writing code.",
      "Start with the simplest correct approach, then improve it based on constraints.",
      "Always test edge cases aloud and explain time and space complexity before you finish."
    ]
  },
  {
    slug: "company-prep-guide",
    title: "Company Preparation Guide",
    summary: "How to use company-wise question pages to prepare for focused interviews.",
    body: [
      "Use company pages to identify themes such as customer obsession, product thinking, system design, or service delivery readiness.",
      "Do not memorize the sample answers. Rewrite them into your own examples, project outcomes, and decision stories.",
      "Combine company-specific preparation with topic practice in coding, behavioral, and HR sections."
    ]
  },
  {
    slug: "resume-guide",
    title: "Resume Guide",
    summary: "How to align your resume with the interview answers you give.",
    body: [
      "Your resume and interview answers should support each other.",
      "Prefer measurable outcomes over generic responsibility lists.",
      "Be ready to explain every listed project or skill in a practical way."
    ]
  },
  {
    slug: "aptitude-guide",
    title: "Aptitude Preparation Guide",
    summary: "How to prepare for aptitude and reasoning rounds that often appear before interviews.",
    body: [
      "Build speed in percentages, ratios, probability, time and work, and data interpretation through short timed practice.",
      "Track repeated mistake patterns instead of only solving new questions.",
      "Treat aptitude practice as a daily repetition task rather than an occasional long session."
    ]
  }
];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));
ensureJsonFile(usersPath, []);
ensureJsonFile(messagesPath, []);
app.use((req, res, next) => {
  res.locals.siteUrl = `http://localhost:${PORT}`;
  next();
});
app.use((req, res, next) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const session = getSession(cookies[SESSION_COOKIE]);
  const users = readJson(usersPath, []);
  const currentUser = session ? users.find((user) => user.id === session.userId) || null : null;
  req.currentUser = currentUser;
  res.locals.currentUser = currentUser;
  next();
});

function readUsers() {
  const users = readJson(usersPath, []);
  let changed = false;
  users.forEach((user) => {
    if (user.passwordHash === "demo") {
      user.passwordHash = hashPassword("admin123");
      user.savedQuestions = user.savedQuestions || [];
      changed = true;
    }
  });
  if (changed) {
    writeJson(usersPath, users);
  }
  return users;
}

function saveUsers(users) {
  writeJson(usersPath, users);
}

function readMessages() {
  return readJson(messagesPath, []);
}

function saveMessages(messages) {
  writeJson(messagesPath, messages);
}

function saveQuestionBank(nextQuestionBank) {
  questionBank = nextQuestionBank;
  writeJson(dataPath, nextQuestionBank);
}

function requireAuth(req, res) {
  if (req.currentUser) return true;
  res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
  return false;
}

function requireAdmin(req, res) {
  if (req.currentUser && req.currentUser.isAdmin) return true;
  res.status(403).send(notFoundPage("Admin access required", "You do not have permission to access this page.", req.currentUser));
  return false;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

function topicCategories() {
  return questionBank.filter((item) => item.kind !== "company");
}

function companyCategories() {
  return questionBank.filter((item) => item.kind === "company");
}

function allQuestions() {
  return questionBank.flatMap((category, categoryIndex) =>
    category.questions.map((item, questionIndex) => ({
      ...item,
      categorySlug: category.slug,
      categoryTitle: category.title,
      companyName: category.companyName || "",
      companyLogo: category.logo || "",
      roleFocus: category.roleFocus || "",
      orderScore: categoryIndex * 100 + questionIndex
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

function byGuide(slug) {
  return guides.find((item) => item.slug === slug);
}

function categoryUrl(category) {
  return `/category/${category.slug}`;
}

function questionUrl(categorySlug, questionSlug) {
  return `/question/${categorySlug}/${questionSlug}`;
}

function guideUrl(guide) {
  return `/guide/${guide.slug}`;
}

function paginate(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  return { currentPage, totalPages, pageItems: items.slice(start, start + pageSize) };
}

function sortQuestions(items, sortBy) {
  const sorted = [...items];
  if (sortBy === "alpha") {
    sorted.sort((a, b) => a.question.localeCompare(b.question));
  } else if (sortBy === "company") {
    sorted.sort((a, b) => `${a.companyName}${a.categoryTitle}`.localeCompare(`${b.companyName}${b.categoryTitle}`));
  } else if (sortBy === "category") {
    sorted.sort((a, b) => a.categoryTitle.localeCompare(b.categoryTitle) || a.question.localeCompare(b.question));
  } else {
    sorted.sort((a, b) => b.orderScore - a.orderScore);
  }
  return sorted;
}

function searchQuestions(searchTerm, categorySlug, sortBy) {
  const query = String(searchTerm || "").trim().toLowerCase();
  const filtered = allQuestions().filter((item) => {
    const categoryMatch = !categorySlug || item.categorySlug === categorySlug;
    const textMatch =
      !query ||
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query) ||
      item.categoryTitle.toLowerCase().includes(query) ||
      item.companyName.toLowerCase().includes(query) ||
      item.tip.toLowerCase().includes(query);
    return categoryMatch && textMatch;
  });
  return sortQuestions(filtered, sortBy);
}

function buildQuery(basePath, params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function companyLogo(category) {
  if (!category.logo) return "";
  return `<img class="logo" src="${escapeHtml(category.logo)}" alt="${escapeHtml(category.title)} logo" />`;
}

function breadcrumb(items) {
  if (!items || !items.length) return "";
  const markup = items
    .map((item, index) => {
      const isLast = index === items.length - 1;
      if (isLast || !item.href) return `<span>${escapeHtml(item.label)}</span>`;
      return `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`;
    })
    .join("<span>/</span>");
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${markup}</nav>`;
}

function faqItems() {
  return [
    {
      question: "Are these interview answers meant to be memorized?",
      answer: "No. They are practice baselines. The strongest interview answers are adapted to your own projects and outcomes."
    },
    {
      question: "Does the site cover both coding and HR interviews?",
      answer: "Yes. The library includes coding, technical, behavioral, HR, company-specific, aptitude, and resume-focused content."
    },
    {
      question: "How should I use company-wise question pages?",
      answer: "Use them to understand the themes a company tends to emphasize, then adapt the sample answers to your own experience."
    }
  ];
}

function jsonLdForPage({ title, description, path: pagePath }) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `http://localhost:${PORT}${pagePath}`
  });
}

function paginationLinks(basePath, currentPage, totalPages, params) {
  if (totalPages <= 1) return "";
  const links = [];
  if (currentPage > 1) {
    links.push(`<a href="${escapeHtml(buildQuery(basePath, { ...params, page: currentPage - 1 }))}">Previous</a>`);
  }
  for (let page = 1; page <= totalPages; page += 1) {
    if (page === currentPage) {
      links.push(`<span class="active">${page}</span>`);
    } else {
      links.push(`<a href="${escapeHtml(buildQuery(basePath, { ...params, page }))}">${page}</a>`);
    }
  }
  if (currentPage < totalPages) {
    links.push(`<a href="${escapeHtml(buildQuery(basePath, { ...params, page: currentPage + 1 }))}">Next</a>`);
  }
  return `<div class="pagination">${links.join("")}</div>`;
}

function card(item, options = {}) {
  const logoMarkup = item.companyLogo
    ? `<img class="card-logo" src="${escapeHtml(item.companyLogo)}" alt="${escapeHtml(item.categoryTitle)} logo" />`
    : "";
  const companyLabel = item.companyName ? `<span class="chip">${escapeHtml(item.companyName)}</span>` : "";
  const answerMarkup = options.practiceMode
    ? `<p class="answer-hidden">Practice mode is on. Open the detail page to reveal the sample answer.</p>`
    : `<p>${escapeHtml(item.answer)}</p>`;

  return `
    <article class="card">
      <div class="card-top">
        ${logoMarkup}
        <div>
          <div class="eyebrow">${escapeHtml(item.categoryTitle)}</div>
          ${companyLabel}
        </div>
      </div>
      <h3>${escapeHtml(item.question)}</h3>
      ${answerMarkup}
      <div class="card-actions">
        <a class="text-link" href="${escapeHtml(questionUrl(item.categorySlug, item.slug))}">Read answer</a>
        <button type="button" class="ghost-button bookmark-button" data-bookmark="${escapeHtml(`${item.categorySlug}/${item.slug}`)}">Save</button>
      </div>
    </article>
  `;
}

function guideCard(guide) {
  return `
    <article class="card">
      <div class="eyebrow">Preparation guide</div>
      <h3>${escapeHtml(guide.title)}</h3>
      <p>${escapeHtml(guide.summary)}</p>
      <a class="text-link" href="${escapeHtml(guideUrl(guide))}">Open guide</a>
    </article>
  `;
}

function renderAdBlock(label = "Sponsored", slot = ADSENSE_SLOT, variant = "default") {
  if (ADSENSE_CLIENT && slot) {
    return `
      <section class="ad-shell ad-${escapeHtml(variant)}">
        <div class="ad-label">${escapeHtml(label)}</div>
        <ins class="adsbygoogle"
          style="display:block"
          data-ad-client="${escapeHtml(ADSENSE_CLIENT)}"
          data-ad-slot="${escapeHtml(slot)}"
          data-ad-format="auto"
          data-full-width-responsive="true"></ins>
      </section>
    `;
  }

  return `
    <section class="ad-shell ad-${escapeHtml(variant)} ad-placeholder">
      <div class="ad-label">${escapeHtml(label)}</div>
      <p>Free interview preparation. This space is reserved for display ads or sponsor banners.</p>
    </section>
  `;
}

function navAuthMarkup(user) {
  if (!user) {
    return `<a href="/login">Login</a><a href="/register">Register</a>`;
  }
  const adminLink = user.isAdmin ? `<a href="/admin">Admin</a>` : "";
  return `${adminLink}<a href="/logout">Logout</a>`;
}

function page({ title, description, body, canonicalPath = "/", jsonLd, breadcrumbs = "", authLinks = "" }) {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="theme-color" content="#874019" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <link rel="canonical" href="${escapeHtml(`http://localhost:${PORT}${canonicalPath}`)}" />
    <link rel="icon" type="image/svg+xml" href="/public/favicon.svg" />
    <link rel="stylesheet" href="/public/styles.css" />
    ${ADSENSE_CLIENT ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${escapeHtml(ADSENSE_CLIENT)}" crossorigin="anonymous"></script>` : ""}
    <script type="application/ld+json">${jsonLd || jsonLdForPage({ title, description, path: canonicalPath })}</script>
  </head>
  <body>
    <header class="top">
      <div class="wrap">
        <div class="topbar">
          <a class="brand" href="/">
            <img class="brand-mark" src="/public/brand.svg" alt="Career Question Bank" />
            <span><small>Interview Prep</small><strong>Career Question Bank</strong></span>
          </a>
          <nav class="nav">
            <a href="/">Home</a>
            <a href="/questions">All Questions</a>
            <a href="/saved">Saved</a>
            <a href="/guides">Guides</a>
            <a href="/contact">Contact</a>
            <a href="/about">About</a>
            <a href="/faq">FAQ</a>
            <a href="/privacy">Privacy</a>
            ${authLinks}
          </nav>
        </div>
      </div>
    </header>
    <main class="wrap">${breadcrumbs}${body}</main>
    <footer class="wrap">
      <div class="footer-grid">
        <div>
          <strong>Career Question Bank</strong>
          <p class="footer-note">${allQuestions().length} original interview questions across ${questionBank.length} categories.</p>
          <p class="footer-note">Last content update: ${escapeHtml(formatDate(dataUpdatedAt))}</p>
        </div>
        <div class="footer-links">
          <a href="/about">About</a>
          <a href="/faq">FAQ</a>
          <a href="/privacy">Privacy</a>
          <a href="/contact">Contact</a>
        </div>
        <div class="footer-links">
          <a href="/questions">Question Archive</a>
          <a href="/guides">Guides</a>
          <a href="/sitemap.xml">Sitemap</a>
          <a href="/robots.txt">Robots</a>
        </div>
      </div>
    </footer>
    <script>
      ${ADSENSE_CLIENT ? "(adsbygoogle = window.adsbygoogle || []).push({});" : ""}
      const savedKey = "career-question-bank-saved";
      const isLoggedIn = ${authLinks.includes("Logout") ? "true" : "false"};
      function readSaved(){try{return JSON.parse(localStorage.getItem(savedKey)||"[]");}catch(error){return [];}}
      function writeSaved(items){localStorage.setItem(savedKey, JSON.stringify(items));}
      async function syncSaved(key){
        const response = await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key })
        });
        return response.ok;
      }
      document.querySelectorAll(".bookmark-button").forEach((button)=>{const saved=readSaved();const key=button.dataset.bookmark;if(saved.includes(key)){button.textContent="Saved";}button.addEventListener("click",async()=>{if(isLoggedIn){const ok = await syncSaved(key);button.textContent = ok ? "Saved" : "Try again";return;}const items=readSaved();if(!items.includes(key)){items.push(key);writeSaved(items);button.textContent="Saved";}});});
      document.querySelectorAll(".copy-answer").forEach((button)=>{button.addEventListener("click",async()=>{const target=document.getElementById(button.dataset.target);if(!target)return;try{await navigator.clipboard.writeText(target.innerText.trim());button.textContent="Copied";}catch(error){button.textContent="Copy failed";}});});
    </script>
  </body>
  </html>`;
}

function notFoundPage(title, message, user = null) {
  return page({
    title,
    description: message,
    canonicalPath: "/404",
    authLinks: navAuthMarkup(user),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "404" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">404</div>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(message)}</p>
        <div class="cta">
          <a class="btn" href="/questions">Go to all questions</a>
          <a class="btn-alt" href="/">Back home</a>
        </div>
      </section>`
  });
}

app.get("/", (req, res) => {
  const featured = allQuestions().slice(0, 6).map((item) => card(item)).join("");
  const latest = allQuestions().slice(-6).reverse().map((item) => card(item, { practiceMode: true })).join("");
  const categories = topicCategories()
    .map((category) => `
      <article class="card">
        <div class="eyebrow">${category.questions.length} questions</div>
        <h3>${escapeHtml(category.title)}</h3>
        <p>${escapeHtml(category.summary)}</p>
        <a class="text-link" href="${escapeHtml(categoryUrl(category))}">Explore category</a>
      </article>`)
    .join("");
  const companies = companyCategories()
    .slice(0, 6)
    .map((category) => `
      <article class="company-card">
        <div class="company-head">
          ${companyLogo(category)}
          <div>
            <div class="eyebrow">Company wise</div>
            <h3>${escapeHtml(category.title)}</h3>
          </div>
        </div>
        <p>${escapeHtml(category.summary)}</p>
        <div class="meta">
          <span>${category.questions.length} questions</span>
          <span>${escapeHtml(category.roleFocus || "Interview prep")}</span>
        </div>
        <a class="text-link" href="${escapeHtml(categoryUrl(category))}">Open company set</a>
      </article>`)
    .join("");
  const guideMarkup = guides.slice(0, 3).map(guideCard).join("");
  const faqMarkup = faqItems().map((item) => `
    <article class="faq-item">
      <h3>${escapeHtml(item.question)}</h3>
      <p>${escapeHtml(item.answer)}</p>
    </article>`).join("");

  res.send(page({
    title: "Interview Questions and Answers",
    description: "Interview question bank with company pages, preparation guides, search, and answer walkthroughs.",
    canonicalPath: "/",
    authLinks: navAuthMarkup(req.currentUser),
    body: `
      <section class="hero">
        <div class="hero-box">
          <span class="eyebrow">Professional interview preparation</span>
          <h1>Interview questions built for confidence, structure, and company targeting.</h1>
          <p>Browse software, JavaScript, React, Node.js, coding, behavioral, HR, aptitude, resume, and company-specific preparation. Everything is free for visitors, and the website is intended to earn through ads rather than locked content.</p>
          <div class="cta">
            <a class="btn" href="/questions">Browse all questions</a>
            <a class="btn-alt" href="/guides">Open preparation guides</a>
          </div>
          <div class="search-shortcuts">
            <a href="/questions?q=system+design">System design</a>
            <a href="/questions?q=coding">Coding rounds</a>
            <a href="/questions?q=sql">SQL</a>
            <a href="/questions?q=behavioral">Behavioral</a>
            <a href="/questions?q=debugging">Debugging</a>
          </div>
        </div>
        <aside class="side">
          <div class="stat"><span>Question library</span><strong>${allQuestions().length}</strong></div>
          <div class="stat"><span>Categories</span><strong>${questionBank.length}</strong></div>
          <div class="stat"><span>Company tracks</span><strong>${companyCategories().length}</strong></div>
          <div class="stat"><span>Last updated</span><strong>${escapeHtml(formatDate(dataUpdatedAt))}</strong></div>
        </aside>
      </section>
      ${renderAdBlock("Top ad", ADSENSE_SLOT, "hero")}
      <section class="mini-grid">
        <article class="strip"><strong>Structured prep</strong><span>Topic pages, company pages, guides, and detail views.</span></article>
        <article class="strip"><strong>Searchable archive</strong><span>Filter by category, company, keyword, sort order, and page.</span></article>
        <article class="strip"><strong>Practice ready</strong><span>Each question includes a sample answer and a practical tip.</span></article>
        <article class="strip"><strong>Professional basics</strong><span>About, FAQ, privacy, contact, sitemap, and clean 404 handling.</span></article>
      </section>
      <section class="section"><div><h2>Topic Categories</h2><p>Foundation questions for technical, behavioral, HR, coding, and preparation topics.</p></div></section>
      <section class="grid">${categories}</section>
      <section class="section"><div><h2>Featured Companies</h2><p>Company-wise interview sets with local branding and focused preparation themes.</p></div><a class="text-link" href="/questions?sort=company">View all company questions</a></section>
      <section class="company-grid">${companies}</section>
      ${renderAdBlock("Company section ad", ADSENSE_SLOT_SECONDARY, "in-content")}
      <section class="section"><div><h2>Preparation Guides</h2><p>Practical prep guides that make the site more useful than a plain question list.</p></div><a class="text-link" href="/guides">Open all guides</a></section>
      <section class="grid">${guideMarkup}</section>
      ${renderAdBlock("Guide section ad", ADSENSE_SLOT, "in-content")}
      <section class="section"><div><h2>Featured Questions</h2><p>Representative prompts that route users into detailed answer pages.</p></div></section>
      <section class="grid">${featured}</section>
      <section class="section"><div><h2>Latest Questions</h2><p>Recently added or recently surfaced questions in practice mode.</p></div></section>
      <section class="grid">${latest}</section>
      <section class="section"><div><h2>Frequently Asked Questions</h2><p>Short guidance on how to use the library professionally.</p></div><a class="text-link" href="/faq">View all FAQ</a></section>
      <section class="faq-list">${faqMarkup}</section>`
  }));
});

app.get("/questions", (req, res) => {
  const q = req.query.q || "";
  const category = req.query.category || "";
  const sort = req.query.sort || "latest";
  const reveal = req.query.reveal === "1";
  const pageNumber = Number.parseInt(req.query.page || "1", 10);
  const results = searchQuestions(q, category, sort);
  const options = questionBank.map((item) => `<option value="${escapeHtml(item.slug)}" ${item.slug === category ? "selected" : ""}>${escapeHtml(item.title)}</option>`).join("");
  const sortOptions = [
    { value: "latest", label: "Latest" },
    { value: "alpha", label: "Alphabetical" },
    { value: "category", label: "Category" },
    { value: "company", label: "Company" }
  ].map((item) => `<option value="${item.value}" ${item.value === sort ? "selected" : ""}>${item.label}</option>`).join("");
  const pageState = paginate(results, pageNumber, 12);
  const list = pageState.pageItems.length
    ? pageState.pageItems.map((item) => card(item, { practiceMode: !reveal })).join("")
    : `<article class="panel"><h3>No matching questions found.</h3><p>Try a broader keyword or clear the category filter.</p></article>`;

  res.send(page({
    title: "All Interview Questions",
    description: "Search, sort, and paginate the interview question archive.",
    canonicalPath: "/questions",
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "All Questions" }]),
    body: `
      <section class="section"><div><h1>All Interview Questions</h1><p>Search by topic, role, company, or phrase. Sort the archive and use practice mode when you want to hide answers at first.</p></div></section>
      <section class="panel">
        <form class="search-form" method="GET" action="/questions">
          <input type="text" name="q" value="${escapeHtml(q)}" placeholder="Search interview questions, answers, or companies" />
          <select name="category"><option value="">All categories</option>${options}</select>
          <select name="sort">${sortOptions}</select>
          <button type="submit">Search</button>
          <input type="hidden" name="reveal" value="${reveal ? "1" : "0"}" />
        </form>
        <div class="search-shortcuts">
          <a href="${escapeHtml(buildQuery("/questions", { q, category, sort, reveal: reveal ? 0 : 1 }))}">${reveal ? "Enable practice mode" : "Reveal answer previews"}</a>
          <a href="/questions?q=company">Company prep</a>
          <a href="/questions?q=aptitude">Aptitude</a>
          <a href="/questions?q=resume">Resume</a>
          <a href="/questions?q=leadership">Leadership</a>
        </div>
      </section>
      ${renderAdBlock("Archive ad", ADSENSE_SLOT, "archive-top")}
      <section class="section"><div><h2>${results.length} results found</h2><p>Page ${pageState.currentPage} of ${pageState.totalPages}. Last content update: ${escapeHtml(formatDate(dataUpdatedAt))}.</p></div></section>
      <section class="stack">${list}</section>
      ${renderAdBlock("Archive lower ad", ADSENSE_SLOT_SECONDARY, "archive-bottom")}
      ${paginationLinks("/questions", pageState.currentPage, pageState.totalPages, { q, category, sort, reveal: reveal ? 1 : 0 })}`
  }));
});

app.get("/category/:slug", (req, res) => {
  const category = byCategory(req.params.slug);
  if (!category) {
    return res.status(404).send(notFoundPage("Category not found", "The category you requested does not exist.", req.currentUser));
  }

  const pageNumber = Number.parseInt(req.query.page || "1", 10);
  const categoryQuestions = category.questions.map((item) => ({
    ...item,
    categorySlug: category.slug,
    categoryTitle: category.title,
    companyName: category.companyName || "",
    companyLogo: category.logo || "",
    roleFocus: category.roleFocus || ""
  }));
  const pageState = paginate(categoryQuestions, pageNumber, 10);
  const items = pageState.pageItems.map((item) => card(item)).join("");
  const companyMeta = category.kind === "company"
    ? `<div class="meta"><span>${escapeHtml(category.companyName)}</span><span>${escapeHtml(category.roleFocus || "General interview prep")}</span><span>Updated ${escapeHtml(formatDate(dataUpdatedAt))}</span></div>`
    : `<div class="meta"><span>${category.questions.length} questions</span><span>Updated ${escapeHtml(formatDate(dataUpdatedAt))}</span></div>`;
  const relatedCategories = questionBank
    .filter((item) => item.slug !== category.slug && item.kind === category.kind)
    .slice(0, 3)
    .map((item) => `
      <article class="card">
        <div class="eyebrow">${escapeHtml(item.kind === "company" ? "Related company" : "Related category")}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>
        <a class="text-link" href="${escapeHtml(categoryUrl(item))}">Open</a>
      </article>`)
    .join("");

  return res.send(page({
    title: `${category.title} Interview Questions`,
    description: category.summary,
    canonicalPath: categoryUrl(category),
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([
      { label: "Home", href: "/" },
      { label: "All Questions", href: "/questions" },
      { label: category.title }
    ]),
    body: `
      <section class="detail">
        <div class="detail-head">
          ${companyLogo(category)}
          <div>
            <div class="eyebrow">${category.kind === "company" ? "Company page" : "Category page"}</div>
            <h1>${escapeHtml(category.title)}</h1>
          </div>
        </div>
        <p>${escapeHtml(category.summary)}</p>
        ${companyMeta}
        <div class="cta">
          <a class="btn" href="${escapeHtml(buildQuery("/questions", { category: category.slug }))}">Filter archive by this category</a>
          <a class="btn-alt" href="/questions">Back to all questions</a>
        </div>
      </section>
      ${renderAdBlock("Category ad", ADSENSE_SLOT, "category-top")}
      <section class="stack">${items}</section>
      ${renderAdBlock("Category lower ad", ADSENSE_SLOT_SECONDARY, "category-bottom")}
      ${paginationLinks(categoryUrl(category), pageState.currentPage, pageState.totalPages, {})}
      <section class="section"><div><h2>Related ${escapeHtml(category.kind === "company" ? "Companies" : "Categories")}</h2><p>Move into nearby preparation areas without going back to the full archive.</p></div></section>
      <section class="grid">${relatedCategories}</section>`
  }));
});

app.get("/question/:categorySlug/:questionSlug", (req, res) => {
  const match = byQuestion(req.params.categorySlug, req.params.questionSlug);
  if (!match) {
    return res.status(404).send(notFoundPage("Question not found", "The question you requested does not exist.", req.currentUser));
  }

  const related = match.category.questions
    .filter((item) => item.slug !== match.question.slug)
    .slice(0, 3)
    .map((item) => `
      <article class="card">
        <div class="card-top">
          ${match.category.logo ? `<img class="card-logo" src="${escapeHtml(match.category.logo)}" alt="${escapeHtml(match.category.title)} logo" />` : ""}
          <div class="eyebrow">Related question</div>
        </div>
        <h3>${escapeHtml(item.question)}</h3>
        <a class="text-link" href="${escapeHtml(questionUrl(match.category.slug, item.slug))}">Open answer</a>
      </article>
    `)
    .join("");
  const detailCompanyMeta = match.category.companyName
    ? `<div class="meta"><span>${escapeHtml(match.category.companyName)}</span><span>${escapeHtml(match.category.roleFocus || "Company interview set")}</span><span>Updated ${escapeHtml(formatDate(dataUpdatedAt))}</span></div>`
    : `<div class="meta"><span>${escapeHtml(match.category.title)}</span><span>Updated ${escapeHtml(formatDate(dataUpdatedAt))}</span></div>`;
  const relatedGuides = guides.slice(0, 2).map(guideCard).join("");
  const answerId = `answer-${match.category.slug}-${match.question.slug}`;

  return res.send(page({
    title: `${match.question.question} | ${match.category.title}`,
    description: match.question.answer,
    canonicalPath: questionUrl(match.category.slug, match.question.slug),
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([
      { label: "Home", href: "/" },
      { label: "All Questions", href: "/questions" },
      { label: match.category.title, href: categoryUrl(match.category) },
      { label: match.question.question }
    ]),
    body: `
      <article class="detail">
        <div class="detail-head">
          ${companyLogo(match.category)}
          <div>
            <div class="eyebrow">${escapeHtml(match.category.title)}</div>
            <h1>${escapeHtml(match.question.question)}</h1>
          </div>
        </div>
        <p>Use this answer as a practice baseline, then adapt it to your own experience before a real interview.</p>
        ${detailCompanyMeta}
        <div class="answer-box">
          <div class="section compact-section"><div><h3>Sample Answer</h3></div><button type="button" class="ghost-button copy-answer" data-target="${escapeHtml(answerId)}">Copy answer</button></div>
          <p id="${escapeHtml(answerId)}">${escapeHtml(match.question.answer)}</p>
        </div>
        <div class="tip-box"><h3>Interview Tip</h3><p>${escapeHtml(match.question.tip)}</p></div>
        ${renderAdBlock("Question detail ad", ADSENSE_SLOT_SECONDARY, "detail-inline")}
        <div class="cta">
          <a class="btn" href="${escapeHtml(categoryUrl(match.category))}">More ${escapeHtml(match.category.title)} questions</a>
          <a class="btn-alt" href="/questions">Back to archive</a>
        </div>
      </article>
      ${renderAdBlock("Related content ad", ADSENSE_SLOT, "detail-lower")}
      <section class="section"><div><h2>Related Questions</h2><p>Keep moving through the same topic or company prep set.</p></div></section>
      <section class="grid">${related}</section>
      <section class="section"><div><h2>Recommended Guides</h2><p>Use these guides to improve answer quality, not just answer quantity.</p></div></section>
      <section class="grid">${relatedGuides}</section>`
  }));
});

app.get("/guides", (req, res) => {
  res.send(page({
    title: "Interview Preparation Guides",
    description: "Guides for HR, coding rounds, company preparation, resume alignment, and aptitude practice.",
    canonicalPath: "/guides",
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Guides" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Guides</div>
        <h1>Preparation guides that make the site more useful.</h1>
        <p>These pages turn the question archive into a fuller interview preparation website by helping candidates practice with better structure. The content stays free for users and can be monetized through ad placements around the content.</p>
      </section>
      ${renderAdBlock("Guides ad", ADSENSE_SLOT_SECONDARY, "guides-top")}
      <section class="grid">${guides.map(guideCard).join("")}</section>`
  }));
});

app.get("/guide/:slug", (req, res) => {
  const guide = byGuide(req.params.slug);
  if (!guide) {
    return res.status(404).send(notFoundPage("Guide not found", "The guide you requested does not exist.", req.currentUser));
  }
  const bodyMarkup = guide.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  res.send(page({
    title: guide.title,
    description: guide.summary,
    canonicalPath: guideUrl(guide),
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Guides", href: "/guides" }, { label: guide.title }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Preparation guide</div>
        <h1>${escapeHtml(guide.title)}</h1>
        <p>${escapeHtml(guide.summary)}</p>
        <div class="answer-box">${bodyMarkup}</div>
      </section>`
  }));
});

function renderAuthPage(req, config) {
  const errorBox = config.error ? `<div class="answer-box"><p>${escapeHtml(config.error)}</p></div>` : "";
  return page({
    title: config.title,
    description: config.description,
    canonicalPath: config.path,
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: config.title }]),
    body: `
      <section class="detail">
        <div class="eyebrow">${escapeHtml(config.eyebrow)}</div>
        <h1>${escapeHtml(config.heading)}</h1>
        <p>${escapeHtml(config.copy)}</p>
        ${errorBox}
      </section>
      <section class="panel">
        <form class="contact-form" method="POST" action="${escapeHtml(config.path)}">
          ${config.fields}
          <button type="submit">${escapeHtml(config.buttonLabel)}</button>
        </form>
      </section>`
  });
}

app.get("/register", (req, res) => {
  res.send(renderAuthPage(req, {
    title: "Register",
    description: "Create an account to save interview questions and use the site across devices.",
    path: "/register",
    eyebrow: "Account",
    heading: "Create your account.",
    copy: "Register to save questions, keep your preparation in one place, and use the account-backed features of the site.",
    buttonLabel: "Create account",
    fields: `
      <input type="text" name="name" placeholder="Full name" required />
      <input type="text" name="username" placeholder="Username" required />
      <input type="email" name="email" placeholder="Email address" required />
      <input type="password" name="password" placeholder="Password" required />
    `
  }));
});

app.post("/register", (req, res) => {
  const users = readUsers();
  const name = String(req.body.name || "").trim();
  const username = String(req.body.username || "").trim().toLowerCase();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!name || !username || !email || password.length < 6) {
    return res.send(renderAuthPage(req, {
      title: "Register",
      description: "Create an account to save interview questions and use the site across devices.",
      path: "/register",
      eyebrow: "Account",
      heading: "Create your account.",
      copy: "Use a valid name, username, email, and a password with at least 6 characters.",
      buttonLabel: "Create account",
      error: "Please fill every field correctly.",
      fields: `
        <input type="text" name="name" value="${escapeHtml(name)}" placeholder="Full name" required />
        <input type="text" name="username" value="${escapeHtml(username)}" placeholder="Username" required />
        <input type="email" name="email" value="${escapeHtml(email)}" placeholder="Email address" required />
        <input type="password" name="password" placeholder="Password" required />
      `
    }));
  }

  if (users.some((user) => user.username === username || user.email === email)) {
    return res.send(renderAuthPage(req, {
      title: "Register",
      description: "Create an account to save interview questions and use the site across devices.",
      path: "/register",
      eyebrow: "Account",
      heading: "Create your account.",
      copy: "Choose a different username or email address.",
      buttonLabel: "Create account",
      error: "That username or email already exists.",
      fields: `
        <input type="text" name="name" value="${escapeHtml(name)}" placeholder="Full name" required />
        <input type="text" name="username" value="${escapeHtml(username)}" placeholder="Username" required />
        <input type="email" name="email" value="${escapeHtml(email)}" placeholder="Email address" required />
        <input type="password" name="password" placeholder="Password" required />
      `
    }));
  }

  const newUser = {
    id: crypto.randomUUID(),
    name,
    username,
    email,
    passwordHash: hashPassword(password),
    savedQuestions: [],
    isAdmin: false,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  saveUsers(users);
  const token = createSession(newUser.id);
  res.setHeader("Set-Cookie", sessionCookie(token));
  res.redirect("/saved");
});

app.get("/login", (req, res) => {
  res.send(renderAuthPage(req, {
    title: "Login",
    description: "Login to save questions, access your account, and use admin features if available.",
    path: "/login",
    eyebrow: "Account",
    heading: "Login to your account.",
    copy: "Use your username or email and password. The default admin account is admin / admin123.",
    buttonLabel: "Login",
    fields: `
      <input type="text" name="identifier" placeholder="Username or email" required />
      <input type="password" name="password" placeholder="Password" required />
      <input type="hidden" name="next" value="${escapeHtml(req.query.next || "/saved")}" />
    `
  }));
});

app.post("/login", (req, res) => {
  const users = readUsers();
  const identifier = String(req.body.identifier || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const nextPath = String(req.body.next || "/saved");
  const user = users.find((item) => item.username === identifier || item.email === identifier);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.send(renderAuthPage(req, {
      title: "Login",
      description: "Login to save questions, access your account, and use admin features if available.",
      path: "/login",
      eyebrow: "Account",
      heading: "Login to your account.",
      copy: "Check your credentials and try again.",
      buttonLabel: "Login",
      error: "Invalid username/email or password.",
      fields: `
        <input type="text" name="identifier" value="${escapeHtml(identifier)}" placeholder="Username or email" required />
        <input type="password" name="password" placeholder="Password" required />
        <input type="hidden" name="next" value="${escapeHtml(nextPath)}" />
      `
    }));
  }

  const token = createSession(user.id);
  res.setHeader("Set-Cookie", sessionCookie(token));
  res.redirect(nextPath.startsWith("/") ? nextPath : "/saved");
});

app.get("/logout", (req, res) => {
  const cookies = parseCookies(req.headers.cookie || "");
  destroySession(cookies[SESSION_COOKIE]);
  res.setHeader("Set-Cookie", expiredSessionCookie());
  res.redirect("/");
});

app.get("/saved", (req, res) => {
  if (!requireAuth(req, res)) return;
  const savedItems = allQuestions().filter((item) =>
    (req.currentUser.savedQuestions || []).includes(`${item.categorySlug}/${item.slug}`)
  );
  const savedMarkup = savedItems.length
    ? savedItems.map((item) => card(item)).join("")
    : `<article class="panel"><h3>No saved questions yet.</h3><p>Save questions from the archive or detail pages to keep them here.</p></article>`;

  res.send(page({
    title: "Saved Questions",
    description: "Questions saved to your account.",
    canonicalPath: "/saved",
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Saved" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Saved</div>
        <h1>Your saved interview questions.</h1>
        <p>This page stores account-backed saved questions so you can keep preparation progress across devices when logged in.</p>
        <div class="meta"><span>${savedItems.length} saved questions</span><span>${escapeHtml(req.currentUser.username)}</span></div>
      </section>
      <section class="stack">${savedMarkup}</section>`
  }));
});

app.post("/api/saved", (req, res) => {
  if (!req.currentUser) {
    return res.status(401).json({ ok: false, error: "login_required" });
  }
  const key = String(req.body.key || "");
  const users = readUsers();
  const user = users.find((item) => item.id === req.currentUser.id);
  if (!user) {
    return res.status(404).json({ ok: false, error: "user_not_found" });
  }
  user.savedQuestions = user.savedQuestions || [];
  if (!user.savedQuestions.includes(key)) {
    user.savedQuestions.push(key);
  }
  saveUsers(users);
  req.currentUser.savedQuestions = user.savedQuestions;
  return res.json({ ok: true, savedQuestions: user.savedQuestions });
});

app.get("/admin", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const messages = readMessages().slice().reverse();
  const users = readUsers();
  const categoryOptions = questionBank.map((item) => `<option value="${escapeHtml(item.slug)}">${escapeHtml(item.title)}</option>`).join("");
  const messageMarkup = messages.length
    ? messages.slice(0, 12).map((item) => `
      <article class="faq-item">
        <h3>${escapeHtml(item.subject)}</h3>
        <p><strong>${escapeHtml(item.name)}</strong> (${escapeHtml(item.email)})</p>
        <p>${escapeHtml(item.message)}</p>
      </article>`).join("")
    : `<article class="panel"><h3>No messages yet.</h3></article>`;

  res.send(page({
    title: "Admin Dashboard",
    description: "Manage categories, questions, users, and contact messages.",
    canonicalPath: "/admin",
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Admin" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Admin</div>
        <h1>Content and account management.</h1>
        <p>Use this dashboard to add categories, add questions, review user accounts, and read contact messages.</p>
        <div class="meta">
          <span>${questionBank.length} categories</span>
          <span>${allQuestions().length} questions</span>
          <span>${users.length} users</span>
          <span>${messages.length} messages</span>
        </div>
      </section>
      <section class="grid">
        <article class="panel">
          <h3>Add Category</h3>
          <form class="contact-form" method="POST" action="/admin/category">
            <input type="text" name="title" placeholder="Category title" required />
            <input type="text" name="slug" placeholder="category-slug" required />
            <input type="text" name="summary" placeholder="Summary" required />
            <select name="kind">
              <option value="topic">Topic</option>
              <option value="company">Company</option>
            </select>
            <input type="text" name="companyName" placeholder="Company name (optional)" />
            <input type="text" name="roleFocus" placeholder="Role focus (optional)" />
            <input type="text" name="logo" placeholder="/public/logos/company.png (optional)" />
            <button type="submit">Create category</button>
          </form>
        </article>
        <article class="panel">
          <h3>Add Question</h3>
          <form class="contact-form" method="POST" action="/admin/question">
            <select name="categorySlug">${categoryOptions}</select>
            <input type="text" name="slug" placeholder="question-slug" required />
            <input type="text" name="question" placeholder="Question" required />
            <textarea name="answer" rows="6" placeholder="Answer" required></textarea>
            <input type="text" name="tip" placeholder="Tip" required />
            <button type="submit">Create question</button>
          </form>
        </article>
      </section>
      <section class="section"><div><h2>Recent Messages</h2><p>Latest contact submissions stored by the backend.</p></div></section>
      <section class="faq-list">${messageMarkup}</section>`
  }));
});

app.post("/admin/category", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const title = String(req.body.title || "").trim();
  const slug = String(req.body.slug || "").trim();
  const summary = String(req.body.summary || "").trim();
  if (!title || !slug || !summary) {
    return res.redirect("/admin");
  }
  if (questionBank.some((item) => item.slug === slug)) {
    return res.redirect("/admin");
  }
  const nextCategory = {
    slug,
    title,
    summary,
    kind: req.body.kind === "company" ? "company" : "topic",
    companyName: String(req.body.companyName || "").trim(),
    roleFocus: String(req.body.roleFocus || "").trim(),
    logo: String(req.body.logo || "").trim(),
    questions: []
  };
  saveQuestionBank([...questionBank, nextCategory]);
  res.redirect(`/category/${encodeURIComponent(slug)}`);
});

app.post("/admin/question", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const categorySlug = String(req.body.categorySlug || "");
  const category = byCategory(categorySlug);
  if (!category) {
    return res.redirect("/admin");
  }
  const nextQuestion = {
    slug: String(req.body.slug || "").trim(),
    question: String(req.body.question || "").trim(),
    answer: String(req.body.answer || "").trim(),
    tip: String(req.body.tip || "").trim()
  };
  if (!nextQuestion.slug || !nextQuestion.question || !nextQuestion.answer || !nextQuestion.tip) {
    return res.redirect("/admin");
  }
  if (category.questions.some((item) => item.slug === nextQuestion.slug)) {
    return res.redirect(`/category/${encodeURIComponent(category.slug)}`);
  }
  const nextQuestionBank = questionBank.map((item) =>
    item.slug === category.slug
      ? { ...item, questions: [...item.questions, nextQuestion] }
      : item
  );
  saveQuestionBank(nextQuestionBank);
  res.redirect(questionUrl(category.slug, nextQuestion.slug));
});

app.get("/about", (req, res) => {
  res.send(page({
    title: "About Career Question Bank",
    description: "About the interview preparation library, company-wise question sets, and how to use the site.",
    canonicalPath: "/about",
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "About" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">About</div>
        <h1>Interview preparation with structure, not noise.</h1>
        <p>Career Question Bank is built as a practical interview preparation website. It organizes technical, behavioral, HR, coding, aptitude, resume, and company-specific interview questions into pages that are easy to search, browse, and practice from. The product is designed to stay free to visitors and support monetization through advertising.</p>
        <div class="meta">
          <span>${allQuestions().length} questions</span>
          <span>${topicCategories().length} topic categories</span>
          <span>${companyCategories().length} company pages</span>
        </div>
      </section>
      <section class="mini-grid">
        <article class="strip"><strong>Original practice answers</strong><span>Each answer is written as a practice baseline rather than copied interview content.</span></article>
        <article class="strip"><strong>Company-focused prep</strong><span>Dedicated sets help candidates prepare by theme, company, and role emphasis.</span></article>
        <article class="strip"><strong>Usable archive</strong><span>Search, category filters, related questions, pagination, and API output support discovery.</span></article>
        <article class="strip"><strong>Built for iteration</strong><span>The site structure is simple enough to keep expanding with more companies and questions.</span></article>
      </section>`
  }));
});

app.get("/faq", (req, res) => {
  const items = faqItems().map((item) => `
    <article class="faq-item">
      <h3>${escapeHtml(item.question)}</h3>
      <p>${escapeHtml(item.answer)}</p>
    </article>`).join("");
  res.send(page({
    title: "Interview FAQ",
    description: "Frequently asked questions about using the interview question bank and practicing effectively.",
    canonicalPath: "/faq",
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "FAQ" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">FAQ</div>
        <h1>How to use the question bank well.</h1>
        <p>These answers explain how to get real value from the site instead of reading passively.</p>
      </section>
      <section class="faq-list">${items}</section>`
  }));
});

app.get("/privacy", (req, res) => {
  res.send(page({
    title: "Privacy Policy",
    description: "Simple privacy page for the interview preparation website.",
    canonicalPath: "/privacy",
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Privacy" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Privacy</div>
        <h1>Privacy policy.</h1>
        <p>This website serves interview preparation content and does not require user accounts to browse the library. Search queries submitted through the site are used only to render results for the current request. Advertising may be used to support the website while keeping content free for visitors.</p>
        <div class="answer-box">
          <h3>What this means in practice</h3>
          <p>No sign-up flow is required to access the content, and there is no custom profile or resume storage in the current version of the website.</p>
        </div>
        <div class="tip-box">
          <h3>Future updates</h3>
          <p>If features such as accounts, saved questions, or analytics are added later, this page should be updated to reflect those changes clearly.</p>
        </div>
      </section>`
  }));
});

function renderContactPage(user, message = "") {
  return page({
    title: "Contact",
    description: "Contact page for the interview preparation website.",
    canonicalPath: "/contact",
    authLinks: navAuthMarkup(user),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Contact" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Contact</div>
        <h1>Reach out about the website.</h1>
        <p>Use this page for feedback, partnership ideas, or suggestions for new interview categories and company pages.</p>
        ${message ? `<div class="answer-box"><p>${escapeHtml(message)}</p></div>` : ""}
      </section>
      <section class="panel">
        <form class="contact-form" method="POST" action="/contact">
          <input type="text" name="name" placeholder="Your name" required />
          <input type="email" name="email" placeholder="Email address" required />
          <input type="text" name="subject" placeholder="Subject" required />
          <textarea name="message" rows="6" placeholder="Write your message" required></textarea>
          <button type="submit">Send message</button>
        </form>
      </section>`
  });
}

app.get("/contact", (req, res) => {
  res.send(renderContactPage(req.currentUser));
});

app.post("/contact", (req, res) => {
  const name = req.body.name || "Visitor";
  const messages = readMessages();
  messages.push({
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: String(req.body.email || "").trim(),
    subject: String(req.body.subject || "").trim() || "Website message",
    message: String(req.body.message || "").trim(),
    createdAt: new Date().toISOString()
  });
  saveMessages(messages);
  res.send(renderContactPage(req.currentUser, `Thanks, ${name}. Your message was received and stored.`));
});

app.get("/api/questions", (req, res) => {
  const q = req.query.q || "";
  const category = req.query.category || "";
  const sort = req.query.sort || "latest";
  const results = searchQuestions(q, category, sort);
  res.json({ total: results.length, categories: questionBank.length, results });
});

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(`User-agent: *
Allow: /
Sitemap: ${res.locals.siteUrl}/sitemap.xml
`);
});

app.get("/sitemap.xml", (req, res) => {
  const urls = [
    "/",
    "/questions",
    "/guides",
    "/about",
    "/faq",
    "/privacy",
    "/contact",
    ...guides.map((guide) => guideUrl(guide)),
    ...questionBank.map((category) => categoryUrl(category)),
    ...questionBank.flatMap((category) => category.questions.map((question) => questionUrl(category.slug, question.slug)))
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${res.locals.siteUrl}${escapeHtml(url)}</loc></url>`).join("\n")}
</urlset>`;
  res.type("application/xml").send(xml);
});

app.use((req, res) => {
  res.status(404).send(notFoundPage("Page not found", "The page you requested does not exist.", req.currentUser));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
