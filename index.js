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
const SITE_URL = String(process.env.SITE_URL || "").trim().replace(/\/+$/, "");
const ADSENSE_CLIENT = process.env.ADSENSE_CLIENT || "ca-pub-3320175178558120";
const ADSENSE_SLOT = process.env.ADSENSE_SLOT || "1811439645";
const ADSENSE_SLOT_SECONDARY = process.env.ADSENSE_SLOT_SECONDARY || "7526169863";
const dataPath = path.join(__dirname, "posts.json");
const researchedDataPath = path.join(__dirname, "researched_questions.json");
const usersPath = path.join(__dirname, "data", "users.json");
const messagesPath = path.join(__dirname, "data", "messages.json");
let questionBank = [];
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
ensureJsonFile(researchedDataPath, []);
app.use((req, res, next) => {
  res.locals.siteUrl = resolveSiteUrl(req);
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
      user.progress = user.progress || {};
      changed = true;
    }
    if (!user.progress) {
      user.progress = {};
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
  writeJson(dataPath, nextQuestionBank);
  reloadQuestionBank();
}

function reloadQuestionBank() {
  const primaryQuestions = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const researchedQuestions = JSON.parse(fs.readFileSync(researchedDataPath, "utf8"));
  questionBank = [...primaryQuestions, ...researchedQuestions];
}

reloadQuestionBank();

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

function resolveSiteUrl(req) {
  if (SITE_URL) return SITE_URL;
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const protocol = forwardedProto || req.protocol || "http";
  const forwardedHost = String(req.headers["x-forwarded-host"] || "").split(",")[0].trim();
  const host = forwardedHost || req.headers.host || `localhost:${PORT}`;
  return `${protocol}://${host}`;
}

function absoluteUrl(siteUrl, pagePath = "/") {
  return `${siteUrl}${pagePath.startsWith("/") ? pagePath : `/${pagePath}`}`;
}

function truncateText(text = "", maxLength = 160) {
  const cleaned = String(text).replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

function simpleDisplayText(text = "") {
  return String(text)
    .replace(/\butilize\b/gi, "use")
    .replace(/\binitialize\b/gi, "start")
    .replace(/\bmaintain\b/gi, "keep")
    .replace(/\bcompute\b/gi, "find")
    .replace(/\bdetermine\b/gi, "find out")
    .replace(/\boptimize\b/gi, "make it faster")
    .replace(/\brecursively\b/gi, "by calling the same function again")
    .replace(/\bsubsequent\b/gi, "next")
    .replace(/\btherefore\b/gi, "so")
    .replace(/\bapproximately\b/gi, "about")
    .replace(/\badditional\b/gi, "extra")
    .replace(/\bmaximum\b/gi, "largest")
    .replace(/\bminimum\b/gi, "smallest")
    .replace(/\bcontiguous\b/gi, "continuous")
    .replace(/\biterate\b/gi, "go through")
    .replace(/\bprefix\b/gi, "running")
    .replace(/\bvalidate\b/gi, "check")
    .replace(/\s+/g, " ")
    .trim();
}

function classifyQuestion(category, question) {
  const source = `${category.title} ${category.companyName || ""} ${question.question} ${question.answer} ${question.tip} ${question.solution || ""} ${question.code || ""}`.toLowerCase();
  const tags = new Set();

  if (category.kind === "company") tags.add("company");
  if (source.includes("code") || source.includes("algorithm") || source.includes("data structure") || source.includes("complexity")) tags.add("coding");
  if (source.includes("design") || source.includes("architecture") || source.includes("api") || source.includes("scale")) tags.add("system-design");
  if (source.includes("behavior") || source.includes("conflict") || source.includes("team") || source.includes("lead") || source.includes("feedback")) tags.add("behavioral");
  if (source.includes("salary") || source.includes("relocation") || source.includes("company") || source.includes("hire") || category.slug === "hr") tags.add("hr");
  if (source.includes("debug") || source.includes("bug") || source.includes("incident")) tags.add("debugging");
  if (source.includes("fresher") || source.includes("intern") || source.includes("graduate")) tags.add("fresher");
  if (source.includes("sql") || source.includes("database") || source.includes("query")) tags.add("database");
  if (source.includes("react")) tags.add("react");
  if (source.includes("javascript")) tags.add("javascript");
  if (source.includes("node")) tags.add("nodejs");
  if (!tags.size) tags.add(category.kind === "company" ? "company-prep" : "technical");

  return Array.from(tags).slice(0, 4);
}

function isCodingQuestion(category, question, existingTags = null) {
  const tags = existingTags || classifyQuestion(category, question);
  return tags.includes("coding") || Boolean(question.solution || question.code) || /^coding-/.test(category.slug);
}

function codingPatterns(category, question) {
  const slug = String(category.slug || "").toLowerCase();
  const source = `${category.title} ${question.question} ${question.answer} ${question.solution || ""}`.toLowerCase();
  const patterns = [];

  if (slug.includes("hash-map") || source.includes("hash map")) patterns.push("Hash Map");
  if (slug.includes("sliding-window") || source.includes("sliding window")) patterns.push("Sliding Window");
  if (slug.includes("two-pointer") || source.includes("two pointer")) patterns.push("Two Pointer");
  if (slug.includes("stack") || slug.includes("queue") || source.includes("stack") || source.includes("queue")) patterns.push("Stack/Queue");
  if (slug.includes("binary-search") || source.includes("binary search")) patterns.push("Binary Search");
  if (slug.includes("linked-list") || source.includes("linked list")) patterns.push("Linked List");
  if (slug.includes("tree") || source.includes("binary tree") || source.includes("bst")) patterns.push("Tree");
  if (slug.includes("graph") || source.includes("graph") || source.includes("bfs")) patterns.push("Graph/BFS");
  if (slug.includes("dp") || source.includes("dynamic programming") || source.includes("recurrence")) patterns.push("Dynamic Programming");
  if (slug.includes("backtracking") || source.includes("backtrack")) patterns.push("Backtracking");

  return patterns.slice(0, 3);
}

function codingDifficulty(category, question) {
  if (!isCodingQuestion(category, question)) return "";
  const source = `${category.title} ${question.question} ${question.answer} ${question.solution || ""}`.toLowerCase();

  if (
    source.includes("word ladder") ||
    source.includes("n-queens") ||
    source.includes("edit distance") ||
    source.includes("minimum window substring") ||
    source.includes("open the lock") ||
    source.includes("pacific atlantic")
  ) {
    return "Hard";
  }

  if (
    source.includes("graph") ||
    source.includes("dynamic programming") ||
    source.includes("binary search on the answer") ||
    source.includes("linked list") ||
    source.includes("three sum") ||
    source.includes("combination")
  ) {
    return "Medium";
  }

  return "Easy";
}

function topicCategories() {
  return questionBank.filter((item) => item.kind !== "company");
}

function companyCategories() {
  return questionBank.filter((item) => item.kind === "company");
}

function allQuestions() {
  return questionBank.flatMap((category, categoryIndex) =>
    category.questions.map((item, questionIndex) => {
      const tags = classifyQuestion(category, item);
      return {
        ...item,
        categorySlug: category.slug,
        categoryTitle: category.title,
        companyName: category.companyName || "",
        companyLogo: category.logo || "",
        roleFocus: category.roleFocus || "",
        tags,
        isCoding: isCodingQuestion(category, item, tags),
        patterns: codingPatterns(category, item),
        difficulty: codingDifficulty(category, item),
        companyTags: [],
        estimatedMinutes: 0,
        mustKnow: false,
        orderScore: categoryIndex * 100 + questionIndex
      };
    })
  ).map((item) => ({
    ...item,
    companyTags: codingCompanyTags(item),
    estimatedMinutes: codingEstimatedMinutes(item),
    mustKnow: isMustKnowProblem(item)
  }));
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

function searchQuestions(searchTerm, categorySlug, sortBy, tagFilter = "", codingOnly = false, patternFilter = "", difficultyFilter = "") {
  const query = String(searchTerm || "").trim().toLowerCase();
  const normalizedTag = String(tagFilter || "").trim().toLowerCase();
  const normalizedPattern = String(patternFilter || "").trim().toLowerCase();
  const normalizedDifficulty = String(difficultyFilter || "").trim().toLowerCase();
  const filtered = allQuestions().filter((item) => {
    const categoryMatch = !categorySlug || item.categorySlug === categorySlug;
    const tagMatch = !normalizedTag || item.tags.includes(normalizedTag);
    const codingMatch = !codingOnly || item.isCoding;
    const patternMatch = !normalizedPattern || item.patterns.some((pattern) => pattern.toLowerCase() === normalizedPattern);
    const difficultyMatch = !normalizedDifficulty || String(item.difficulty || "").toLowerCase() === normalizedDifficulty;
    const textMatch =
      !query ||
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query) ||
      String(item.solution || "").toLowerCase().includes(query) ||
      String(item.code || "").toLowerCase().includes(query) ||
      item.categoryTitle.toLowerCase().includes(query) ||
      item.companyName.toLowerCase().includes(query) ||
      item.tip.toLowerCase().includes(query);
    return categoryMatch && tagMatch && codingMatch && patternMatch && difficultyMatch && textMatch;
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
      answer: "No. Use them for practice. The best answer is one that matches your own work, project, or real experience."
    },
    {
      question: "Does the site cover both coding and HR interviews?",
      answer: "Yes. The site covers coding, technical, behavioral, HR, company-wise, aptitude, and resume topics."
    },
    {
      question: "How should I use company-wise question pages?",
      answer: "Use them to understand what a company usually asks. Then change the sample answers so they fit your own experience."
    }
  ];
}

function searchSuggestionTerms() {
  const base = [
    "google interview questions",
    "amazon interview questions",
    "react interview questions",
    "node.js interview questions",
    "hr interview questions",
    "behavioral interview questions",
    "coding interview questions",
    "system design interview questions"
  ];
  const dynamic = questionBank.flatMap((category) => [
    category.title,
    category.companyName || "",
    ...category.questions.slice(0, 2).map((item) => item.question)
  ]);
  return [...new Set([...base, ...dynamic].filter(Boolean))].slice(0, 120);
}

const tagOptions = [
  { value: "", label: "All rounds" },
  { value: "company", label: "Company" },
  { value: "coding", label: "Coding" },
  { value: "system-design", label: "System Design" },
  { value: "behavioral", label: "Behavioral" },
  { value: "hr", label: "HR" },
  { value: "debugging", label: "Debugging" },
  { value: "fresher", label: "Fresher" },
  { value: "database", label: "Database" }
];

const codingPatternOptions = [
  { value: "", label: "All coding patterns" },
  { value: "Hash Map", label: "Hash Map" },
  { value: "Sliding Window", label: "Sliding Window" },
  { value: "Two Pointer", label: "Two Pointer" },
  { value: "Stack/Queue", label: "Stack/Queue" },
  { value: "Binary Search", label: "Binary Search" },
  { value: "Linked List", label: "Linked List" },
  { value: "Tree", label: "Tree" },
  { value: "Graph/BFS", label: "Graph/BFS" },
  { value: "Dynamic Programming", label: "Dynamic Programming" },
  { value: "Backtracking", label: "Backtracking" }
];

const difficultyOptions = [
  { value: "", label: "All difficulty levels" },
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" }
];

const seoLandingPages = [
  {
    slug: "google-interview-questions",
    title: "Google Interview Questions and Answers",
    heading: "Google Interview Questions",
    description: "Practice Google interview questions and answers across coding, technical, behavioral, and role-fit preparation.",
    intro: "Use this page to prepare for common Google interview themes like coding problem solving, product thinking, system design, debugging, and concise behavioral answers.",
    query: "google",
    links: ["/coding/company/google-interview-questions", "/category/google-interview-questions", "/coding"]
  },
  {
    slug: "amazon-interview-questions",
    title: "Amazon Interview Questions and Answers",
    heading: "Amazon Interview Questions",
    description: "Practice Amazon interview questions and answers with coding, leadership principles, technical, and behavioral preparation.",
    intro: "Use this page to prepare for Amazon interview themes like ownership, customer obsession, coding rounds, debugging, and practical system tradeoffs.",
    query: "amazon",
    links: ["/coding/company/amazon-interview-questions", "/category/amazon-interview-questions", "/coding"]
  },
  {
    slug: "coding-interview-questions",
    title: "Coding Interview Questions and Solutions",
    heading: "Coding Interview Questions",
    description: "Browse coding interview questions with solutions, JavaScript reference code, pattern filters, and difficulty filters.",
    intro: "Use the coding archive to practice by pattern, difficulty, must-know problems, and timed mock-test sets.",
    query: "coding",
    links: ["/coding", "/coding/mock-test", "/questions?coding=1&difficulty=Medium"]
  },
  {
    slug: "hr-interview-questions",
    title: "HR Interview Questions and Answers",
    heading: "HR Interview Questions",
    description: "Prepare for HR interview questions and answers with practical examples for screening, motivation, strengths, weaknesses, and salary discussions.",
    intro: "Use this page when you want clear HR and screening answers that sound natural instead of memorized.",
    query: "hr",
    links: ["/questions?tag=hr", "/guide/hr-interview-guide", "/questions?q=behavioral"]
  },
  {
    slug: "react-interview-questions",
    title: "React Interview Questions and Answers",
    heading: "React Interview Questions",
    description: "Practice React interview questions and answers for components, hooks, state management, rendering, and frontend problem solving.",
    intro: "This landing page routes you into React interview preparation with technical questions and detailed answer pages.",
    query: "react",
    links: ["/questions?q=react", "/category/react", "/questions?q=frontend"]
  },
  {
    slug: "node-js-interview-questions",
    title: "Node.js Interview Questions and Answers",
    heading: "Node.js Interview Questions",
    description: "Prepare for Node.js interview questions and answers covering APIs, async behavior, backend design, and debugging.",
    intro: "Use this page to move quickly into Node.js backend interview prep with practical answer pages and related coding practice.",
    query: "node",
    links: ["/questions?q=node", "/category/node-js", "/questions?q=api"]
  }
];

function formatTag(tag) {
  return String(tag || "")
    .split("-")
    .map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part)
    .join(" ");
}

function codingLandingData() {
  const codingItems = allQuestions().filter((item) => item.isCoding);
  const byPattern = codingItems.reduce((acc, item) => {
    (item.patterns || []).forEach((pattern) => {
      acc[pattern] = (acc[pattern] || 0) + 1;
    });
    return acc;
  }, {});
  const byDifficulty = codingItems.reduce((acc, item) => {
    const difficulty = item.difficulty || "Easy";
    acc[difficulty] = (acc[difficulty] || 0) + 1;
    return acc;
  }, {});
  return { codingItems, byPattern, byDifficulty };
}

function topCodingCompanyLinks(limit = 6) {
  const preferred = ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix", "Adobe", "Oracle"];
  return preferred
    .map((name) => questionBank.find((item) => item.kind === "company" && item.companyName === name))
    .filter(Boolean)
    .slice(0, limit);
}

function codingCollectionForCompany(companyName) {
  const allCoding = allQuestions().filter((item) => item.isCoding);
  const preferredPatterns = {
    Google: ["Graph/BFS", "Dynamic Programming", "Binary Search", "Tree"],
    Amazon: ["Hash Map", "Sliding Window", "Graph/BFS", "Dynamic Programming"],
    Microsoft: ["Tree", "Linked List", "Dynamic Programming", "Graph/BFS"],
    Meta: ["Hash Map", "Graph/BFS", "Sliding Window", "Tree"],
    Apple: ["Binary Search", "Linked List", "Tree", "Dynamic Programming"],
    Netflix: ["Graph/BFS", "Dynamic Programming", "Backtracking", "Sliding Window"],
    Adobe: ["Hash Map", "Two Pointer", "Dynamic Programming", "Tree"],
    Oracle: ["Binary Search", "Linked List", "Tree", "Graph/BFS"]
  };
  const patterns = preferredPatterns[companyName] || ["Hash Map", "Binary Search", "Dynamic Programming"];
  return allCoding
    .filter((item) => item.mustKnow || item.companyTags.includes(companyName) || item.patterns.some((pattern) => patterns.includes(pattern)))
    .slice(0, 18);
}

function mockPresetSet(codingItems, preset) {
  if (preset === "faang-medium") {
    return codingItems
      .filter((item) => item.difficulty === "Medium" && ["Hash Map", "Sliding Window", "Graph/BFS", "Dynamic Programming", "Tree"].some((pattern) => item.patterns.includes(pattern)))
      .slice(0, 6);
  }
  if (preset === "sixty") {
    return codingItems.filter((item) => item.difficulty !== "Easy").slice(0, 8);
  }
  return codingItems.filter((item) => item.difficulty !== "Easy").slice(0, 5);
}

function codingCompanyTags(item) {
  const companyNames = topCodingCompanyLinks(8).map((company) => company.companyName);
  const source = `${item.question} ${item.answer} ${item.solution || ""} ${item.categoryTitle} ${item.companyName || ""}`.toLowerCase();
  return companyNames.filter((name) => source.includes(name.toLowerCase())).slice(0, 3);
}

function codingEstimatedMinutes(item) {
  if (!item.isCoding) return 0;
  if (item.difficulty === "Hard") return 40;
  if (item.difficulty === "Medium") return 25;
  return 15;
}

function isMustKnowProblem(item) {
  if (!item.isCoding) return false;
  const source = `${item.question} ${item.answer} ${item.solution || ""}`.toLowerCase();
  return (
    source.includes("two sum") ||
    source.includes("binary search") ||
    source.includes("reverse linked list") ||
    source.includes("valid parentheses") ||
    source.includes("maximum depth of binary tree") ||
    source.includes("number of islands") ||
    source.includes("climbing stairs") ||
    source.includes("subsets")
  );
}

function questionSignals(category, question) {
  const lower = `${question.question} ${question.answer} ${question.tip}`.toLowerCase();
  const signals = [];

  if (category.kind === "company") signals.push("whether you fit the way the company works");
  if (lower.includes("debug") || lower.includes("bug")) signals.push("whether you can solve problems calmly");
  if (lower.includes("design") || lower.includes("architecture")) signals.push("whether you can think about choices and tradeoffs");
  if (lower.includes("lead") || lower.includes("team") || lower.includes("conflict")) signals.push("whether you work well with other people");
  if (lower.includes("code") || lower.includes("algorithm") || lower.includes("data structure")) signals.push("whether your technical thinking is clear and correct");
  if (lower.includes("why") || lower.includes("motivat") || lower.includes("company")) signals.push("whether your reason sounds honest and strong");
  if (lower.includes("priorit") || lower.includes("deadline") || lower.includes("pressure")) signals.push("whether you can make good decisions under pressure");
  if (!signals.length) signals.push("clear thinking and clear speaking");

  return signals.slice(0, 3);
}

function answerFlow(category, question) {
  const title = category.companyName || category.title;
  return [
    `Start with one direct sentence that answers the question.`,
    `Then add one real example from your work, studies, or project that fits ${title}.`,
    `End by showing the result, what you learned, or why your answer fits the role.`
  ];
}

function interviewerReadyAnswer(category, question) {
  return [
    `A good way to answer this is to start with a short clear answer, then explain it in simple words.`,
    simpleDisplayText(question.answer),
    `If the interviewer asks more, give one short real example instead of repeating the same line again.`
  ];
}

function detailedAnswerMarkup(category, question) {
  const answerParts = interviewerReadyAnswer(category, question)
    .map((part) => `<p>${escapeHtml(part)}</p>`)
    .join("");
  const flow = answerFlow(category, question)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  const signals = questionSignals(category, question)
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  const exampleAnswer = truncateText(`${question.answer} ${question.tip}`, 340);
  const commonMistakes = [
    "Giving a very general answer without a real example.",
    "Trying to sound memorized instead of sounding natural.",
    "Moving away from the real question."
  ].map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const followUps = [
    `Can you give one real example?`,
    `What was the hard part?`,
    `Why does this matter for this role or company?`
  ].map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const solutionBox = question.solution
    ? `
      <div class="answer-box">
        <h3>Simple Step-By-Step Solution</h3>
        <p>${escapeHtml(simpleDisplayText(question.solution))}</p>
      </div>`
    : "";
  const codeBox = question.code
    ? `
      <div class="answer-box">
        <div class="code-box-head">
          <h3>Reference Code</h3>
          <button type="button" class="ghost-button copy-snippet" data-target="code-${escapeHtml(`${category.slug}-${question.slug}`)}">Copy code</button>
        </div>
        <pre class="code-block" id="code-${escapeHtml(`${category.slug}-${question.slug}`)}"><code>${escapeHtml(question.code)}</code></pre>
      </div>`
    : "";

  return `
    <section class="detail-layout">
      <div class="detail-main">
        <div class="answer-box">
          <div class="section compact-section">
            <div><h3>Simple Answer</h3></div>
          </div>
          ${answerParts}
        </div>
        <div class="tip-box">
          <h3>Easy Tip</h3>
          <p>${escapeHtml(simpleDisplayText(question.tip))}</p>
        </div>
        <div class="answer-box">
          <h3>Simple Way To Say It</h3>
          <p>${escapeHtml(simpleDisplayText(exampleAnswer))}</p>
        </div>
        ${solutionBox}
        ${codeBox}
      </div>
      <aside class="detail-sidebar">
        <section class="detail-panel">
          <h3>How To Answer</h3>
          <ol class="step-list">${flow}</ol>
        </section>
        <section class="detail-panel">
          <h3>What The Interviewer Wants To Know</h3>
          <ul class="step-list">${signals}</ul>
        </section>
        <section class="detail-panel">
          <h3>Common Mistakes</h3>
          <ul class="step-list">${commonMistakes}</ul>
        </section>
        <section class="detail-panel">
          <h3>Possible Next Questions</h3>
          <ul class="step-list">${followUps}</ul>
        </section>
      </aside>
    </section>`;
}

function webPageSchema({ title, description, siteUrl, path: pagePath, type = "WebPage" }) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    name: title,
    description,
    url: absoluteUrl(siteUrl, pagePath)
  };
}

