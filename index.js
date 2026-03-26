const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const dataPath = path.join(__dirname, "posts.json");
const questionBank = JSON.parse(fs.readFileSync(dataPath, "utf8"));
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
app.use("/public", express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  res.locals.siteUrl = `http://localhost:${PORT}`;
  next();
});

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

function page({ title, description, body, canonicalPath = "/", jsonLd, breadcrumbs = "" }) {
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
            <a href="/guides">Guides</a>
            <a href="/contact">Contact</a>
            <a href="/about">About</a>
            <a href="/faq">FAQ</a>
            <a href="/privacy">Privacy</a>
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
      const savedKey = "career-question-bank-saved";
      function readSaved(){try{return JSON.parse(localStorage.getItem(savedKey)||"[]");}catch(error){return [];}}
      function writeSaved(items){localStorage.setItem(savedKey, JSON.stringify(items));}
      document.querySelectorAll(".bookmark-button").forEach((button)=>{const saved=readSaved();const key=button.dataset.bookmark;if(saved.includes(key)){button.textContent="Saved";}button.addEventListener("click",()=>{const items=readSaved();if(!items.includes(key)){items.push(key);writeSaved(items);button.textContent="Saved";}});});
      document.querySelectorAll(".copy-answer").forEach((button)=>{button.addEventListener("click",async()=>{const target=document.getElementById(button.dataset.target);if(!target)return;try{await navigator.clipboard.writeText(target.innerText.trim());button.textContent="Copied";}catch(error){button.textContent="Copy failed";}});});
    </script>
  </body>
  </html>`;
}

function notFoundPage(title, message) {
  return page({
    title,
    description: message,
    canonicalPath: "/404",
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
    body: `
      <section class="hero">
        <div class="hero-box">
          <span class="eyebrow">Professional interview preparation</span>
          <h1>Interview questions built for confidence, structure, and company targeting.</h1>
          <p>Browse software, JavaScript, React, Node.js, coding, behavioral, HR, aptitude, resume, and company-specific preparation. The site includes guides, searchable archives, detailed answers, company pages, and practical coaching tips.</p>
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
      <section class="section"><div><h2>Preparation Guides</h2><p>Practical prep guides that make the site more useful than a plain question list.</p></div><a class="text-link" href="/guides">Open all guides</a></section>
      <section class="grid">${guideMarkup}</section>
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
      <section class="section"><div><h2>${results.length} results found</h2><p>Page ${pageState.currentPage} of ${pageState.totalPages}. Last content update: ${escapeHtml(formatDate(dataUpdatedAt))}.</p></div></section>
      <section class="stack">${list}</section>
      ${paginationLinks("/questions", pageState.currentPage, pageState.totalPages, { q, category, sort, reveal: reveal ? 1 : 0 })}`
  }));
});

app.get("/category/:slug", (req, res) => {
  const category = byCategory(req.params.slug);
  if (!category) {
    return res.status(404).send(notFoundPage("Category not found", "The category you requested does not exist."));
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
      <section class="stack">${items}</section>
      ${paginationLinks(categoryUrl(category), pageState.currentPage, pageState.totalPages, {})}
      <section class="section"><div><h2>Related ${escapeHtml(category.kind === "company" ? "Companies" : "Categories")}</h2><p>Move into nearby preparation areas without going back to the full archive.</p></div></section>
      <section class="grid">${relatedCategories}</section>`
  }));
});

app.get("/question/:categorySlug/:questionSlug", (req, res) => {
  const match = byQuestion(req.params.categorySlug, req.params.questionSlug);
  if (!match) {
    return res.status(404).send(notFoundPage("Question not found", "The question you requested does not exist."));
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
        <div class="cta">
          <a class="btn" href="${escapeHtml(categoryUrl(match.category))}">More ${escapeHtml(match.category.title)} questions</a>
          <a class="btn-alt" href="/questions">Back to archive</a>
        </div>
      </article>
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
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Guides" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Guides</div>
        <h1>Preparation guides that make the site more useful.</h1>
        <p>These pages turn the question archive into a fuller interview preparation website by helping candidates practice with better structure.</p>
      </section>
      <section class="grid">${guides.map(guideCard).join("")}</section>`
  }));
});

app.get("/guide/:slug", (req, res) => {
  const guide = byGuide(req.params.slug);
  if (!guide) {
    return res.status(404).send(notFoundPage("Guide not found", "The guide you requested does not exist."));
  }
  const bodyMarkup = guide.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  res.send(page({
    title: guide.title,
    description: guide.summary,
    canonicalPath: guideUrl(guide),
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

app.get("/about", (req, res) => {
  res.send(page({
    title: "About Career Question Bank",
    description: "About the interview preparation library, company-wise question sets, and how to use the site.",
    canonicalPath: "/about",
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "About" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">About</div>
        <h1>Interview preparation with structure, not noise.</h1>
        <p>Career Question Bank is built as a practical interview preparation website. It organizes technical, behavioral, HR, coding, aptitude, resume, and company-specific interview questions into pages that are easy to search, browse, and practice from.</p>
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
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Privacy" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Privacy</div>
        <h1>Privacy policy.</h1>
        <p>This website serves interview preparation content and does not require user accounts to browse the library. Search queries submitted through the site are used only to render results for the current request.</p>
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

function renderContactPage(message = "") {
  return page({
    title: "Contact",
    description: "Contact page for the interview preparation website.",
    canonicalPath: "/contact",
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
  res.send(renderContactPage());
});

app.post("/contact", (req, res) => {
  const name = req.body.name || "Visitor";
  res.send(renderContactPage(`Thanks, ${name}. Your message was received in this demo version of the site.`));
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
  res.status(404).send(notFoundPage("Page not found", "The page you requested does not exist."));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
