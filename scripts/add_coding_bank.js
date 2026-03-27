const fs = require("fs");
const path = require("path");

const researchedPath = path.join(process.cwd(), "researched_questions.json");
const researched = JSON.parse(fs.readFileSync(researchedPath, "utf8"));

const constraints = [
  "while keeping the first valid result in original order",
  "when duplicate values are common in the input",
  "for inputs that may grow to one hundred thousand elements",
  "while handling negative or edge values safely",
  "with output rules that must stay stable and easy to explain"
];

const families = [
  {
    slug: "coding-hash-map-problems",
    title: "Hash Map Coding Problems",
    summary: "Coding questions that reward fast lookup, counting, and indexed matching with hash maps.",
    tasks: [
      "find a target pair",
      "count frequencies",
      "return the first duplicate",
      "group matching values",
      "track seen prefixes",
      "match complements quickly",
      "build a lookup table",
      "rank repeated values",
      "detect missing values",
      "compute grouped totals"
    ],
    answer: (task, constraint) => `I would solve this ${task} problem with a hash map because it gives near constant-time lookup and lets me avoid repeated scanning. The key is to decide what the map should store, then update and query it consistently ${constraint}.`,
    solution: (task) => `Start by defining the map entry that helps the most for this ${task} pattern, such as a count, first index, running total, or complement lookup. Scan the input once, update the map as you go, and return the earliest result that satisfies the problem condition. This keeps the solution efficient and easy to justify in an interview.`,
    code: (fn, task, constraint) => `function ${fn}(items, target = 0) {\n  // Reference hash-map pattern for: ${task}\n  // Variant focus: ${constraint}\n  const seen = new Map();\n  for (let index = 0; index < items.length; index += 1) {\n    const value = items[index];\n    const complement = target - value;\n    if (seen.has(complement)) {\n      return [seen.get(complement), index];\n    }\n    if (!seen.has(value)) {\n      seen.set(value, index);\n    }\n  }\n  return [];\n}\n`
  },
  {
    slug: "coding-sliding-window-problems",
    title: "Sliding Window Coding Problems",
    summary: "Coding questions about contiguous ranges, running counts, and shrinking or expanding windows efficiently.",
    tasks: [
      "find the longest valid segment",
      "maintain a fixed-size window",
      "track distinct elements in a range",
      "minimize a qualifying window",
      "maximize a scored window",
      "count windows matching a rule",
      "limit replacements inside a range",
      "balance a moving substring",
      "optimize a contiguous block",
      "measure the best streak"
    ],
    answer: (task, constraint) => `I would use a sliding window because this ${task} question depends on a contiguous range and repeated reprocessing would be wasteful. Expanding and shrinking the window carefully lets me keep the answer efficient ${constraint}.`,
    solution: (task) => `Use two pointers to represent the current window and maintain only the information needed to decide whether the window is valid. Expand the right pointer, update your counts or sum, and shrink from the left when the constraint breaks. Record the best answer whenever the window satisfies the problem condition.`,
    code: (fn, task, constraint) => `function ${fn}(items, limit = 2) {\n  // Reference sliding-window pattern for: ${task}\n  // Variant focus: ${constraint}\n  const counts = new Map();\n  let left = 0;\n  let best = 0;\n  for (let right = 0; right < items.length; right += 1) {\n    counts.set(items[right], (counts.get(items[right]) || 0) + 1);\n    while (counts.size > limit) {\n      const nextCount = counts.get(items[left]) - 1;\n      if (nextCount === 0) counts.delete(items[left]);\n      else counts.set(items[left], nextCount);\n      left += 1;\n    }\n    best = Math.max(best, right - left + 1);\n  }\n  return best;\n}\n`
  },
  {
    slug: "coding-two-pointer-problems",
    title: "Two Pointer Coding Problems",
    summary: "Coding questions on sorted data, partitioning, in-place movement, and pointer convergence.",
    tasks: [
      "scan from both ends",
      "partition values in place",
      "remove duplicates cleanly",
      "match a pair in sorted data",
      "compress a sequence",
      "reverse a structure safely",
      "compare mirrored values",
      "keep a stable low-high split",
      "find the closest pair",
      "measure distance under constraints"
    ],
    answer: (task, constraint) => `I would solve this ${task} problem with two pointers because the main work is comparing or moving values from opposite ends or adjacent positions. That keeps the space usage low and makes the in-place logic easier to explain ${constraint}.`,
    solution: (task) => `Define what each pointer represents before writing code. Move one or both pointers based on the comparison result, and keep your loop invariant clear so you know why each movement is correct. This pattern is especially strong when the data is sorted or when the output can be built in place.`,
    code: (fn, task, constraint) => `function ${fn}(items) {\n  // Reference two-pointer pattern for: ${task}\n  // Variant focus: ${constraint}\n  let left = 0;\n  let right = items.length - 1;\n  while (left < right) {\n    if (items[left] === items[right]) {\n      left += 1;\n      right -= 1;\n    } else if (items[left] < items[right]) {\n      left += 1;\n    } else {\n      right -= 1;\n    }\n  }\n  return left;\n}\n`
  },
  {
    slug: "coding-stack-queue-problems",
    title: "Stack and Queue Coding Problems",
    summary: "Coding questions based on monotonic stacks, queue simulation, ordering, and next-state traversal.",
    tasks: [
      "find the next greater value",
      "simulate queue behavior",
      "validate balanced symbols",
      "track the previous useful state",
      "process items in arrival order",
      "maintain monotonic ordering",
      "evaluate nested structure",
      "resolve pending operations",
      "model push and pop rules",
      "scan for nearest valid answer"
    ],
    answer: (task, constraint) => `I would use a stack or queue because this ${task} problem depends on the order in which unresolved items should be revisited. The data structure makes those ordering rules explicit and efficient ${constraint}.`,
    solution: (task) => `Choose a stack when the latest unresolved item matters most, and choose a queue when the earliest pending item should be processed first. Push items as they become candidates, pop or shift them when their condition is resolved, and make sure the invariant for the stored items stays consistent throughout the scan.`,
    code: (fn, task, constraint) => `function ${fn}(items) {\n  // Reference stack pattern for: ${task}\n  // Variant focus: ${constraint}\n  const stack = [];\n  const result = Array(items.length).fill(-1);\n  for (let index = 0; index < items.length; index += 1) {\n    while (stack.length && items[stack[stack.length - 1]] < items[index]) {\n      result[stack.pop()] = items[index];\n    }\n    stack.push(index);\n  }\n  return result;\n}\n`
  },
  {
    slug: "coding-binary-search-problems",
    title: "Binary Search Coding Problems",
    summary: "Coding questions on sorted arrays, search spaces, and monotonic feasibility checks.",
    tasks: [
      "find the first valid position",
      "locate the last occurrence",
      "search a monotonic answer space",
      "decide a threshold efficiently",
      "find the insertion point",
      "minimize a feasible answer",
      "maximize a valid answer",
      "search over capacity values",
      "identify a boundary case",
      "find the smallest passing value"
    ],
    answer: (task, constraint) => `I would use binary search because this ${task} problem has an ordered search space or a monotonic true-false condition. Each check removes half of the remaining candidates and keeps the solution efficient ${constraint}.`,
    solution: (task) => `Define the search interval, the condition that tells you whether the midpoint is good enough, and the direction to move after each check. Be explicit about whether you want the first passing value, last passing value, or an exact match. That clarity prevents most off-by-one mistakes in binary search problems.`,
    code: (fn, task, constraint) => `function ${fn}(items, target) {\n  // Reference binary-search pattern for: ${task}\n  // Variant focus: ${constraint}\n  let left = 0;\n  let right = items.length - 1;\n  while (left <= right) {\n    const mid = left + Math.floor((right - left) / 2);\n    if (items[mid] === target) return mid;\n    if (items[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return left;\n}\n`
  },
  {
    slug: "coding-linked-list-problems",
    title: "Linked List Coding Problems",
    summary: "Coding questions on pointer manipulation, reversal, cycle detection, and linked-list traversal.",
    tasks: [
      "reverse a list",
      "detect a cycle",
      "merge sorted lists",
      "remove a target node",
      "find the middle node",
      "reorder nodes safely",
      "split the list cleanly",
      "skip duplicates",
      "advance pointers at different speeds",
      "reconnect modified nodes"
    ],
    answer: (task, constraint) => `I would solve this ${task} problem by being explicit about pointer roles before changing any links. Linked-list questions reward careful state updates and a small number of well-named pointers ${constraint}.`,
    solution: (task) => `Track the pointers you need before modifying any next references. Usually that means storing the next node temporarily, updating one pointer relation, and then advancing the window. If the problem compares pointer speeds or cycle behavior, explain that invariant first and then code the traversal.`,
    code: (fn, task, constraint) => `function ${fn}(head) {\n  // Reference linked-list pattern for: ${task}\n  // Variant focus: ${constraint}\n  let previous = null;\n  let current = head;\n  while (current) {\n    const nextNode = current.next;\n    current.next = previous;\n    previous = current;\n    current = nextNode;\n  }\n  return previous;\n}\n`
  },
  {
    slug: "coding-tree-problems",
    title: "Tree DFS Coding Problems",
    summary: "Coding questions on recursion, depth-first traversal, subtree reasoning, and tree aggregation.",
    tasks: [
      "compute a depth-based answer",
      "aggregate subtree values",
      "validate an ordering rule",
      "compare two trees",
      "collect a root-to-leaf result",
      "prune invalid branches",
      "search for a target node",
      "measure the best path",
      "return a balanced-state decision",
      "build a traversal summary"
    ],
    answer: (task, constraint) => `I would use depth-first traversal because this ${task} tree problem is easier when each recursive call returns the result for one subtree. That keeps the logic local and lets me combine child results clearly ${constraint}.`,
    solution: (task) => `Define what each recursive call should return for a node and its subtree. Solve the left and right subtrees first, combine their results into the current answer, and keep the base case simple for null nodes. Tree DFS becomes much easier when the return value is well defined before coding.`,
    code: (fn, task, constraint) => `function ${fn}(root) {\n  // Reference tree DFS pattern for: ${task}\n  // Variant focus: ${constraint}\n  function dfs(node) {\n    if (!node) return 0;\n    const left = dfs(node.left);\n    const right = dfs(node.right);\n    return Math.max(left, right) + 1;\n  }\n  return dfs(root);\n}\n`
  },
  {
    slug: "coding-graph-problems",
    title: "Graph and BFS Coding Problems",
    summary: "Coding questions on graph traversal, breadth-first search, visited sets, and shortest unweighted paths.",
    tasks: [
      "count connected components",
      "find the shortest unweighted path",
      "explore reachable nodes",
      "mark visited states correctly",
      "traverse a grid as a graph",
      "expand by layers",
      "avoid revisiting cycles",
      "measure multi-source distance",
      "validate graph connectivity",
      "capture level-by-level results"
    ],
    answer: (task, constraint) => `I would solve this ${task} question with BFS or graph traversal because the problem is fundamentally about state expansion and visited tracking. The queue keeps the traversal order explicit and prevents wasted revisits ${constraint}.`,
    solution: (task) => `Model the problem as nodes and edges, then decide what should enter the queue first. Mark states as visited as soon as they are queued, process one layer at a time when distance matters, and stop early if the target state is found. This makes the traversal predictable and interview-friendly to explain.`,
    code: (fn, task, constraint) => `function ${fn}(graph, start = 0) {\n  // Reference graph BFS pattern for: ${task}\n  // Variant focus: ${constraint}\n  const queue = [start];\n  const visited = new Set([start]);\n  const order = [];\n  while (queue.length) {\n    const node = queue.shift();\n    order.push(node);\n    for (const next of graph[node] || []) {\n      if (!visited.has(next)) {\n        visited.add(next);\n        queue.push(next);\n      }\n    }\n  }\n  return order;\n}\n`
  },
  {
    slug: "coding-dp-problems",
    title: "Dynamic Programming Coding Problems",
    summary: "Coding questions on state definition, recurrence building, memoization, and bottom-up optimization.",
    tasks: [
      "minimize cost across choices",
      "count the number of ways",
      "maximize a running score",
      "choose non-adjacent values",
      "build a one-dimensional recurrence",
      "reuse overlapping subproblems",
      "convert recursion into tabulation",
      "optimize a prefix decision",
      "track best answer by position",
      "compare take versus skip states"
    ],
    answer: (task, constraint) => `I would use dynamic programming because this ${task} problem repeats smaller decisions and needs a best answer built from earlier states. The key is choosing the right state and transition before writing code ${constraint}.`,
    solution: (task) => `Write down what the DP state means in one sentence. Then express how the current state depends on earlier states, initialize the smallest base cases, and fill the table in the order required by those dependencies. If the previous row or previous positions are enough, compress the space after the recurrence is correct.`,
    code: (fn, task, constraint) => `function ${fn}(nums) {\n  // Reference dynamic-programming pattern for: ${task}\n  // Variant focus: ${constraint}\n  if (!nums.length) return 0;\n  const dp = Array(nums.length + 1).fill(0);\n  dp[1] = Math.max(0, nums[0]);\n  for (let index = 2; index <= nums.length; index += 1) {\n    dp[index] = Math.max(dp[index - 1], dp[index - 2] + nums[index - 1]);\n  }\n  return dp[nums.length];\n}\n`
  },
  {
    slug: "coding-backtracking-problems",
    title: "Backtracking Coding Problems",
    summary: "Coding questions on recursion trees, combinations, permutations, pruning, and state rollback.",
    tasks: [
      "generate all combinations",
      "build permutations safely",
      "prune invalid decisions early",
      "search a constrained state space",
      "undo choices correctly",
      "collect only valid paths",
      "stop when the partial state fails",
      "choose or skip values recursively",
      "return a list of candidate solutions",
      "explore a branching decision tree"
    ],
    answer: (task, constraint) => `I would use backtracking because this ${task} problem requires exploring a search tree of choices while abandoning paths that become invalid. The most important part is managing state changes and rollbacks clearly ${constraint}.`,
    solution: (task) => `Define the current path, the stopping condition, and the rule that tells you whether a partial choice is still valid. Add one candidate choice, recurse, and then remove that choice before moving to the next option. Backtracking answers are strongest when pruning rules are explicit and the path state is easy to reason about.`,
    code: (fn, task, constraint) => `function ${fn}(nums) {\n  // Reference backtracking pattern for: ${task}\n  // Variant focus: ${constraint}\n  const result = [];\n  const path = [];\n  function dfs(start) {\n    result.push([...path]);\n    for (let index = start; index < nums.length; index += 1) {\n      path.push(nums[index]);\n      dfs(index + 1);\n      path.pop();\n    }\n  }\n  dfs(0);\n  return result;\n}\n`
  }
];

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