function organizationSchema(siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Career Question Bank",
    url: siteUrl,
    logo: absoluteUrl(siteUrl, "/public/brand.svg")
  };
}

function websiteSchema(siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Career Question Bank",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/questions?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

function breadcrumbSchema(items, siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href ? absoluteUrl(siteUrl, item.href) : undefined
    }))
  };
}

function faqSchema(items, siteUrl, pagePath) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: absoluteUrl(siteUrl, pagePath),
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };
}

function itemListSchema({ title, description, items, siteUrl, pagePath }) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: absoluteUrl(siteUrl, pagePath),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(siteUrl, item.url),
        name: item.name
      }))
    }
  };
}

function questionSchema(match, siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    url: absoluteUrl(siteUrl, questionUrl(match.category.slug, match.question.slug)),
    mainEntity: {
      "@type": "Question",
      name: match.question.question,
      text: match.question.question,
      answerCount: 1,
      about: match.category.title,
      acceptedAnswer: {
        "@type": "Answer",
        text: match.question.answer
      }
    }
  };
}

function structuredDataMarkup(nodes) {
  const filtered = (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean);
  if (!filtered.length) return "";
  if (filtered.length === 1) {
    return `<script type="application/ld+json">${JSON.stringify(filtered[0])}</script>`;
  }
  const graph = {
    "@context": "https://schema.org",
    "@graph": filtered.map((item) => {
      const nextItem = { ...item };
      delete nextItem["@context"];
      return nextItem;
    })
  };
  return `<script type="application/ld+json">${JSON.stringify(graph)}</script>`;
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
  const summaryLabel = item.companyName || item.categoryTitle;
  const previewId = `preview-${escapeHtml(`${item.categorySlug}-${item.slug}`)}`;
  const progressKey = `${item.categorySlug}/${item.slug}`;
  const tagMarkup = (item.tags || []).slice(0, 3).map((tag) => `<span>${escapeHtml(formatTag(tag))}</span>`).join("");
  const codingMeta = item.isCoding
    ? `
      <div class="coding-meta">
        ${item.difficulty ? `<span class="coding-badge">${escapeHtml(item.difficulty)}</span>` : ""}
        ${(item.patterns || []).slice(0, 2).map((pattern) => `<span class="coding-badge">${escapeHtml(pattern)}</span>`).join("")}
        ${item.estimatedMinutes ? `<span class="coding-badge">${escapeHtml(`${item.estimatedMinutes} min`)}</span>` : ""}
        ${item.mustKnow ? `<span class="coding-badge coding-badge-warm">Must know</span>` : ""}
        ${item.solution ? `<span class="coding-badge">Has solution</span>` : ""}
        ${item.code ? `<span class="coding-badge">Has code</span>` : ""}
      </div>`
    : "";
  const companyTagMarkup = item.isCoding && item.companyTags && item.companyTags.length
    ? `<div class="coding-company-tags">${item.companyTags.map((name) => `<span class="chip">${escapeHtml(name)}</span>`).join("")}</div>`
    : "";
  const answerMarkup = options.practiceMode
    ? `<p class="answer-hidden">Practice mode is on. Open the detail page to reveal the sample answer.</p>`
    : `
      <div class="card-answer" id="${previewId}" hidden>
        <p>${escapeHtml(simpleDisplayText(item.answer))}</p>
      </div>`;

  return `
    <article class="card question-card">
      <div class="card-top">
        ${logoMarkup}
        <div class="card-heading">
          <div class="eyebrow">${escapeHtml(item.categoryTitle)}</div>
          ${companyLabel}
        </div>
      </div>
      <h3>${escapeHtml(item.question)}</h3>
      <div class="card-meta">
        <span>${escapeHtml(summaryLabel)}</span>
        <span>${escapeHtml(item.roleFocus || "Interview prep")}</span>
      </div>
      ${codingMeta}
      ${companyTagMarkup}
      ${tagMarkup ? `<div class="tag-row">${tagMarkup}</div>` : ""}
      ${answerMarkup}
      <div class="card-actions">
        <a class="text-link" href="${escapeHtml(questionUrl(item.categorySlug, item.slug))}">Read answer</a>
        ${options.practiceMode ? "" : `<button type="button" class="ghost-button answer-toggle" data-target="${previewId}" aria-expanded="false">Quick preview</button>`}
        <button type="button" class="ghost-button progress-button" data-progress="${escapeHtml(progressKey)}" data-status="practiced">Practiced</button>
        <button type="button" class="ghost-button progress-button" data-progress="${escapeHtml(progressKey)}" data-status="revise">Revise</button>
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

function publicNavLinks() {
  return `
    <a href="/">Home</a>
    <a href="/questions">Questions</a>
    <a href="/coding">Coding</a>
    <a href="/companies">Companies</a>
    <a href="/guides">Guides</a>
    <a href="/progress">Progress</a>
  `;
}

function page({
  title,
  description,
  body,
  canonicalPath = "/",
  structuredData,
  breadcrumbs = "",
  authLinks = "",
  siteUrl,
  robots = "index,follow",
  ogType = "website"
}) {
  const resolvedSiteUrl = siteUrl || SITE_URL || `http://localhost:${PORT}`;
  const canonicalUrl = absoluteUrl(resolvedSiteUrl, canonicalPath);
  const schemaMarkup = structuredDataMarkup(
    structuredData || [webPageSchema({ title, description, siteUrl: resolvedSiteUrl, path: canonicalPath })]
  );
  const searchOptions = searchSuggestionTerms()
    .map((item) => `<option value="${escapeHtml(item)}"></option>`)
    .join("");
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="${escapeHtml(robots)}" />
    <meta name="googlebot" content="${escapeHtml(robots)}" />
    <meta name="theme-color" content="#874019" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="${escapeHtml(ogType)}" />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:site_name" content="Career Question Bank" />
    <meta property="og:image" content="${escapeHtml(absoluteUrl(resolvedSiteUrl, "/public/brand.svg"))}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(absoluteUrl(resolvedSiteUrl, "/public/brand.svg"))}" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <link rel="icon" type="image/svg+xml" href="/public/favicon.svg" />
    <link rel="stylesheet" href="/public/styles.css" />
    ${ADSENSE_CLIENT ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${escapeHtml(ADSENSE_CLIENT)}" crossorigin="anonymous"></script>` : ""}
    ${schemaMarkup}
  </head>
  <body>
    <header class="top">
      <div class="wrap">
        <div class="topbar">
          <a class="brand" href="/">
            <img class="brand-mark" src="/public/brand.svg" alt="Career Question Bank" />
            <span><small>Interview Prep</small><strong>Career Question Bank</strong></span>
          </a>
          <button type="button" class="nav-toggle" aria-expanded="false" aria-controls="site-nav">Menu</button>
          <nav class="nav" id="site-nav">
            ${publicNavLinks()}
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
          <a href="/terms">Terms</a>
          <a href="/progress">Progress</a>
        </div>
        <div class="footer-links">
          <a href="/questions">Question Archive</a>
          <a href="/guides">Guides</a>
          <a href="/editorial-policy">Editorial Policy</a>
          <a href="/ad-disclosure">Ad Disclosure</a>
          <a href="/sitemap.xml">Sitemap</a>
          <a href="/robots.txt">Robots</a>
        </div>
      </div>
    </footer>
    <datalist id="search-suggestions">${searchOptions}</datalist>
    <script>
      ${ADSENSE_CLIENT ? "document.querySelectorAll('.adsbygoogle').forEach((ad)=>{try{(adsbygoogle = window.adsbygoogle || []).push({});}catch(error){console.error('AdSense render failed', error, ad);}});" : ""}
      const savedKey = "career-question-bank-saved";
      const progressKey = "career-question-bank-progress";
      const isLoggedIn = ${authLinks.includes("Logout") ? "true" : "false"};
      const navToggle = document.querySelector(".nav-toggle");
      const nav = document.getElementById("site-nav");
      if(navToggle && nav){navToggle.addEventListener("click",()=>{const expanded=navToggle.getAttribute("aria-expanded")==="true";navToggle.setAttribute("aria-expanded",String(!expanded));nav.classList.toggle("open",!expanded);});}
      function readSaved(){try{return JSON.parse(localStorage.getItem(savedKey)||"[]");}catch(error){return [];}}
      function writeSaved(items){localStorage.setItem(savedKey, JSON.stringify(items));}
      function readProgress(){try{return JSON.parse(localStorage.getItem(progressKey)||"{}");}catch(error){return {};}}
      function writeProgress(items){localStorage.setItem(progressKey, JSON.stringify(items));}
      function readJsonStorage(key, fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch(error){return fallback;}}
      function writeJsonStorage(key, value){localStorage.setItem(key, JSON.stringify(value));}
      function codingProgressSummary(){
        const progress = readProgress();
        const values = Object.values(progress);
        return {
          practiced: values.filter((value)=>value==="practiced").length,
          revise: values.filter((value)=>value==="revise").length,
          total: values.length
        };
      }
      function updateCodingStreak(status){
        if(status!=="practiced") return;
        const streakKey="career-question-bank-coding-streak";
        const today=new Date().toISOString().slice(0,10);
        const streak=readJsonStorage(streakKey,{days:[],best:0,current:0});
        if(!streak.days.includes(today)){streak.days.push(today);}
        streak.days.sort();
        let current=0;
        const cursor=new Date();
        for(let index=0; index<3650; index+=1){
          const day=cursor.toISOString().slice(0,10);
          if(streak.days.includes(day)){current+=1; cursor.setDate(cursor.getDate()-1);}
          else{break;}
        }
        streak.current=current;
        streak.best=Math.max(streak.best||0,current);
        writeJsonStorage(streakKey, streak);
      }
      function currentCodingStreak(){
        const streak=readJsonStorage("career-question-bank-coding-streak",{days:[],best:0,current:0});
        return { current: streak.current||0, best: streak.best||0, activeDays: (streak.days||[]).length };
      }
      function patternProgressSummary(){
        const progress = readProgress();
        const summary = {};
        document.querySelectorAll("[data-pattern-name]").forEach((node)=>{
          const pattern=node.dataset.patternName;
          const keys=(node.dataset.patternKeys||"").split("|").filter(Boolean);
          const practiced=keys.filter((key)=>progress[key]==="practiced").length;
          const revise=keys.filter((key)=>progress[key]==="revise").length;
          summary[pattern]={ practiced, revise, total: keys.length, remaining: Math.max(keys.length-practiced,0), percent: keys.length ? Math.round((practiced/keys.length)*100) : 0 };
        });
        return summary;
      }
      function refreshCodingDashboard(){
        const codingStats=document.querySelector("[data-coding-stats]");
        if(codingStats){
          const summary=codingProgressSummary();
          const streak=currentCodingStreak();
          codingStats.innerHTML='<span>'+summary.practiced+' practiced</span><span>'+summary.revise+' marked for revision</span><span>'+summary.total+' tracked items</span><span>'+streak.current+' day streak</span><span>'+streak.best+' best streak</span>';
        }
        document.querySelectorAll("[data-pattern-name]").forEach((node)=>{
          const pattern=node.dataset.patternName;
          const stats=patternProgressSummary()[pattern];
          if(stats){
            const target=node.querySelector("[data-pattern-stats]");
            const bar=node.querySelector("[data-pattern-bar]");
            if(target){target.textContent=stats.practiced+' solved • '+stats.remaining+' remaining • '+stats.percent+'%';}
            if(bar){bar.style.width=stats.percent+'%';}
          }
        });
        const weakAreas=document.querySelector("[data-weak-areas]");
        if(weakAreas){
          const progressSummary=patternProgressSummary();
          const weak=Object.entries(progressSummary)
            .sort((a,b)=>((b[1].revise-b[1].practiced)-(a[1].revise-a[1].practiced)))
            .slice(0,3)
            .filter((entry)=>entry[1].revise>0);
          weakAreas.innerHTML=weak.length
            ? weak.map(([name,meta])=>'<a href="/questions?coding=1&pattern='+encodeURIComponent(name)+'">'+name+' • '+meta.revise+' revise flags</a>').join('')
            : '<span>No weak areas yet. Mark problems for revision to get recommendations.</span>';
        }
      }
      async function syncSaved(key){
        const response = await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key })
        });
        return response.ok;
      }
      async function syncProgress(key,status){
        const response = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, status })
        });
        return response.ok;
      }
      document.querySelectorAll(".bookmark-button").forEach((button)=>{const saved=readSaved();const key=button.dataset.bookmark;if(saved.includes(key)){button.textContent="Saved";}button.addEventListener("click",async()=>{if(isLoggedIn){const ok = await syncSaved(key);button.textContent = ok ? "Saved" : "Try again";return;}const items=readSaved();if(!items.includes(key)){items.push(key);writeSaved(items);button.textContent="Saved";}});});
      document.querySelectorAll(".progress-button").forEach((button)=>{const key=button.dataset.progress;const status=button.dataset.status;const progress=readProgress();if(progress[key]===status){button.classList.add("is-active");}button.addEventListener("click",async()=>{const items=readProgress();items[key]=status;writeProgress(items);updateCodingStreak(status);document.querySelectorAll('.progress-button[data-progress=\"'+key+'\"]').forEach((peer)=>peer.classList.toggle('is-active', peer.dataset.status===status));if(isLoggedIn){const ok = await syncProgress(key,status);if(!ok){button.textContent='Retry';}}const codingStats=document.querySelector("[data-coding-stats]");if(codingStats){const summary=codingProgressSummary();const streak=currentCodingStreak();codingStats.innerHTML='<span>'+summary.practiced+' practiced</span><span>'+summary.revise+' marked for revision</span><span>'+summary.total+' tracked items</span><span>'+streak.current+' day streak</span><span>'+streak.best+' best streak</span>';}document.querySelectorAll("[data-pattern-name]").forEach((node)=>{const pattern=node.dataset.patternName;const next=patternProgressSummary()[pattern];if(next){const target=node.querySelector("[data-pattern-stats]");if(target){target.textContent=next.practiced+' solved • '+next.remaining+' remaining';}}});});});
      document.querySelectorAll(".answer-toggle").forEach((button)=>{button.addEventListener("click",()=>{const target=document.getElementById(button.dataset.target);if(!target)return;const nextState=target.hasAttribute("hidden");target.toggleAttribute("hidden",!nextState);button.setAttribute("aria-expanded",String(nextState));button.textContent=nextState?\"Hide preview\":\"Quick preview\";});});
      document.querySelectorAll(".copy-answer").forEach((button)=>{button.addEventListener("click",async()=>{const target=document.getElementById(button.dataset.target);if(!target)return;try{await navigator.clipboard.writeText(target.innerText.trim());button.textContent="Copied";}catch(error){button.textContent="Copy failed";}});});
      document.querySelectorAll(".copy-snippet").forEach((button)=>{button.addEventListener("click",async()=>{const target=document.getElementById(button.dataset.target);if(!target)return;try{await navigator.clipboard.writeText(target.innerText.trim());button.textContent="Copied";}catch(error){button.textContent="Copy failed";}});});
      document.querySelectorAll(".progress-button").forEach((button)=>{button.addEventListener("click",()=>{setTimeout(refreshCodingDashboard,0);});});
      const codingStats=document.querySelector("[data-coding-stats]");
      if(codingStats){
        const summary=codingProgressSummary();
        const streak=currentCodingStreak();
        codingStats.innerHTML='<span>'+summary.practiced+' practiced</span><span>'+summary.revise+' marked for revision</span><span>'+summary.total+' tracked items</span><span>'+streak.current+' day streak</span><span>'+streak.best+' best streak</span>';
      }
      document.querySelectorAll("[data-pattern-name]").forEach((node)=>{const pattern=node.dataset.patternName;const stats=patternProgressSummary()[pattern];if(stats){const target=node.querySelector("[data-pattern-stats]");if(target){target.textContent=stats.practiced+' solved • '+stats.remaining+' remaining';}}});
      refreshCodingDashboard();
      const mockTimer=document.querySelector("[data-mock-timer]");
      const mockStart=document.querySelector("[data-mock-start]");
      const mockFinish=document.querySelector("[data-mock-finish]");
      const mockPause=document.querySelector("[data-mock-pause]");
      if(mockTimer && mockStart && mockFinish){
        const mockStateKey="career-question-bank-mock-test";
        let remaining=0;
        let intervalId=null;
        function renderTimer(){
          const minutes=String(Math.floor(remaining/60)).padStart(2,'0');
          const seconds=String(remaining%60).padStart(2,'0');
          mockTimer.textContent=minutes+':'+seconds;
        }
        function persist(active){
          writeJsonStorage(mockStateKey,{ remaining, active, updatedAt: Date.now() });
        }
        mockStart.addEventListener('click',()=>{
          remaining=Number(mockStart.dataset.seconds||'1800');
          clearInterval(intervalId);
          renderTimer();
          persist(true);
          intervalId=setInterval(()=>{
            remaining=Math.max(0, remaining-1);
            renderTimer();
            persist(true);
            if(remaining===0){
              clearInterval(intervalId);
              mockTimer.textContent='Time complete';
              persist(false);
            }
          },1000);
        });
        if(mockPause){mockPause.addEventListener('click',()=>{clearInterval(intervalId);persist(false);mockTimer.textContent='Paused at '+mockTimer.textContent;});}
        mockFinish.addEventListener('click',()=>{
          clearInterval(intervalId);
          mockTimer.textContent='Session finished';
          localStorage.removeItem(mockStateKey);
        });
        const savedMock=readJsonStorage(mockStateKey,null);
        if(savedMock && savedMock.remaining){
          remaining=savedMock.remaining;
          renderTimer();
          mockTimer.textContent=(savedMock.active?'Resumed ':'Saved ')+mockTimer.textContent;
          if(savedMock.active){
            intervalId=setInterval(()=>{
              remaining=Math.max(0, remaining-1);
              renderTimer();
              persist(true);
              if(remaining===0){
                clearInterval(intervalId);
                mockTimer.textContent='Time complete';
                persist(false);
              }
            },1000);
          }
        }
      }
    </script>
  </body>
  </html>`;
}

function notFoundPage(title, message, user = null) {
  return page({
    title,
    description: message,
    canonicalPath: "/404",
    robots: "noindex,nofollow",
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
  const homeFaq = faqItems();
  const codingFeatured = allQuestions().filter((item) => item.isCoding).slice(0, 3).map((item) => card(item, { practiceMode: true })).join("");
  const companyFeatured = companyCategories().slice(0, 4)
    .map((category) => `
      <article class="company-card">
        <div class="company-head">
          ${companyLogo(category)}
          <div>
            <div class="eyebrow">Company prep</div>
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
  const latest = allQuestions().slice(-4).reverse().map((item) => card(item, { practiceMode: true })).join("");
  const searchHighlights = [
    { label: "Google", href: "/questions?q=google" },
    { label: "Amazon", href: "/questions?q=amazon" },
    { label: "Coding", href: "/coding" },
    { label: "HR", href: "/questions?q=hr" },
    { label: "Behavioral", href: "/questions?q=behavioral" },
    { label: "Freshers", href: "/questions?q=freshers" }
  ].map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`).join("");
  const guideMarkup = guides.slice(0, 3).map(guideCard).join("");
  const laneMarkup = [
    {
      title: "Coding Practice",
      text: "Solve structured coding problems with pattern filters, difficulty filters, solutions, code, and mock tests.",
      href: "/coding",
      cta: "Open coding lane"
    },
    {
      title: "Company-Wise Prep",
      text: "Prepare for Google, Amazon, Microsoft, TCS, Infosys, and other companies with focused interview pages.",
      href: "/companies",
      cta: "Browse companies"
    },
    {
      title: "HR And Interview Answers",
      text: "Use searchable question pages for HR, behavioral, technical, and general interview preparation.",
      href: "/questions?tag=hr",
      cta: "Open answer library"
    }
  ].map((item) => `
    <a class="lane-card" href="${escapeHtml(item.href)}">
      <span class="eyebrow">Start here</span>
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.text)}</span>
      <em>${escapeHtml(item.cta)}</em>
    </a>`).join("");
  const faqMarkup = homeFaq.map((item) => `
    <article class="faq-item">
      <h3>${escapeHtml(item.question)}</h3>
      <p>${escapeHtml(item.answer)}</p>
    </article>`).join("");

  res.send(page({
    title: "Interview Questions and Answers for Freshers, HR, Coding, and Top Companies",
    description: "Free interview questions and answers for freshers, coding rounds, HR interviews, behavioral interviews, and top companies like Google, Amazon, Microsoft, TCS, Infosys, and more.",
    canonicalPath: "/",
    siteUrl: res.locals.siteUrl,
    structuredData: [
      webPageSchema({
        title: "Interview Questions and Answers for Freshers, HR, Coding, and Top Companies",
        description: "Free interview questions and answers with company-wise interview prep, coding questions, and HR interview guidance.",
        siteUrl: res.locals.siteUrl,
        path: "/"
      }),
      organizationSchema(res.locals.siteUrl),
      websiteSchema(res.locals.siteUrl),
      faqSchema(homeFaq, res.locals.siteUrl, "/"),
      itemListSchema({
        title: "Featured Interview Question Categories",
        description: "Featured topic and company interview preparation categories.",
        siteUrl: res.locals.siteUrl,
        pagePath: "/",
        items: questionBank.slice(0, 10).map((category) => ({
          name: category.title,
          url: categoryUrl(category)
        }))
      })
    ],
    authLinks: navAuthMarkup(req.currentUser),
    body: `
      <section class="hero">
        <div class="hero-box">
          <span class="eyebrow">Interview questions and answers</span>
          <h1>Prepare faster with clear paths for coding, company interviews, and HR answers.</h1>
          <p>Career Question Bank is a free interview preparation website. It has coding problems, company interview pages, HR answers, guides, progress tracking, and mock tests. The content is free for visitors and the website earns through ads.</p>
          <form class="hero-search" method="GET" action="/questions">
            <input type="text" name="q" list="search-suggestions" placeholder="Search companies, rounds, topics, or interview questions" />
            <button type="submit">Find questions</button>
          </form>
          <div class="cta">
            <a class="btn" href="/coding">Start coding practice</a>
            <a class="btn-alt" href="/companies">Browse companies</a>
          </div>
          <div class="search-shortcuts search-shortcuts-hero">
            <a href="/coding">Coding rounds</a>
            <a href="/companies">Company-wise prep</a>
            <a href="/questions?tag=hr">HR answers</a>
            <a href="/guides">Preparation guides</a>
            <a href="/progress">Progress</a>
          </div>
        </div>
        <aside class="side">
          <div class="stat"><span>Question library</span><strong>${allQuestions().length}</strong></div>
          <div class="stat"><span>Categories</span><strong>${questionBank.length}</strong></div>
          <div class="stat"><span>Company tracks</span><strong>${companyCategories().length}</strong></div>
          <div class="stat"><span>Last updated</span><strong>${escapeHtml(formatDate(dataUpdatedAt))}</strong></div>
          <div class="stat stat-highlight"><span>Popular searches</span><div class="pill-row">${searchHighlights}</div></div>
        </aside>
      </section>
      ${renderAdBlock("Top ad", ADSENSE_SLOT, "hero")}
      <section class="section"><div><h2>Choose Your Path</h2><p>Start with one clear path so the website feels easier to use.</p></div></section>
      <section class="lane-grid">${laneMarkup}</section>
      <section class="section"><div><h2>Popular Search Pages</h2><p>These pages help you quickly open the topics many people search for.</p></div></section>
      <section class="quick-start-grid">${seoLandingPages.slice(0, 6).map((item) => `
        <a class="quick-start-card" href="${escapeHtml(`/seo/${item.slug}`)}">
          <strong>${escapeHtml(item.heading)}</strong>
          <span>${escapeHtml(item.description)}</span>
        </a>`).join("")}</section>
      <section class="mini-grid">
        <article class="strip"><strong>Free and searchable</strong><span>Everything is open and easy to search.</span></article>
        <article class="strip"><strong>Coding and interview prep</strong><span>Practice coding, company questions, and HR answers in one place.</span></article>
        <article class="strip"><strong>Progress and mock tests</strong><span>Track weak areas and use timed practice sessions.</span></article>
        <article class="strip"><strong>Search-friendly structure</strong><span>The site is organized in a way that search engines can understand more easily.</span></article>
      </section>
      <section class="section"><div><h2>Featured Companies</h2><p>Go directly into company-wise preparation pages with focused interview themes.</p></div><a class="text-link" href="/companies">View all companies</a></section>
      <section class="company-grid">${companyFeatured}</section>
      ${renderAdBlock("Company section ad", ADSENSE_SLOT_SECONDARY, "in-content")}
      <section class="section"><div><h2>Coding Highlights</h2><p>Representative coding problems with detailed solutions and JavaScript code.</p></div><a class="text-link" href="/coding">Open coding lane</a></section>
      <section class="grid">${codingFeatured}</section>
      <section class="section"><div><h2>Preparation Guides</h2><p>Practical guides for coding rounds, HR interviews, company prep, resume alignment, and aptitude.</p></div><a class="text-link" href="/guides">Open all guides</a></section>
      <section class="grid">${guideMarkup}</section>
      ${renderAdBlock("Guide section ad", ADSENSE_SLOT, "in-content")}
      <section class="section"><div><h2>Latest Questions</h2><p>New or recently surfaced practice pages from across the site.</p></div></section>
      <section class="grid">${latest}</section>
      <section class="section"><div><h2>Frequently Asked Questions</h2><p>Short guidance on how to use the library professionally.</p></div><a class="text-link" href="/faq">View all FAQ</a></section>
      <section class="faq-list">${faqMarkup}</section>`
  }));
});

app.get("/questions", (req, res) => {
  const q = req.query.q || "";
  const category = req.query.category || "";
  const sort = req.query.sort || "latest";
  const tag = req.query.tag || "";
  const coding = req.query.coding === "1";
  const pattern = req.query.pattern || "";
  const difficulty = req.query.difficulty || "";
  const reveal = req.query.reveal === "1";
  const pageNumber = Number.parseInt(req.query.page || "1", 10);
  const results = searchQuestions(q, category, sort, tag, coding, pattern, difficulty);
  const options = questionBank.map((item) => `<option value="${escapeHtml(item.slug)}" ${item.slug === category ? "selected" : ""}>${escapeHtml(item.title)}</option>`).join("");
  const tagSelectOptions = tagOptions.map((item) => `<option value="${escapeHtml(item.value)}" ${item.value === tag ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("");
  const patternSelectOptions = codingPatternOptions.map((item) => `<option value="${escapeHtml(item.value)}" ${item.value === pattern ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("");
  const difficultySelectOptions = difficultyOptions.map((item) => `<option value="${escapeHtml(item.value)}" ${item.value === difficulty ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("");
  const sortOptions = [
    { value: "latest", label: "Latest" },
    { value: "alpha", label: "Alphabetical" },
    { value: "category", label: "Category" },
    { value: "company", label: "Company" }
  ].map((item) => `<option value="${item.value}" ${item.value === sort ? "selected" : ""}>${item.label}</option>`).join("");
  const pageState = paginate(results, pageNumber, 12);
  const archiveTitle = coding
    ? `${pattern || difficulty || "Coding"} Interview Questions and Solutions`
    : q
      ? `${String(q).trim()} Interview Questions and Answers`
      : category
        ? `${(byCategory(category) || {}).title || "Category"} Interview Questions and Answers`
        : "All Interview Questions and Answers";
  const archiveDescription = q
    ? `Search results for ${String(q).trim()} interview questions and answers across company-wise, coding, HR, behavioral, and technical preparation pages.`
    : coding
      ? "Browse coding interview questions with solutions, JavaScript code, pattern filters, difficulty filters, and practice-friendly navigation."
      : "Browse all interview questions and answers with category filters, company-wise pages, coding interview prep, and HR interview practice.";
  const list = pageState.pageItems.length
    ? pageState.pageItems.map((item) => card(item, { practiceMode: !reveal })).join("")
    : `<article class="panel"><h3>No matching questions found.</h3><p>Try a broader keyword or clear the category filter.</p></article>`;

  res.send(page({
    title: archiveTitle,
    description: archiveDescription,
    canonicalPath: "/questions",
    siteUrl: res.locals.siteUrl,
    structuredData: [
      webPageSchema({
        title: archiveTitle,
        description: archiveDescription,
        siteUrl: res.locals.siteUrl,
        path: "/questions"
      }),
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "All Questions", href: "/questions" }
      ], res.locals.siteUrl),
      itemListSchema({
        title: archiveTitle,
        description: archiveDescription,
        siteUrl: res.locals.siteUrl,
        pagePath: "/questions",
        items: results.slice(0, 20).map((item) => ({
          name: item.question,
          url: questionUrl(item.categorySlug, item.slug)
        }))
      })
    ],
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "All Questions" }]),
    body: `
      <section class="section"><div><h1>${coding ? "Coding Interview Questions" : "All Interview Questions"}</h1><p>${coding ? "Browse coding problems with solution writeups, JavaScript reference code, pattern labels, and practice-friendly navigation." : "Search by topic, role, company, or phrase. Sort the archive and use practice mode when you want to hide answers at first."}</p></div></section>
      <section class="panel search-panel">
        <form class="search-form" method="GET" action="/questions">
          <input type="text" name="q" list="search-suggestions" value="${escapeHtml(q)}" placeholder="Search interview questions, answers, or companies" />
          <select name="category"><option value="">All categories</option>${options}</select>
          <select name="tag">${tagSelectOptions}</select>
          <select name="pattern">${patternSelectOptions}</select>
          <select name="difficulty">${difficultySelectOptions}</select>
          <select name="sort">${sortOptions}</select>
          <button type="submit">Search</button>
          <input type="hidden" name="coding" value="${coding ? "1" : "0"}" />
          <input type="hidden" name="reveal" value="${reveal ? "1" : "0"}" />
        </form>
        <div class="search-shortcuts">
          <a href="${escapeHtml(buildQuery("/questions", { q, category, tag, sort, coding: coding ? 1 : 0, pattern, difficulty, reveal: reveal ? 0 : 1 }))}">${reveal ? "Enable practice mode" : "Reveal answer previews"}</a>
          <a href="${escapeHtml(buildQuery("/questions", { coding: coding ? 0 : 1, q, category, tag, sort, pattern, difficulty, reveal: reveal ? 1 : 0 }))}">${coding ? "Show all question types" : "Coding mode"}</a>
          <a href="/questions?tag=company">Company prep</a>
          <a href="/questions?tag=coding&coding=1">Coding</a>
          <a href="/questions?coding=1&difficulty=Easy">Easy coding</a>
          <a href="/questions?coding=1&difficulty=Medium">Medium coding</a>
          <a href="/questions?coding=1&difficulty=Hard">Hard coding</a>
          <a href="/questions?coding=1&pattern=Dynamic+Programming">Dynamic programming</a>
          <a href="/questions?coding=1&pattern=Graph%2FBFS">Graph/BFS</a>
          <a href="/questions?tag=behavioral">Behavioral</a>
          <a href="/questions?tag=hr">HR</a>
          <a href="/questions?tag=system-design">System design</a>
        </div>
        <div class="search-panel-meta">
          <span>${results.length} matching questions</span>
          <span>${questionBank.length} searchable sections</span>
          <span>${escapeHtml(tag ? formatTag(tag) : "All rounds")}</span>
          <span>${escapeHtml(pattern || "All coding patterns")}</span>
          <span>${escapeHtml(difficulty || "All difficulty levels")}</span>
          <span>${coding ? "Coding mode on" : "Mixed interview mode"}</span>
          <span>${reveal ? "Answer preview mode on" : "Practice mode on"}</span>
        </div>
      </section>
      ${renderAdBlock("Archive ad", ADSENSE_SLOT, "archive-top")}
      <section class="section"><div><h2>${results.length} results found</h2><p>Page ${pageState.currentPage} of ${pageState.totalPages}. Last content update: ${escapeHtml(formatDate(dataUpdatedAt))}.</p></div></section>
      <section class="stack">${list}</section>
      ${renderAdBlock("Archive lower ad", ADSENSE_SLOT_SECONDARY, "archive-bottom")}
      ${paginationLinks("/questions", pageState.currentPage, pageState.totalPages, { q, category, tag, sort, coding: coding ? 1 : 0, pattern, difficulty, reveal: reveal ? 1 : 0 })}`
  }));
});

