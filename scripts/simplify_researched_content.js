const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "researched_questions.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

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
    .replace(/\boperational\b/gi, "day-to-day system")
    .replace(/\btrade-?offs\b/gi, "pros and cons")
    .replace(/\bambiguity\b/gi, "uncertainty")
    .replace(/\boutcome\b/gi, "result")
    .replace(/\bconstraints\b/gi, "limits")
    .replace(/\bexplicit\b/gi, "clear")
    .replace(/\bbaseline\b/gi, "starting answer")
    .replace(/\bconcrete\b/gi, "real")
    .replace(/\bpractical\b/gi, "real")
    .replace(/\btherefore\b/gi, "so")
    .replace(/\bhowever\b/gi, "but")
    .replace(/\bnon-negotiable\b/gi, "must-have")
    .replace(/\buser-facing\b/gi, "used by users")
    .replace(/\bintermittent\b/gi, "on and off")
    .replace(/\bdiagnose\b/gi, "find")
    .replace(/\bobservable\b/gi, "easy to track")
    .replace(/\bresilient\b/gi, "reliable")
    .replace(/\bscalable\b/gi, "able to grow")
    .replace(/\brobust\b/gi, "reliable")
    .replace(/\bcompute\b/gi, "calculate")
    .replace(/\bencounter\b/gi, "see")
    .replace(/\biterate\b/gi, "go through")
    .replace(/\badjacent\b/gi, "next")
    .replace(/\bretain\b/gi, "keep")
    .replace(/\bobtain\b/gi, "get")
    .replace(/\bminimize\b/gi, "reduce")
    .replace(/\bmaximize\b/gi, "increase")
    .replace(/\bapproximately\b/gi, "about")
    .replace(/\s+/g, " ")
    .trim();
}

function simplifyAnswer(text = "") {
  return simplify(text)
    .replace(/\btime complexity\b/gi, "time cost")
    .replace(/\bspace complexity\b/gi, "memory cost")
    .replace(/\bbrute force\b/gi, "checking every option")
    .replace(/\bcomplement\b/gi, "needed number")
    .replace(/\bhash map\b/gi, "hash map")
    .replace(/This reduces the time cost from O\(n squared\) brute force to O\(n\) average time\./gi, "This is much faster than checking every pair one by one.")
    .replace(/I would solve /g, "I would solve ")
    .replace(/First, I /g, "First, I ")
    .replace(/Then, I /g, "Then, I ")
    .replace(/The strongest /g, "The best ")
    .replace(/A strong /g, "A good ")
    .replace(/It is not just about /g, "It is not only about ")
    .replace(/This keeps /g, "This helps ")
    .replace(/That keeps /g, "That helps ");
}

function simplifySolution(text = "") {
  return simplify(text)
    .replace(/\bScan\b/g, "Go through")
    .replace(/\btraverse\b/gi, "go through")
    .replace(/\bcomplement\b/gi, "needed number")
    .replace(/\bcurrent\b/gi, "current")
    .replace(/\bOtherwise\b/g, "If not")
    .replace(/\breturn\b/gi, "return")
    .replace(/\bleft to right\b/gi, "from left to right");
}

function simplifyTip(text = "") {
  return simplify(text)
    .replace(/\befficiency\b/gi, "speed")
    .replace(/\bstate\b/gi, "say")
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
  const summary = simplify(category.summary || "");
  if (summary !== category.summary) {
    category.summary = summary;
    updatedCategories += 1;
  }

  category.questions = category.questions.map((question) => {
    const updated = {
      ...question,
      answer: simplifyAnswer(question.answer || ""),
      tip: simplifyTip(question.tip || "")
    };

    if (typeof question.solution === "string") {
      updated.solution = simplifySolution(question.solution);
    }

    if (
      updated.answer !== question.answer ||
      updated.tip !== question.tip ||
      updated.solution !== question.solution
    ) {
      updatedQuestions += 1;
    }

    return updated;
  });
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
console.log(JSON.stringify({ updatedCategories, updatedQuestions }, null, 2));
