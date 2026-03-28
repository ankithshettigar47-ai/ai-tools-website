const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "posts.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

const targetSlugs = new Set([
  "software-engineering",
  "javascript",
  "react",
  "nodejs",
  "coding-interview",
  "behavioral",
  "hr",
  "google-interview-questions",
  "amazon-interview-questions",
  "microsoft-interview-questions",
  "meta-interview-questions",
  "tcs-interview-questions",
  "infosys-interview-questions"
]);

function simplify(text = "") {
  return String(text)
    .replace(/\butilize\b/gi, "use")
    .replace(/\bmaintain\b/gi, "keep")
    .replace(/\bidentify\b/gi, "find")
    .replace(/\bdetermine\b/gi, "decide")
    .replace(/\bprioritize\b/gi, "decide first")
    .replace(/\boptimize\b/gi, "improve")
    .replace(/\bclarify\b/gi, "make clear")
    .replace(/\bvalidate\b/gi, "check")
    .replace(/\bmitigate\b/gi, "reduce")
    .replace(/\bimplementation\b/gi, "work")
    .replace(/\btechnical debt\b/gi, "old code problems")
    .replace(/\boperational\b/gi, "day-to-day system")
    .replace(/\btradeoffs\b/gi, "pros and cons")
    .replace(/\bambiguity\b/gi, "uncertainty")
    .replace(/\boutcome\b/gi, "result")
    .replace(/\bconstraints\b/gi, "limits")
    .replace(/\bexplicit\b/gi, "clear")
    .replace(/\bbaseline\b/gi, "starting answer")
    .replace(/\bconcrete\b/gi, "real")
    .replace(/\bpractical\b/gi, "real")
    .replace(/\btherefore\b/gi, "so")
    .replace(/\bhowever\b/gi, "but")
    .replace(/\busually\b/gi, "usually")
    .replace(/\s+/g, " ")
    .trim();
}

function simplifyAnswer(text = "") {
  return simplify(text)
    .replace(/I would /g, "I would ")
    .replace(/I first /g, "First, I ")
    .replace(/I then /g, "Then, I ")
    .replace(/The strongest /g, "The best ")
    .replace(/A good /g, "A good ")
    .replace(/A strong /g, "A good ")
    .replace(/It is not just about /g, "It is not only about ")
    .replace(/This keeps /g, "This helps ")
    .replace(/That keeps /g, "That helps ");
}

function simplifyTip(text = "") {
  return simplify(text)
    .replace(/^Keep /i, "Keep ")
    .replace(/^Mention /i, "Mention ")
    .replace(/^Show /i, "Show ")
    .replace(/^Use /i, "Use ")
    .replace(/^Talk /i, "Talk ")
    .replace(/^Start /i, "Start ");
}

let updatedCategories = 0;
let updatedQuestions = 0;

for (const category of data) {
  if (!targetSlugs.has(category.slug)) continue;
  updatedCategories += 1;
  category.summary = simplify(category.summary);
  category.questions = category.questions.map((question) => {
    updatedQuestions += 1;
    return {
      ...question,
      answer: simplifyAnswer(question.answer),
      tip: simplifyTip(question.tip)
    };
  });
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
console.log(JSON.stringify({ updatedCategories, updatedQuestions }, null, 2));