app.get("/coding", (req, res) => {
  const { codingItems, byPattern, byDifficulty } = codingLandingData();
  const patternCards = Object.entries(byPattern)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([pattern, count]) => {
      const patternKeys = codingItems
        .filter((item) => (item.patterns || []).includes(pattern))
        .map((item) => `${item.categorySlug}/${item.slug}`)
        .join("|");
      return `
      <a class="quick-start-card" data-pattern-name="${escapeHtml(pattern)}" data-pattern-keys="${escapeHtml(patternKeys)}" href="${escapeHtml(buildQuery("/questions", { coding: 1, tag: "coding", pattern }))}">
        <strong>${escapeHtml(pattern)}</strong>
        <span>${count} coding problems with solutions and JavaScript code.</span>
        <span class="progress-track"><span class="progress-bar" data-pattern-bar style="width: 0%"></span></span>
        <span data-pattern-stats>0 solved • ${count} remaining</span>
      </a>`;
    })
    .join("");
  const difficultyCards = difficultyOptions
    .filter((item) => item.value)
    .map((item) => `
      <a class="card" href="${escapeHtml(buildQuery("/questions", { coding: 1, tag: "coding", difficulty: item.value }))}">
        <div class="eyebrow">Difficulty</div>
        <h3>${escapeHtml(item.label)}</h3>
        <p>${escapeHtml(`${byDifficulty[item.value] || 0} coding problems currently available.`)}</p>
      </a>`)
    .join("");
  const featuredCoding = codingItems.slice(0, 6).map((item) => card(item, { practiceMode: true })).join("");
  const companyPrep = topCodingCompanyLinks()
    .map((item) => `
      <a class="quick-start-card" href="${escapeHtml(`/coding/company/${item.slug}`)}">
        <strong>${escapeHtml(item.companyName)}</strong>
        <span>${escapeHtml(item.roleFocus || "Company coding and technical interview preparation.")}</span>
      </a>`)
    .join("");
  const mustKnowCards = codingItems.filter((item) => item.mustKnow).slice(0, 6).map((item) => card(item, { practiceMode: true })).join("");

  res.send(page({
    title: "Coding Interview Questions and Solutions",
    description: "Practice coding interview questions by pattern and difficulty with detailed solutions, JavaScript reference code, and coding-focused navigation.",
    canonicalPath: "/coding",
    siteUrl: res.locals.siteUrl,
    structuredData: [
      webPageSchema({
        title: "Coding Interview Questions and Solutions",
        description: "Practice coding interview questions by pattern and difficulty with detailed solutions, JavaScript reference code, and coding-focused navigation.",
        siteUrl: res.locals.siteUrl,
        path: "/coding",
        type: "CollectionPage"
      }),
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Coding", href: "/coding" }
      ], res.locals.siteUrl),
      itemListSchema({
        title: "Coding Interview Questions and Solutions",
        description: "Coding interview problem archive by pattern and difficulty.",
        siteUrl: res.locals.siteUrl,
        pagePath: "/coding",
        items: codingItems.slice(0, 20).map((item) => ({
          name: item.question,
          url: questionUrl(item.categorySlug, item.slug)
        }))
      })
    ],
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Coding" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Coding Prep</div>
        <h1>Coding Interview Questions</h1>
        <p>Use the coding library as a focused practice product: browse by pattern, filter by difficulty, read the step-by-step solution, then compare against the JavaScript reference implementation.</p>
        <div class="meta">
          <span>${codingItems.length} coding problems</span>
          <span>${Object.keys(byPattern).length} patterns</span>
          <span>Detailed solutions + code</span>
        </div>
        <div class="meta" data-coding-stats></div>
        <div class="cta">
          <a class="btn" href="/questions?coding=1&tag=coding">Open coding archive</a>
          <a class="btn-alt" href="/questions?coding=1&difficulty=Medium">Start with medium problems</a>
          <a class="btn-alt" href="/coding/mock-test">Start mock test</a>
        </div>
      </section>
      ${renderAdBlock("Coding section ad", ADSENSE_SLOT, "archive-top")}
      <section class="section"><div><h2>Browse By Pattern</h2><p>Jump into the most-used interview problem families first.</p></div></section>
      <section class="quick-start-grid">${patternCards}</section>
      <section class="section"><div><h2>Weak-Area Recommendations</h2><p>These update from the problems you mark for revision, so the coding page starts pushing you toward the patterns that need more work.</p></div></section>
      <section class="panel"><div class="pill-row" data-weak-areas><span>No weak areas yet. Mark problems for revision to get recommendations.</span></div></section>
      <section class="section"><div><h2>Browse By Difficulty</h2><p>Control the pace of practice instead of mixing easy and hard problems randomly.</p></div></section>
      <section class="grid">${difficultyCards}</section>
      <section class="section"><div><h2>Company Coding Prep</h2><p>Use company pages alongside the coding archive when you want mixed technical and behavioral preparation.</p></div></section>
      <section class="quick-start-grid">${companyPrep}</section>
      <section class="section"><div><h2>Must-Know Problems</h2><p>These are the core problems worth practicing until your explanation and code feel natural.</p></div></section>
      <section class="stack">${mustKnowCards}</section>
      ${renderAdBlock("Coding lower ad", ADSENSE_SLOT_SECONDARY, "archive-bottom")}
      <section class="section"><div><h2>Featured Coding Problems</h2><p>Representative problems with solution writeups and code-ready detail pages.</p></div></section>
      <section class="stack">${featuredCoding}</section>`
  }));
});

app.get("/coding/mock-test", (req, res) => {
  const { codingItems } = codingLandingData();
  const preset = String(req.query.preset || "thirty");
  const presetSeconds = {
    thirty: 1800,
    sixty: 3600,
    "faang-medium": 2700
  };
  const presetLabels = {
    thirty: "30 min core set",
    sixty: "60 min extended set",
    "faang-medium": "FAANG medium set"
  };
  const mockSet = mockPresetSet(codingItems, preset);
  const mockList = mockSet.map((item, index) => `
    <article class="card">
      <div class="eyebrow">Problem ${index + 1}</div>
      <h3>${escapeHtml(item.question)}</h3>
      <div class="coding-meta">
        ${item.difficulty ? `<span class="coding-badge">${escapeHtml(item.difficulty)}</span>` : ""}
        ${(item.patterns || []).slice(0, 2).map((pattern) => `<span class="coding-badge">${escapeHtml(pattern)}</span>`).join("")}
        ${item.estimatedMinutes ? `<span class="coding-badge">${escapeHtml(`${item.estimatedMinutes} min`)}</span>` : ""}
      </div>
      <p>Try solving it first without opening the detail page. Then compare with the guided solution and code.</p>
      <a class="text-link" href="${escapeHtml(questionUrl(item.categorySlug, item.slug))}">Open problem</a>
    </article>`).join("");

  res.send(page({
    title: "Coding Mock Test",
    description: "Timed coding mock test with a curated set of medium and hard interview problems.",
    canonicalPath: "/coding/mock-test",
    siteUrl: res.locals.siteUrl,
    structuredData: [
      webPageSchema({
        title: "Coding Mock Test",
        description: "Timed coding mock test with a curated set of medium and hard interview problems.",
        siteUrl: res.locals.siteUrl,
        path: "/coding/mock-test",
        type: "CollectionPage"
      }),
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Coding", href: "/coding" },
        { label: "Mock Test", href: "/coding/mock-test" }
      ], res.locals.siteUrl)
    ],
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Coding", href: "/coding" }, { label: "Mock Test" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Timed Practice</div>
        <h1>Coding Mock Test</h1>
        <p>Use this set for a focused timed session. Start the timer, solve the problems in order, then review the detailed solutions and JavaScript code after you finish.</p>
        <div class="pill-row">
          <a href="/coding/mock-test?preset=thirty">${escapeHtml(presetLabels.thirty)}</a>
          <a href="/coding/mock-test?preset=sixty">${escapeHtml(presetLabels.sixty)}</a>
          <a href="/coding/mock-test?preset=faang-medium">${escapeHtml(presetLabels["faang-medium"])}</a>
        </div>
        <div class="mock-timer-box">
          <strong data-mock-timer>30:00</strong>
          <div class="cta">
            <button type="button" class="btn" data-mock-start data-seconds="${presetSeconds[preset] || 1800}">Start ${escapeHtml(presetLabels[preset] || presetLabels.thirty)}</button>
            <button type="button" class="btn-alt" data-mock-pause>Resume later</button>
            <button type="button" class="btn-alt" data-mock-finish>Finish session</button>
          </div>
        </div>
      </section>
      <section class="stack">${mockList}</section>`
  }));
});