for (const family of families) {
  const questions = [];
  family.tasks.forEach((task, taskIndex) => {
    constraints.forEach((constraint, constraintIndex) => {
      const variantNumber = taskIndex * constraints.length + constraintIndex + 1;
      const variantLabel = String(variantNumber).padStart(2, "0");
      const slug = `${family.slug}-${variantLabel}`;
      const referenceFunction = `solve_${slug.replace(/-/g, "_")}`;
      questions.push({
        slug,
        question: `${family.title.replace(" Coding Problems", "")} Question ${variantLabel}: How would you ${task} ${constraint}?`,
        answer: family.answer(task, constraint),
        solution: family.solution(task),
        code: family.code(referenceFunction, task, constraint),
        tip: "State the brute-force baseline first, then explain why the chosen pattern improves time or space."
      });
    });
  });

  const nextCategory = {
    slug: family.slug,
    title: family.title,
    summary: family.summary,
    kind: "topic",
    questions
  };

  const existingIndex = researched.findIndex((item) => item.slug === family.slug);
  if (existingIndex >= 0) {
    researched[existingIndex] = nextCategory;
  } else {
    researched.push(nextCategory);
  }
}

fs.writeFileSync(researchedPath, JSON.stringify(researched, null, 2) + "\n");
console.log(JSON.stringify({
  addedCategories: families.length,
  addedQuestions: families.length * 50,
  totalCategories: researched.length
}, null, 2));
