const fs = require("fs");
const path = require("path");

const filePath = path.join(process.cwd(), "posts.json");
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

const replacements = [
  [/an unclear situation/gi, "uncertainty"],
  [/\bunclear situation\b/gi, "uncertainty"],
  [/reduce an uncertainty/gi, "reduce uncertainty"],
  [/through uncertainty, work, validation, communication, and follow-up/gi, "through uncertainty, execution, checking, communication, and follow-up"],
  [/an uncertainty handling/gi, "handling uncertainty"],
  [/\buncertainty handling\b/gi, "handling uncertainty"],
  [/uncertainty becomes manageable/gi, "uncertainty becomes easier to handle"],
  [/without pretending uncertainty disappears/gi, "without pretending every detail is already known"],
  [/most of the time steady reduction/gi, "steady reduction"],
  [/I most of the time combine/gi, "I usually combine"],
  [/People most of the time/gi, "People usually"],
  [/appear most of the time matters more/gi, "appear usually matters more"],
  [/is most of the time the default/gi, "is usually the default"],
  [/it most of the time points to/gi, "it usually points to"],
  [/most of the time do better work/gi, "usually do better work"],
  [/most of the time matters more/gi, "usually matters more"],
  [/make faster for different user behavior patterns/gi, "help in different situations"],
  [/good and bad sides/gi, "pros and cons"],
  [/find out what work remains valid/gi, "find which work still remains valid"],
  [/clearer clear communication/gi, "clearer communication"],
  [/clear communication is mostly independent requests/gi, "work is mostly independent requests"],
  [/tradeoff clear communication/gi, "tradeoff communication"],
  [/te not just test quantity/gi, "test quantity"]
];

function clean(text = "") {
  let result = String(text);
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }

  return result
    .replace(/\bvalidation\b/g, "checking")
    .replace(/\ban uncertainty\b/g, "uncertainty")
    .replace(/\s+/g, " ")
    .trim();
}

let updatedCategories = 0;
let updatedQuestions = 0;

for (const category of data) {
  let categoryChanged = false;
  const cleanedSummary = clean(category.summary || "");
  if (cleanedSummary !== category.summary) {
    category.summary = cleanedSummary;
    categoryChanged = true;
  }

  category.questions = category.questions.map((question) => {
    const answer = clean(question.answer || "");
    const tip = clean(question.tip || "");
    if (answer !== question.answer || tip !== question.tip) {
      updatedQuestions += 1;
    }
    return {
      ...question,
      answer,
      tip
    };
  });

  if (categoryChanged) {
    updatedCategories += 1;
  }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
console.log(JSON.stringify({ updatedCategories, updatedQuestions }, null, 2));