app.get("/coding/company/:slug", (req, res) => {
  const company = byCategory(req.params.slug);
  if (!company || company.kind !== "company") {
    return res.status(404).send(notFoundPage("Coding company page not found", "The coding company collection you requested does not exist.", req.currentUser));
  }

  const codingItems = codingCollectionForCompany(company.companyName || company.title);
  const cards = codingItems.length
    ? codingItems.map((item) => card(item, { practiceMode: true })).join("")
    : `<article class="panel"><h3>No coding collection found.</h3><p>Try the main coding archive or the company interview page.</p></article>`;

  res.send(page({
    title: `${company.companyName || company.title} Coding Interview Collection`,
    description: `Coding interview preparation collection for ${company.companyName || company.title} with curated problems, solutions, and JavaScript reference code.`,
    canonicalPath: `/coding/company/${company.slug}`,
    siteUrl: res.locals.siteUrl,
    structuredData: [
      webPageSchema({
        title: `${company.companyName || company.title} Coding Interview Collection`,
        description: `Coding interview preparation collection for ${company.companyName || company.title} with curated problems, solutions, and JavaScript reference code.`,
        siteUrl: res.locals.siteUrl,
        path: `/coding/company/${company.slug}`,
        type: "CollectionPage"
      }),
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Coding", href: "/coding" },
        { label: company.companyName || company.title, href: `/coding/company/${company.slug}` }
      ], res.locals.siteUrl)
    ],
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Coding", href: "/coding" }, { label: company.companyName || company.title }]),
    body: `
      <section class="detail">
        <div class="detail-head">
          ${companyLogo(company)}
          <div>
            <div class="eyebrow">Company Coding Set</div>
            <h1>${escapeHtml(company.companyName || company.title)} Coding Interview Collection</h1>
          </div>
        </div>
        <p>Use this set when you want focused coding practice with a company lens. It mixes must-know problems and patterns commonly associated with this company’s technical rounds.</p>
        <div class="meta">
          <span>${codingItems.length} curated coding problems</span>
          <span>${escapeHtml(company.roleFocus || "Technical interview preparation")}</span>
        </div>
        <div class="cta">
          <a class="btn" href="${escapeHtml(categoryUrl(company))}">Open company interview page</a>
          <a class="btn-alt" href="${escapeHtml(buildQuery("/questions", { coding: 1, q: company.companyName || company.title }))}">Search coding archive</a>
        </div>
      </section>
      <section class="stack">${cards}</section>`
  }));
});

