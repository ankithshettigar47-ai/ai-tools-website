const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "researched_questions.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

const replacements = [
  [/helps the user experience stable/gi, "helps keep the user experience stable"],
  [/needed number needed/gi, "needed number"],
  [/from from left to right/gi, "from left to right"],
  [/go through through/gi, "go through"],
  [/^go through /g, "Go through "],
  [/This reduces the time cost from O\(n squared\) checking every option to O\(n\) average time\./gi, "This is much faster than checking every pair one by one."],
  [/This helps the solution O\(n\) instead of checking every subarray explicitly\./gi, "This keeps the solution at O(n) instead of checking every subarray one by one."],
  [/\bchecking every option\b/gi, "checking every case"],
  [/say the brute-force idea/gi, "Say the brute-force idea"],
  [/say what each DFS call returns/gi, "Say what each DFS call returns"],
  [/say the DP say definition/gi, "Say the DP definition"],
  [/If not store/gi, "If not, store"],
  [/Start with an empty map from number to index\./gi, "Start with an empty map from number to index."],
  [/\bcurrent minus k\b/gi, "prefix sum minus k"],
  [/\bIf the current prefix sum is currentPrefix and I have already seen current prefix sum minus k before\b/gi, "If I have already seen prefix sum minus k before"],
  [/\s+/g, " "]
];

function clean(text = "") {
  let result = String(text);
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result.trim();
}

let updatedCategories = 0;
let updatedQuestions = 0;

for (const category of data) {
  const summary = clean(category.summary || "");
  if (summary !== category.summary) {
    category.summary = summary;
    updatedCategories += 1;
  }

  category.questions = category.questions.map((question) => {
    const updated = {
      ...question,
      answer: clean(question.answer || ""),
      tip: clean(question.tip || "")
    };

    if (typeof question.solution === "string") {
      updated.solution = clean(question.solution);
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