app.get("/companies", (req, res) => {
  const companies = companyCategories()
    .map((category) => `
      <article class="company-card">
        <div class="company-head">
          ${companyLogo(category)}
          <div>
            <div class="eyebrow">Company interview prep</div>
            <h3>${escapeHtml(category.title)}</h3>
          </div>
        </div>
        <p>${escapeHtml(category.summary)}</p>
        <div class="meta">
          <span>${category.questions.length} questions</span>
          <span>${escapeHtml(category.roleFocus || "Interview preparation")}</span>
        </div>
        <div class="cta">
          <a class="btn" href="${escapeHtml(categoryUrl(category))}">Open company page</a>
          <a class="btn-alt" href="${escapeHtml(`/coding/company/${category.slug}`)}">Coding collection</a>
        </div>
      </article>`)
    .join("");

  res.send(page({
    title: "Company-Wise Interview Questions and Answers",
    description: "Browse company-wise interview questions and answers with focused preparation pages for Google, Amazon, Microsoft, TCS, Infosys, and more.",
    canonicalPath: "/companies",
    siteUrl: res.locals.siteUrl,
    structuredData: [
      webPageSchema({
        title: "Company-Wise Interview Questions and Answers",
        description: "Browse company-wise interview questions and answers with focused preparation pages for top companies.",
        siteUrl: res.locals.siteUrl,
        path: "/companies",
        type: "CollectionPage"
      }),
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Companies", href: "/companies" }
      ], res.locals.siteUrl),
      itemListSchema({
        title: "Company-Wise Interview Questions and Answers",
        description: "Company interview preparation pages.",
        siteUrl: res.locals.siteUrl,
        pagePath: "/companies",
        items: companyCategories().slice(0, 30).map((category) => ({
          name: category.title,
          url: categoryUrl(category)
        }))
      })
    ],
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Companies" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Company-Wise Prep</div>
        <h1>Company Interview Questions And Answers</h1>
        <p>Use these pages to prepare for company-specific interview themes, role fit questions, technical rounds, and related coding collections.</p>
        <div class="meta">
          <span>${companyCategories().length} companies</span>
          <span>Interview + coding collections</span>
          <span>Free access</span>
        </div>
      </section>
      <section class="company-grid">${companies}</section>`
  }));
});

app.get("/seo/:slug", (req, res) => {
  const landing = seoLandingPages.find((item) => item.slug === req.params.slug);
  if (!landing) {
    return res.status(404).send(notFoundPage("SEO page not found", "The landing page you requested does not exist.", req.currentUser));
  }

  const results = searchQuestions(landing.query, "", landing.slug.includes("coding") ? "latest" : "company", landing.slug.includes("hr") ? "hr" : landing.slug.includes("coding") ? "coding" : "", landing.slug.includes("coding"), "", "");
  const cards = results.slice(0, 12).map((item) => card(item, { practiceMode: true })).join("");
  const relatedLinks = landing.links
    .map((href) => `<a href="${escapeHtml(href)}">${escapeHtml(href.replace(/^\//, "").replace(/-/g, " "))}</a>`)
    .join("");

  res.send(page({
    title: landing.title,
    description: landing.description,
    canonicalPath: `/seo/${landing.slug}`,
    siteUrl: res.locals.siteUrl,
    structuredData: [
      webPageSchema({
        title: landing.title,
        description: landing.description,
        siteUrl: res.locals.siteUrl,
        path: `/seo/${landing.slug}`,
        type: "CollectionPage"
      }),
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: landing.heading, href: `/seo/${landing.slug}` }
      ], res.locals.siteUrl),
      itemListSchema({
        title: landing.title,
        description: landing.description,
        siteUrl: res.locals.siteUrl,
        pagePath: `/seo/${landing.slug}`,
        items: results.slice(0, 20).map((item) => ({
          name: item.question,
          url: questionUrl(item.categorySlug, item.slug)
        }))
      })
    ],
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: landing.heading }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Focused interview landing page</div>
        <h1>${escapeHtml(landing.heading)}</h1>
        <p>${escapeHtml(landing.intro)}</p>
        <div class="meta">
          <span>${results.length} related questions</span>
          <span>Search intent focused</span>
          <span>Free interview prep</span>
        </div>
        <div class="cta">
          <a class="btn" href="${escapeHtml(buildQuery("/questions", { q: landing.query, coding: landing.slug.includes("coding") ? 1 : 0, tag: landing.slug.includes("hr") ? "hr" : landing.slug.includes("coding") ? "coding" : "" }))}">Open full results</a>
          <a class="btn-alt" href="/coding">Open coding lane</a>
        </div>
      </section>
      <section class="panel">
        <h3>Related prep links</h3>
        <div class="pill-row">${relatedLinks}</div>
      </section>
      <section class="section"><div><h2>${escapeHtml(landing.heading)} Pages</h2><p>${escapeHtml(landing.description)}</p></div></section>
      <section class="stack">${cards}</section>`
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
    roleFocus: category.roleFocus || "",
    tags: classifyQuestion(category, item),
    isCoding: isCodingQuestion(category, item),
    patterns: codingPatterns(category, item),
    difficulty: codingDifficulty(category, item)
  }));
  const tagCounts = categoryQuestions.reduce((acc, item) => {
    item.tags.forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag, count]) => `<a href="${escapeHtml(buildQuery("/questions", { category: category.slug, tag }))}">${escapeHtml(formatTag(tag))} (${count})</a>`)
    .join("");
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
  const prepOrder = category.kind === "company"
    ? [
        "Start with role fit and company motivation questions so your opening impression is strong.",
        "Move into the most common round types on this page, especially the tags shown in the focus area.",
        "Finish by practicing your best project examples, debugging stories, and concise follow-up answers."
      ]
    : [
        "Read the question first and answer it aloud before opening the full sample.",
        "Use the answer as a baseline, then rewrite it in your own examples and wording.",
        "Repeat the same questions after a gap so the response becomes natural instead of memorized."
      ];
  const prepMarkup = prepOrder.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  const codingPatternSummary = categoryQuestions
    .flatMap((item) => item.patterns || [])
    .reduce((acc, pattern) => {
      acc[pattern] = (acc[pattern] || 0) + 1;
      return acc;
    }, {});
  const topPatterns = Object.entries(codingPatternSummary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([pattern, count]) => `<a href="${escapeHtml(buildQuery("/questions", { category: category.slug, coding: 1, pattern }))}">${escapeHtml(pattern)} (${count})</a>`)
    .join("");
  const companyInsights = category.kind === "company"
    ? `
      <section class="quick-start-grid">
        <article class="detail-panel"><h3>What this company usually tests</h3><p>${escapeHtml(category.roleFocus || "Problem solving, communication, and role fit.")}</p></article>
        <article class="detail-panel"><h3>Most common round tags</h3><div class="pill-row">${topTags || "<span>No tags yet</span>"}</div></article>
        <article class="detail-panel"><h3>Best prep order</h3><ol class="step-list">${prepMarkup}</ol></article>
        <article class="detail-panel"><h3>How to use this page</h3><p>Start with the highest-frequency themes, practice the detailed answers aloud, and keep your project stories ready for follow-up questions.</p></article>
      </section>`
    : `
      <section class="quick-start-grid">
        <article class="detail-panel"><h3>Most common round tags</h3><div class="pill-row">${topTags || "<span>No tags yet</span>"}</div></article>
        <article class="detail-panel"><h3>Best prep order</h3><ol class="step-list">${prepMarkup}</ol></article>
        ${categoryQuestions.some((item) => item.isCoding) ? `<article class="detail-panel"><h3>Top coding patterns</h3><div class="pill-row">${topPatterns || "<span>No coding pattern data yet</span>"}</div></article>` : ""}
      </section>`;

  return res.send(page({
    title: category.kind === "company"
      ? `${category.companyName || category.title} Interview Questions and Answers`
      : `${category.title} Interview Questions and Answers`,
    description: truncateText(
      category.kind === "company"
        ? `${category.companyName || category.title} interview questions and answers for ${category.roleFocus || "job interviews"}. ${category.summary} ${category.questions.length} practice questions available.`
        : `${category.summary} ${category.questions.length} interview questions and answers in this category.`
    ),
    canonicalPath: categoryUrl(category),
    siteUrl: res.locals.siteUrl,
    structuredData: [
      webPageSchema({
        title: category.kind === "company"
          ? `${category.companyName || category.title} Interview Questions and Answers`
          : `${category.title} Interview Questions and Answers`,
        description: truncateText(
          category.kind === "company"
            ? `${category.companyName || category.title} interview questions and answers for ${category.roleFocus || "job interviews"}. ${category.summary}`
            : `${category.summary} ${category.questions.length} interview questions and answers in this category.`
        ),
        siteUrl: res.locals.siteUrl,
        path: categoryUrl(category),
        type: "CollectionPage"
      }),
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "All Questions", href: "/questions" },
        { label: category.title, href: categoryUrl(category) }
      ], res.locals.siteUrl),
      itemListSchema({
        title: `${category.title} interview questions`,
        description: category.summary,
        siteUrl: res.locals.siteUrl,
        pagePath: categoryUrl(category),
        items: category.questions.slice(0, 20).map((item) => ({
          name: item.question,
          url: questionUrl(category.slug, item.slug)
        }))
      })
    ],
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
          ${categoryQuestions.some((item) => item.isCoding) ? `<a class="btn-alt" href="${escapeHtml(buildQuery("/questions", { category: category.slug, coding: 1 }))}">Coding-only view</a>` : ""}
          <a class="btn-alt" href="/questions">Back to all questions</a>
        </div>
      </section>
      ${companyInsights}
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
  const detailTags = classifyQuestion(match.category, match.question).map((tag) => `<span>${escapeHtml(formatTag(tag))}</span>`).join("");
  const isCoding = isCodingQuestion(match.category, match.question);
  const detailPatterns = codingPatterns(match.category, match.question);
  const detailDifficulty = codingDifficulty(match.category, match.question);
  const codingSummary = isCoding
    ? `
      <section class="coding-summary">
        ${detailDifficulty ? `<span class="coding-badge">${escapeHtml(detailDifficulty)}</span>` : ""}
        ${detailPatterns.map((pattern) => `<span class="coding-badge">${escapeHtml(pattern)}</span>`).join("")}
        ${match.question.companyTags ? "" : ""}
        ${(codingCompanyTags({
          question: match.question.question,
          answer: match.question.answer,
          solution: match.question.solution || "",
          categoryTitle: match.category.title,
          companyName: match.category.companyName || ""
        }) || []).map((name) => `<span class="coding-badge coding-badge-muted">${escapeHtml(name)}</span>`).join("")}
        ${codingEstimatedMinutes({ isCoding, difficulty: detailDifficulty }) ? `<span class="coding-badge">${escapeHtml(`${codingEstimatedMinutes({ isCoding, difficulty: detailDifficulty })} min`)}</span>` : ""}
        ${isMustKnowProblem({ isCoding, question: match.question.question, answer: match.question.answer, solution: match.question.solution || "" }) ? `<span class="coding-badge coding-badge-warm">Must know</span>` : ""}
        ${match.question.solution ? `<span class="coding-badge">Detailed solution</span>` : ""}
        ${match.question.code ? `<span class="coding-badge">JavaScript code</span>` : ""}
      </section>`
    : "";
  const codingCompanyPrep = isCoding
    ? topCodingCompanyLinks(4)
        .map((item) => `<a href="${escapeHtml(`/coding/company/${item.slug}`)}">${escapeHtml(item.companyName)}</a>`)
        .join("")
    : "";
  const relatedGuides = guides.slice(0, 2).map(guideCard).join("");
  const answerId = `answer-${match.category.slug}-${match.question.slug}`;
  const progressKey = `${match.category.slug}/${match.question.slug}`;
  const currentIndex = match.category.questions.findIndex((item) => item.slug === match.question.slug);
  const previousQuestion = currentIndex > 0 ? match.category.questions[currentIndex - 1] : null;
  const nextQuestion = currentIndex < match.category.questions.length - 1 ? match.category.questions[currentIndex + 1] : null;
  const codingQuestionsInArchive = isCoding
    ? allQuestions().filter((item) => item.isCoding)
    : [];
  const codingArchiveIndex = isCoding
    ? codingQuestionsInArchive.findIndex((item) => item.categorySlug === match.category.slug && item.slug === match.question.slug)
    : -1;
  const previousCodingQuestion = codingArchiveIndex > 0 ? codingQuestionsInArchive[codingArchiveIndex - 1] : null;
  const nextCodingQuestion = codingArchiveIndex >= 0 && codingArchiveIndex < codingQuestionsInArchive.length - 1 ? codingQuestionsInArchive[codingArchiveIndex + 1] : null;
  const questionPager = previousQuestion || nextQuestion
    ? `
      <section class="question-nav">
        ${previousQuestion ? `<a class="quick-start-card" href="${escapeHtml(questionUrl(match.category.slug, previousQuestion.slug))}"><strong>Previous question</strong><span>${escapeHtml(previousQuestion.question)}</span></a>` : `<div></div>`}
        ${nextQuestion ? `<a class="quick-start-card" href="${escapeHtml(questionUrl(match.category.slug, nextQuestion.slug))}"><strong>Next question</strong><span>${escapeHtml(nextQuestion.question)}</span></a>` : `<div></div>`}
      </section>`
    : "";
  const codingPager = previousCodingQuestion || nextCodingQuestion
    ? `
      <section class="question-nav">
        ${previousCodingQuestion ? `<a class="quick-start-card" href="${escapeHtml(questionUrl(previousCodingQuestion.categorySlug, previousCodingQuestion.slug))}"><strong>Previous coding problem</strong><span>${escapeHtml(previousCodingQuestion.question)}</span></a>` : `<div></div>`}
        ${nextCodingQuestion ? `<a class="quick-start-card" href="${escapeHtml(questionUrl(nextCodingQuestion.categorySlug, nextCodingQuestion.slug))}"><strong>Next coding problem</strong><span>${escapeHtml(nextCodingQuestion.question)}</span></a>` : `<div></div>`}
      </section>`
    : "";

  return res.send(page({
    title: `${match.question.question} | Best Answer for ${match.category.title}`,
    description: truncateText(match.question.answer),
    canonicalPath: questionUrl(match.category.slug, match.question.slug),
    siteUrl: res.locals.siteUrl,
    ogType: "article",
    structuredData: [
      webPageSchema({
        title: `${match.question.question} | Best Answer for ${match.category.title}`,
        description: truncateText(match.question.answer),
        siteUrl: res.locals.siteUrl,
        path: questionUrl(match.category.slug, match.question.slug),
        type: "QAPage"
      }),
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "All Questions", href: "/questions" },
        { label: match.category.title, href: categoryUrl(match.category) },
        { label: match.question.question, href: questionUrl(match.category.slug, match.question.slug) }
      ], res.locals.siteUrl),
      questionSchema(match, res.locals.siteUrl)
    ],
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
        ${codingSummary}
        ${detailTags ? `<div class="tag-row">${detailTags}</div>` : ""}
        <div class="answer-box">
          <div class="section compact-section">
            <div><h3>Sample Answer</h3></div>
            <div class="card-actions">
              <button type="button" class="ghost-button answer-toggle" data-target="${escapeHtml(answerId)}" aria-expanded="true">Hide answer</button>
              <button type="button" class="ghost-button progress-button" data-progress="${escapeHtml(progressKey)}" data-status="practiced">Practiced</button>
              <button type="button" class="ghost-button progress-button" data-progress="${escapeHtml(progressKey)}" data-status="revise">Revise</button>
              <button type="button" class="ghost-button copy-answer" data-target="${escapeHtml(answerId)}">Copy answer</button>
            </div>
          </div>
          <p id="${escapeHtml(answerId)}">${escapeHtml(match.question.answer)}</p>
        </div>
        ${detailedAnswerMarkup(match.category, match.question)}
        ${isCoding ? `<div class="answer-box"><h3>Company Practice Links</h3><div class="pill-row">${codingCompanyPrep}</div></div>` : ""}
        ${renderAdBlock("Question detail ad", ADSENSE_SLOT_SECONDARY, "detail-inline")}
        <div class="cta">
          <a class="btn" href="${escapeHtml(categoryUrl(match.category))}">More ${escapeHtml(match.category.title)} questions</a>
          ${isCoding ? `<a class="btn-alt" href="${escapeHtml(buildQuery("/questions", { coding: 1, pattern: detailPatterns[0] || "", q: "" }))}">More coding questions</a>` : ""}
          <a class="btn-alt" href="/questions">Back to archive</a>
        </div>
      </article>
      ${questionPager}
      ${codingPager}
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
    siteUrl: res.locals.siteUrl,
    structuredData: [
      webPageSchema({
        title: "Interview Preparation Guides",
        description: "Guides for HR, coding rounds, company preparation, resume alignment, and aptitude practice.",
        siteUrl: res.locals.siteUrl,
        path: "/guides",
        type: "CollectionPage"
      }),
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Guides", href: "/guides" }
      ], res.locals.siteUrl),
      itemListSchema({
        title: "Interview Preparation Guides",
        description: "Preparation guides for interview practice.",
        siteUrl: res.locals.siteUrl,
        pagePath: "/guides",
        items: guides.map((guide) => ({
          name: guide.title,
          url: guideUrl(guide)
        }))
      })
    ],
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
    siteUrl: res.locals.siteUrl,
    structuredData: [
      webPageSchema({
        title: guide.title,
        description: guide.summary,
        siteUrl: res.locals.siteUrl,
        path: guideUrl(guide),
        type: "Article"
      }),
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Guides", href: "/guides" },
        { label: guide.title, href: guideUrl(guide) }
      ], res.locals.siteUrl)
    ],
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
    siteUrl: req.res.locals.siteUrl,
    robots: "noindex,nofollow",
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
    progress: {},
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
    siteUrl: res.locals.siteUrl,
    robots: "noindex,nofollow",
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

app.get("/progress", (req, res) => {
  const serverProgress = req.currentUser?.progress || {};
  const trackedItems = allQuestions().filter((item) => serverProgress[`${item.categorySlug}/${item.slug}`]);
  const summary = Object.values(serverProgress).reduce((acc, status) => {
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  res.send(page({
    title: "Interview Progress",
    description: "Track practiced, revise-later, and question progress across the interview library.",
    canonicalPath: "/progress",
    siteUrl: res.locals.siteUrl,
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Progress" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Progress</div>
        <h1>Track what you have practiced.</h1>
        <p>${req.currentUser ? "Your account-backed progress is shown below and can be updated from question cards and detail pages." : "Progress works in your browser even without login. Create an account if you want to keep progress across devices later."}</p>
        <div class="meta">
          <span>${summary.practiced || 0} practiced</span>
          <span>${summary.revise || 0} revise later</span>
          <span>${summary.completed || 0} completed</span>
        </div>
      </section>
      <section class="quick-start-grid">
        <article class="detail-panel"><h3>How to use progress</h3><p>Mark questions as practiced after your first run, use revise later for weak spots, and return to this page to see where your effort is going.</p></article>
        <article class="detail-panel"><h3>Best habit</h3><p>Combine progress tracking with answer practice aloud. The value is not only remembering the question, but improving how naturally and clearly you respond.</p></article>
      </section>
      <section class="section"><div><h2>Recently tracked questions</h2><p>Questions you have already interacted with through the progress controls.</p></div></section>
      <section class="stack" id="progress-results">${trackedItems.length ? trackedItems.slice(0, 18).map((item) => card(item)).join("") : `<article class="panel"><h3>No progress yet.</h3><p>Start marking questions from the archive or detail pages.</p></article>`}</section>`
  }));
});

app.post("/api/progress", (req, res) => {
  const key = String(req.body.key || "").trim();
  const status = String(req.body.status || "").trim();
  if (!key || !status) {
    return res.status(400).json({ ok: false, error: "invalid_progress_payload" });
  }
  if (!req.currentUser) {
    return res.json({ ok: true, mode: "local_only" });
  }
  const users = readUsers();
  const user = users.find((item) => item.id === req.currentUser.id);
  if (!user) {
    return res.status(404).json({ ok: false, error: "user_not_found" });
  }
  user.progress = user.progress || {};
  user.progress[key] = status;
  saveUsers(users);
  req.currentUser.progress = user.progress;
  return res.json({ ok: true, progress: user.progress });
});

app.get("/admin", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const messages = readMessages().slice().reverse();
  const users = readUsers();
  const categoryOptions = questionBank.map((item) => `<option value="${escapeHtml(item.slug)}">${escapeHtml(item.title)}</option>`).join("");
  const recentQuestions = questionBank
    .flatMap((category) => category.questions.slice(-4).map((question) => ({ category, question })))
    .slice(-12)
    .reverse()
    .map(({ category, question }) => `
      <article class="faq-item">
        <h3>${escapeHtml(question.question)}</h3>
        <p><strong>${escapeHtml(category.title)}</strong></p>
        <div class="card-actions">
          <a class="text-link" href="${escapeHtml(questionUrl(category.slug, question.slug))}">Open</a>
          <a class="text-link" href="${escapeHtml(`/admin/question/${category.slug}/${question.slug}/edit`)}">Edit</a>
          <form method="POST" action="${escapeHtml(`/admin/question/${category.slug}/${question.slug}/delete`)}"><button type="submit">Delete</button></form>
        </div>
      </article>`)
    .join("");
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
    siteUrl: res.locals.siteUrl,
    robots: "noindex,nofollow",
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
      <section class="section"><div><h2>Recent Questions</h2><p>Edit or remove recently managed questions from the dashboard.</p></div></section>
      <section class="faq-list">${recentQuestions || `<article class="panel"><h3>No questions yet.</h3></article>`}</section>
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

app.get("/admin/question/:categorySlug/:questionSlug/edit", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const match = byQuestion(req.params.categorySlug, req.params.questionSlug);
  if (!match) {
    return res.redirect("/admin");
  }
  res.send(page({
    title: "Edit Question",
    description: "Edit an existing interview question.",
    canonicalPath: `/admin/question/${match.category.slug}/${match.question.slug}/edit`,
    siteUrl: res.locals.siteUrl,
    robots: "noindex,nofollow",
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Admin", href: "/admin" }, { label: "Edit Question" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Admin</div>
        <h1>Edit question.</h1>
        <p>Update the question, answer, and tip while keeping the current routing intact.</p>
      </section>
      <section class="panel">
        <form class="contact-form" method="POST" action="${escapeHtml(`/admin/question/${match.category.slug}/${match.question.slug}/edit`)}">
          <input type="text" name="slug" value="${escapeHtml(match.question.slug)}" required />
          <input type="text" name="question" value="${escapeHtml(match.question.question)}" required />
          <textarea name="answer" rows="8" required>${escapeHtml(match.question.answer)}</textarea>
          <input type="text" name="tip" value="${escapeHtml(match.question.tip)}" required />
          <button type="submit">Save changes</button>
        </form>
      </section>`
  }));
});

app.post("/admin/question/:categorySlug/:questionSlug/edit", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const match = byQuestion(req.params.categorySlug, req.params.questionSlug);
  if (!match) {
    return res.redirect("/admin");
  }
  const nextQuestion = {
    slug: String(req.body.slug || "").trim(),
    question: String(req.body.question || "").trim(),
    answer: String(req.body.answer || "").trim(),
    tip: String(req.body.tip || "").trim()
  };
  if (!nextQuestion.slug || !nextQuestion.question || !nextQuestion.answer || !nextQuestion.tip) {
    return res.redirect(`/admin/question/${encodeURIComponent(match.category.slug)}/${encodeURIComponent(match.question.slug)}/edit`);
  }
  const nextQuestionBank = questionBank.map((category) =>
    category.slug === match.category.slug
      ? {
          ...category,
          questions: category.questions.map((item) =>
            item.slug === match.question.slug ? nextQuestion : item
          )
        }
      : category
  );
  saveQuestionBank(nextQuestionBank);
  res.redirect(questionUrl(match.category.slug, nextQuestion.slug));
});

app.post("/admin/question/:categorySlug/:questionSlug/delete", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const nextQuestionBank = questionBank.map((category) =>
    category.slug === req.params.categorySlug
      ? {
          ...category,
          questions: category.questions.filter((item) => item.slug !== req.params.questionSlug)
        }
      : category
  );
  saveQuestionBank(nextQuestionBank);
  res.redirect(`/category/${encodeURIComponent(req.params.categorySlug)}`);
});

app.get("/about", (req, res) => {
  res.send(page({
    title: "About Career Question Bank",
    description: "About the interview preparation library, company-wise question sets, and how to use the site.",
    canonicalPath: "/about",
    siteUrl: res.locals.siteUrl,
    structuredData: [
      webPageSchema({
        title: "About Career Question Bank",
        description: "About the interview preparation library, company-wise question sets, and how to use the site.",
        siteUrl: res.locals.siteUrl,
        path: "/about"
      }),
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "About", href: "/about" }
      ], res.locals.siteUrl),
      organizationSchema(res.locals.siteUrl)
    ],
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
  const questions = faqItems();
  const items = questions.map((item) => `
    <article class="faq-item">
      <h3>${escapeHtml(item.question)}</h3>
      <p>${escapeHtml(item.answer)}</p>
    </article>`).join("");
  res.send(page({
    title: "Interview FAQ",
    description: "Frequently asked questions about using the interview question bank and practicing effectively.",
    canonicalPath: "/faq",
    siteUrl: res.locals.siteUrl,
    structuredData: [
      webPageSchema({
        title: "Interview FAQ",
        description: "Frequently asked questions about using the interview question bank and practicing effectively.",
        siteUrl: res.locals.siteUrl,
        path: "/faq"
      }),
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "FAQ", href: "/faq" }
      ], res.locals.siteUrl),
      faqSchema(questions, res.locals.siteUrl, "/faq")
    ],
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
    siteUrl: res.locals.siteUrl,
    structuredData: [
      webPageSchema({
        title: "Privacy Policy",
        description: "Simple privacy page for the interview preparation website.",
        siteUrl: res.locals.siteUrl,
        path: "/privacy"
      }),
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Privacy", href: "/privacy" }
      ], res.locals.siteUrl)
    ],
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Privacy" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Privacy</div>
        <h1>Privacy policy.</h1>
        <p>This website serves interview preparation content and does not require user accounts to browse the library. Search queries submitted through the site are used only to render results for the current request. Advertising may be used to support the website while keeping content free for visitors.</p>
        <div class="answer-box">
          <h3>What this means in practice</h3>
          <p>No sign-up flow is required to access the content, and there is no custom profile or resume storage in the current version of the website. If a visitor creates an account later, only the details needed for that feature are stored.</p>
        </div>
        <div class="tip-box">
          <h3>Advertising and cookies</h3>
          <p>Third-party advertising providers such as Google AdSense may use cookies or similar technologies to serve ads, measure performance, and personalize ad delivery according to their own policies. Visitors can review Google advertising settings and browser controls for more information.</p>
        </div>
      </section>`
  }));
});

app.get("/terms", (req, res) => {
  res.send(page({
    title: "Terms and Conditions",
    description: "Terms for using the interview preparation website and its original practice content.",
    canonicalPath: "/terms",
    siteUrl: res.locals.siteUrl,
    structuredData: [
      webPageSchema({
        title: "Terms and Conditions",
        description: "Terms for using the interview preparation website and its original practice content.",
        siteUrl: res.locals.siteUrl,
        path: "/terms"
      }),
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Terms", href: "/terms" }
      ], res.locals.siteUrl)
    ],
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Terms" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Terms</div>
        <h1>Terms and conditions.</h1>
        <p>This website provides original interview preparation material for informational and practice use. Users should adapt answers to their own experience before any real interview and should not treat the content as employment, legal, or financial advice.</p>
        <div class="answer-box">
          <h3>Content use</h3>
          <p>The site content is intended for personal preparation, browsing, and practice. Automated scraping, abusive use, or republication of the full site content without permission is not allowed.</p>
        </div>
        <div class="tip-box">
          <h3>Service availability</h3>
          <p>The website may change, expand, or remove content over time. While the site aims to be useful and accurate, no guarantee is made that every answer or company page matches every real interview exactly.</p>
        </div>
      </section>`
  }));
});

app.get("/editorial-policy", (req, res) => {
  res.send(page({
    title: "Editorial Policy",
    description: "How interview questions, answers, and company pages are created and maintained on the site.",
    canonicalPath: "/editorial-policy",
    siteUrl: res.locals.siteUrl,
    structuredData: [
      webPageSchema({
        title: "Editorial Policy",
        description: "How interview questions, answers, and company pages are created and maintained on the site.",
        siteUrl: res.locals.siteUrl,
        path: "/editorial-policy"
      }),
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Editorial Policy", href: "/editorial-policy" }
      ], res.locals.siteUrl)
    ],
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Editorial Policy" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Editorial</div>
        <h1>How the content is created.</h1>
        <p>Career Question Bank publishes original interview practice material. Questions, sample answers, and tips are written as preparation baselines and organized into topic and company pages to help users study efficiently.</p>
        <div class="answer-box">
          <h3>Originality standard</h3>
          <p>The site aims to avoid copying protected interview-report content directly. Instead, it summarizes recurring interview themes and rewrites them into original practice questions and answer structures.</p>
        </div>
        <div class="tip-box">
          <h3>Updates and quality</h3>
          <p>Content may be expanded, revised, or improved over time as new categories, companies, and preparation guides are added. Users should always adapt sample answers into their own experience, projects, and communication style.</p>
        </div>
      </section>`
  }));
});

app.get("/ad-disclosure", (req, res) => {
  res.send(page({
    title: "Advertising Disclosure",
    description: "How advertising supports the website and what visitors should expect from sponsored placements.",
    canonicalPath: "/ad-disclosure",
    siteUrl: res.locals.siteUrl,
    structuredData: [
      webPageSchema({
        title: "Advertising Disclosure",
        description: "How advertising supports the website and what visitors should expect from sponsored placements.",
        siteUrl: res.locals.siteUrl,
        path: "/ad-disclosure"
      }),
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Ad Disclosure", href: "/ad-disclosure" }
      ], res.locals.siteUrl)
    ],
    authLinks: navAuthMarkup(req.currentUser),
    breadcrumbs: breadcrumb([{ label: "Home", href: "/" }, { label: "Ad Disclosure" }]),
    body: `
      <section class="detail">
        <div class="eyebrow">Ads</div>
        <h1>Advertising disclosure.</h1>
        <p>This website is intended to remain free for visitors and may earn revenue through advertising placements. Sponsored or ad-supported areas help fund the content without requiring users to pay for access.</p>
        <div class="answer-box">
          <h3>Editorial separation</h3>
          <p>Advertising does not change how interview questions are organized or answered on the site. The content library is written as practice material first, with ads placed around the content rather than replacing it.</p>
        </div>
        <div class="tip-box">
          <h3>Third-party ad providers</h3>
          <p>Some ads may be served by third-party networks such as Google AdSense. Those providers may use their own systems, policies, and technologies to deliver and measure ads on this site.</p>
        </div>
      </section>`
  }));
});

function renderContactPage(user, siteUrl, message = "") {
  return page({
    title: "Contact",
    description: "Contact page for the interview preparation website.",
    canonicalPath: "/contact",
    siteUrl,
    structuredData: [
      webPageSchema({
        title: "Contact",
        description: "Contact page for the interview preparation website.",
        siteUrl,
        path: "/contact"
      }),
      breadcrumbSchema([
        { label: "Home", href: "/" },
        { label: "Contact", href: "/contact" }
      ], siteUrl)
    ],
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
  res.send(renderContactPage(req.currentUser, res.locals.siteUrl));
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
  res.send(renderContactPage(req.currentUser, res.locals.siteUrl, `Thanks, ${name}. Your message was received and stored.`));
});

app.get("/api/questions", (req, res) => {
  const q = req.query.q || "";
  const category = req.query.category || "";
  const sort = req.query.sort || "latest";
  const tag = req.query.tag || "";
  const results = searchQuestions(q, category, sort, tag);
  res.json({ total: results.length, categories: questionBank.length, results });
});

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /saved
Disallow: /login
Disallow: /register
Disallow: /api/
Sitemap: ${res.locals.siteUrl}/sitemap.xml
`);
});

app.get("/sitemap.xml", (req, res) => {
  const urls = [
    "/",
    "/questions",
    "/coding",
    "/companies",
    "/guides",
    "/about",
    "/faq",
    "/privacy",
    "/progress",
    "/terms",
    "/editorial-policy",
    "/ad-disclosure",
    "/contact",
    ...seoLandingPages.map((item) => `/seo/${item.slug}`),
    ...guides.map((guide) => guideUrl(guide)),
    ...questionBank.map((category) => categoryUrl(category)),
    ...questionBank.flatMap((category) => category.questions.map((question) => questionUrl(category.slug, question.slug)))
  ];
  const lastModified = new Date(dataUpdatedAt).toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${res.locals.siteUrl}${escapeHtml(url)}</loc><lastmod>${lastModified}</lastmod></url>`).join("\n")}
</urlset>`;
  res.type("application/xml").send(xml);
});

app.use((req, res) => {
  res.status(404).send(notFoundPage("Page not found", "The page you requested does not exist.", req.currentUser));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
