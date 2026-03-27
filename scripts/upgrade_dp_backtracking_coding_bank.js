const fs = require("fs");
const path = require("path");

const researchedPath = path.join(process.cwd(), "researched_questions.json");
const researched = JSON.parse(fs.readFileSync(researchedPath, "utf8"));

const variants = [
  "Keep the output in the earliest valid order when more than one answer exists.",
  "Assume duplicate values are common and explain how your logic avoids incorrect reuse.",
  "Optimize for large inputs and explain why the time complexity remains acceptable.",
  "Handle edge cases such as empty input, negative values, or no valid answer.",
  "Present the result in a stable and interview-friendly way that is easy to verify."
];

const dpProblems = [
  {
    name: "Climbing Stairs",
    statement: "Given an integer n, return how many distinct ways there are to climb to the top when you can take one or two steps at a time.",
    answer: "I would model this as a recurrence where the number of ways to reach step n depends on the ways to reach steps n minus one and n minus two. That makes it a classic dynamic programming problem, and the state transition is easy to explain.",
    solution: "Handle small values directly. Then iterate from step three to step n while keeping only the previous two answers. At each step, the current number of ways is the sum of the previous two values. This gives O(n) time and O(1) extra space.",
    code: `function solve_climbing_stairs(n) {\n  if (n <= 2) return n;\n  let oneStepBefore = 2;\n  let twoStepsBefore = 1;\n  for (let step = 3; step <= n; step += 1) {\n    const current = oneStepBefore + twoStepsBefore;\n    twoStepsBefore = oneStepBefore;\n    oneStepBefore = current;\n  }\n  return oneStepBefore;\n}\n`
  },
  {
    name: "House Robber",
    statement: "Given an array of non-negative integers representing money in houses along a street, return the maximum amount you can rob without robbing adjacent houses.",
    answer: "I would use dynamic programming because each house creates a local choice: either rob it and add the best total from two houses back, or skip it and keep the best total from the previous house. The optimal answer is built from those smaller decisions.",
    solution: "Track two values while scanning the array: the best amount if you skip the current house and the best amount if you consider robbing it. For each value, compute the new best as the maximum of skipping the house or taking the current amount plus the best total from two positions back.",
    code: `function solve_house_robber(nums) {\n  let previous = 0;\n  let current = 0;\n  for (const amount of nums) {\n    const next = Math.max(current, previous + amount);\n    previous = current;\n    current = next;\n  }\n  return current;\n}\n`
  },
  {
    name: "Maximum Subarray",
    statement: "Given an integer array, return the largest sum of any contiguous subarray.",
    answer: "I would use Kadane's algorithm, which is a dynamic programming pattern on prefixes. At each index I decide whether it is better to extend the previous subarray or start a new subarray at the current value. That local decision is enough to build the global optimum.",
    solution: "Initialize both the running best ending at the current position and the overall best with the first element. Then scan from left to right. For each value, update the running best as the larger of the value itself or the value plus the previous running best. Update the overall best if needed.",
    code: `function solve_maximum_subarray(nums) {\n  let current = nums[0];\n  let best = nums[0];\n  for (let index = 1; index < nums.length; index += 1) {\n    current = Math.max(nums[index], current + nums[index]);\n    best = Math.max(best, current);\n  }\n  return best;\n}\n`
  },
  {
    name: "Coin Change",
    statement: "Given coin denominations and a target amount, return the minimum number of coins needed to make that amount, or negative one if it is impossible.",
    answer: "I would use bottom-up dynamic programming where dp[value] stores the minimum coins needed for that amount. Each coin defines a transition from a smaller amount to a larger one. This avoids repeated recursive work and makes the state definition explicit.",
    solution: "Create a dp array of size amount plus one and initialize every entry to Infinity except dp[0] equals zero. For each amount from one to target, try every coin. If the coin can be used, update dp[currentAmount] with one plus dp[currentAmount minus coin]. If dp[amount] stays Infinity, return negative one; otherwise return dp[amount].",
    code: `function solve_coin_change(coins, amount) {\n  const dp = Array(amount + 1).fill(Infinity);\n  dp[0] = 0;\n  for (let value = 1; value <= amount; value += 1) {\n    for (const coin of coins) {\n      if (coin <= value) {\n        dp[value] = Math.min(dp[value], dp[value - coin] + 1);\n      }\n    }\n  }\n  return dp[amount] === Infinity ? -1 : dp[amount];\n}\n`
  },
  {
    name: "Longest Increasing Subsequence",
    statement: "Given an integer array, return the length of the longest strictly increasing subsequence.",
    answer: "A straightforward interview answer is O(n squared) dynamic programming, where dp[i] is the best increasing subsequence length ending at index i. For each element I look back at all smaller previous elements and extend the best valid subsequence found there.",
    solution: "Initialize every dp entry to one because each element by itself forms an increasing subsequence of length one. For each index i, scan all earlier indexes j. If nums[j] is smaller than nums[i], update dp[i] with the maximum of its current value and dp[j] plus one. The answer is the maximum value in dp.",
    code: `function solve_longest_increasing_subsequence(nums) {\n  const dp = Array(nums.length).fill(1);\n  let best = 0;\n  for (let index = 0; index < nums.length; index += 1) {\n    for (let previous = 0; previous < index; previous += 1) {\n      if (nums[previous] < nums[index]) {\n        dp[index] = Math.max(dp[index], dp[previous] + 1);\n      }\n    }\n    best = Math.max(best, dp[index]);\n  }\n  return best;\n}\n`
  },
  {
    name: "Unique Paths",
    statement: "Given an m by n grid, return how many unique paths there are from the top-left corner to the bottom-right corner if you can move only right or down.",
    answer: "I would use dynamic programming on the grid because each cell can only be reached from its top neighbor or left neighbor. That makes the recurrence straightforward: paths[row][col] equals paths[row minus one][col] plus paths[row][col minus one].",
    solution: "Create a grid of path counts. Set the first row and first column to one because there is only one way to move along an edge when you can only go right or down. Then fill the rest of the grid using the sum of the top and left cells. Return the bottom-right value.",
    code: `function solve_unique_paths(rows, cols) {\n  const dp = Array.from({ length: rows }, () => Array(cols).fill(1));\n  for (let row = 1; row < rows; row += 1) {\n    for (let col = 1; col < cols; col += 1) {\n      dp[row][col] = dp[row - 1][col] + dp[row][col - 1];\n    }\n  }\n  return dp[rows - 1][cols - 1];\n}\n`
  },
  {
    name: "Decode Ways",
    statement: "Given a string of digits, return how many ways it can be decoded where 1 to 26 map to letters A to Z.",
    answer: "I would use dynamic programming over the string positions. At each index, the answer depends on whether the current digit can stand alone and whether the current two-digit substring forms a valid letter. Those two transitions define the whole problem.",
    solution: "Let dp[i] represent the number of ways to decode the prefix ending before index i. Start with dp[0] equals one. For each position, add dp[i minus one] if the single current digit is valid, and add dp[i minus two] if the last two digits form a valid number between ten and twenty-six. The final answer is dp[string length].",
    code: `function solve_decode_ways(text) {\n  if (!text.length || text[0] === '0') return 0;\n  const dp = Array(text.length + 1).fill(0);\n  dp[0] = 1;\n  dp[1] = 1;\n  for (let index = 2; index <= text.length; index += 1) {\n    const oneDigit = Number(text.slice(index - 1, index));\n    const twoDigits = Number(text.slice(index - 2, index));\n    if (oneDigit >= 1) dp[index] += dp[index - 1];\n    if (twoDigits >= 10 && twoDigits <= 26) dp[index] += dp[index - 2];\n  }\n  return dp[text.length];\n}\n`
  },
  {
    name: "Word Break",
    statement: "Given a string and a dictionary of words, determine whether the string can be segmented into a space-separated sequence of dictionary words.",
    answer: "I would use dynamic programming where dp[i] tells me whether the prefix ending at i can be segmented. Then for each end position I try all possible previous split points and check whether the earlier prefix was valid and the current substring is in the dictionary.",
    solution: "Put the dictionary words into a set. Initialize dp[0] to true. For each end index from one to the string length, scan all possible start indexes before it. If dp[start] is true and the substring from start to end is in the dictionary, set dp[end] to true and stop scanning earlier starts for that end. Return dp[string length].",
    code: `function solve_word_break(text, wordDict) {\n  const words = new Set(wordDict);\n  const dp = Array(text.length + 1).fill(false);\n  dp[0] = true;\n  for (let end = 1; end <= text.length; end += 1) {\n    for (let start = 0; start < end; start += 1) {\n      if (dp[start] && words.has(text.slice(start, end))) {\n        dp[end] = true;\n        break;\n      }\n    }\n  }\n  return dp[text.length];\n}\n`
  },
  {
    name: "Partition Equal Subset Sum",
    statement: "Given an integer array, determine whether it can be partitioned into two subsets with equal sum.",
    answer: "I would convert this into a subset-sum problem. If the total sum is odd, the answer is immediately false. Otherwise I only need to know whether some subset can reach half of the total sum, which is a standard dynamic programming state.",
    solution: "Compute the total sum and return false if it is odd. Let target be half of that total. Use a boolean dp array where dp[value] means that subset sum is reachable. Start with dp[0] as true, then for each number iterate backward from target to the number and update dp[value] using dp[value minus number]. Return dp[target].",
    code: `function solve_partition_equal_subset(nums) {\n  const total = nums.reduce((sum, value) => sum + value, 0);\n  if (total % 2 !== 0) return false;\n  const target = total / 2;\n  const dp = Array(target + 1).fill(false);\n  dp[0] = true;\n  for (const value of nums) {\n    for (let sum = target; sum >= value; sum -= 1) {\n      dp[sum] = dp[sum] || dp[sum - value];\n    }\n  }\n  return dp[target];\n}\n`
  },
  {
    name: "Edit Distance",
    statement: "Given two strings, return the minimum number of operations required to convert one string into the other using insert, delete, or replace.",
    answer: "I would use two-dimensional dynamic programming because the answer for each pair of prefixes depends on smaller prefix pairs. If the current characters match, no new operation is needed. Otherwise I take one plus the best of insert, delete, or replace.",
    solution: "Build a dp table with one extra row and column for empty prefixes. Initialize the first row and first column with the number of edits needed to convert to or from an empty string. Then fill the table left to right and top to bottom. If the current characters match, copy the diagonal value. Otherwise use one plus the minimum of the left, top, and diagonal neighbors.",
    code: `function solve_edit_distance(word1, word2) {\n  const rows = word1.length + 1;\n  const cols = word2.length + 1;\n  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));\n  for (let row = 0; row < rows; row += 1) dp[row][0] = row;\n  for (let col = 0; col < cols; col += 1) dp[0][col] = col;\n  for (let row = 1; row < rows; row += 1) {\n    for (let col = 1; col < cols; col += 1) {\n      if (word1[row - 1] === word2[col - 1]) dp[row][col] = dp[row - 1][col - 1];\n      else dp[row][col] = 1 + Math.min(dp[row - 1][col], dp[row][col - 1], dp[row - 1][col - 1]);\n    }\n  }\n  return dp[rows - 1][cols - 1];\n}\n`
  }
];

const backtrackingProblems = [
  {
    name: "Subsets",
    statement: "Given an array of distinct integers, return all possible subsets.",
    answer: "I would use backtracking because each element creates a binary choice: either include it in the current subset or exclude it. The recursion tree naturally explores every valid combination without extra bookkeeping.",
    solution: "Start with an empty subset and a recursion index. At each index, first record the current subset as one valid answer. Then iterate forward through the remaining elements, choose one element by pushing it into the current path, recurse from the next index, and pop it afterward to backtrack.",
    code: `function solve_subsets(nums) {\n  const result = [];\n  const path = [];\n\n  function backtrack(start) {\n    result.push([...path]);\n    for (let index = start; index < nums.length; index += 1) {\n      path.push(nums[index]);\n      backtrack(index + 1);\n      path.pop();\n    }\n  }\n\n  backtrack(0);\n  return result;\n}\n`
  },
  {
    name: "Permutations",
    statement: "Given an array of distinct integers, return all possible permutations.",
    answer: "I would use backtracking with a used array. At each recursion depth I choose one number that has not yet been placed in the current permutation. Once the permutation length matches the input length, I add a copy to the result.",
    solution: "Keep a current path and a boolean used array. For each recursion call, if the path length equals nums.length, record a copy and return. Otherwise loop through all indexes. If a number is unused, mark it used, push it to the path, recurse, then pop it and unmark it to restore the state.",
    code: `function solve_permutations(nums) {\n  const result = [];\n  const path = [];\n  const used = Array(nums.length).fill(false);\n\n  function backtrack() {\n    if (path.length === nums.length) {\n      result.push([...path]);\n      return;\n    }\n    for (let index = 0; index < nums.length; index += 1) {\n      if (used[index]) continue;\n      used[index] = true;\n      path.push(nums[index]);\n      backtrack();\n      path.pop();\n      used[index] = false;\n    }\n  }\n\n  backtrack();\n  return result;\n}\n`
  },
  {
    name: "Combination Sum",
    statement: "Given distinct candidate numbers and a target, return all unique combinations where the chosen numbers sum to the target. A number may be chosen unlimited times.",
    answer: "I would use backtracking because I need to explore combinations under a remaining-sum constraint. The key is to keep the recursion ordered so the same combination is not generated in different orders, which is why I recurse from the current index instead of from zero.",
    solution: "Sort if you want easier pruning, then recurse with the current start index, current path, and remaining target. If the remaining target is zero, record the current combination. If it is negative, stop that branch. Otherwise try each candidate from the current index onward, choose it, recurse with the reduced target and the same index, then pop it.",
    code: `function solve_combination_sum(candidates, target) {\n  const result = [];\n  const path = [];\n\n  function backtrack(start, remaining) {\n    if (remaining === 0) {\n      result.push([...path]);\n      return;\n    }\n    if (remaining < 0) return;\n    for (let index = start; index < candidates.length; index += 1) {\n      path.push(candidates[index]);\n      backtrack(index, remaining - candidates[index]);\n      path.pop();\n    }\n  }\n\n  backtrack(0, target);\n  return result;\n}\n`
  },
  {
    name: "Combination Sum II",
    statement: "Given candidate numbers that may contain duplicates and a target, return all unique combinations where each number may be used at most once.",
    answer: "I would still use backtracking, but I need duplicate skipping logic. Sorting the array lets me skip repeated values at the same recursion depth, which prevents duplicate combinations while still allowing the same number value to appear in different positions when valid.",
    solution: "Sort the candidates. Recurse with a start index and remaining target. If the target reaches zero, record the current path. While iterating choices, skip any value equal to the previous value when both are at the same recursion depth. Recurse with index plus one because each chosen number can be used only once.",
    code: `function solve_combination_sum_two(candidates, target) {\n  candidates.sort((a, b) => a - b);\n  const result = [];\n  const path = [];\n\n  function backtrack(start, remaining) {\n    if (remaining === 0) {\n      result.push([...path]);\n      return;\n    }\n    if (remaining < 0) return;\n    for (let index = start; index < candidates.length; index += 1) {\n      if (index > start && candidates[index] === candidates[index - 1]) continue;\n      path.push(candidates[index]);\n      backtrack(index + 1, remaining - candidates[index]);\n      path.pop();\n    }\n  }\n\n  backtrack(0, target);\n  return result;\n}\n`
  },
  {
    name: "Generate Parentheses",
    statement: "Given n pairs of parentheses, return all combinations of well-formed parentheses.",
    answer: "I would use backtracking with counts of how many open and close parentheses have been used so far. The pruning rule is the important part: I can add an opening parenthesis while opens are still available, and I can add a closing parenthesis only when it would not break validity.",
    solution: "Start from an empty string. If its length reaches two times n, record it. If the number of openings used is less than n, recurse after adding an opening parenthesis. If the number of closings used is less than the number of openings used, recurse after adding a closing parenthesis.",
    code: `function solve_generate_parentheses(n) {\n  const result = [];\n\n  function backtrack(current, openCount, closeCount) {\n    if (current.length === 2 * n) {\n      result.push(current);\n      return;\n    }\n    if (openCount < n) backtrack(current + '(', openCount + 1, closeCount);\n    if (closeCount < openCount) backtrack(current + ')', openCount, closeCount + 1);\n  }\n\n  backtrack('', 0, 0);\n  return result;\n}\n`
  },
  {
    name: "Letter Combinations Of A Phone Number",
    statement: "Given a string of digits from two to nine, return all possible letter combinations the number could represent.",
    answer: "I would use backtracking because each digit branches into a small fixed set of letters. The recursion depth equals the number of digits, and each level appends one letter from the current digit's mapping.",
    solution: "Store the digit-to-letter mapping. If the input is empty, return an empty array. Recurse by position. At each index, iterate through the letters for that digit, append one letter to the current string, recurse to the next digit, and then remove the letter when backtracking.",
    code: `function solve_letter_combinations(digits) {\n  if (!digits.length) return [];\n  const map = {\n    2: 'abc', 3: 'def', 4: 'ghi', 5: 'jkl',\n    6: 'mno', 7: 'pqrs', 8: 'tuv', 9: 'wxyz'\n  };\n  const result = [];\n\n  function backtrack(index, current) {\n    if (index === digits.length) {\n      result.push(current);\n      return;\n    }\n    for (const char of map[digits[index]]) {\n      backtrack(index + 1, current + char);\n    }\n  }\n\n  backtrack(0, '');\n  return result;\n}\n`
  },
  {
    name: "Word Search",
    statement: "Given a board of characters and a word, determine whether the word exists in the grid by moving horizontally or vertically without reusing a cell.",
    answer: "I would use DFS backtracking from each possible starting cell. The main idea is to mark a cell as temporarily used while exploring one path, then restore it when returning so other paths can reuse it. That is exactly what backtracking is for.",
    solution: "Try every cell as a starting point. The DFS should check whether the current board cell matches the current character in the word. If it does, temporarily mark that cell visited, recurse into the four neighbors for the next character, then restore the cell before returning. If any path matches all characters, return true.",
    code: `function solve_word_search(board, word) {\n  const rows = board.length;\n  const cols = board[0].length;\n  const directions = [[1,0],[-1,0],[0,1],[0,-1]];\n\n  function dfs(row, col, index) {\n    if (index === word.length) return true;\n    if (row < 0 || row >= rows || col < 0 || col >= cols) return false;\n    if (board[row][col] !== word[index]) return false;\n\n    const saved = board[row][col];\n    board[row][col] = '#';\n    for (const [dr, dc] of directions) {\n      if (dfs(row + dr, col + dc, index + 1)) {\n        board[row][col] = saved;\n        return true;\n      }\n    }\n    board[row][col] = saved;\n    return index + 1 === word.length;\n  }\n\n  for (let row = 0; row < rows; row += 1) {\n    for (let col = 0; col < cols; col += 1) {\n      if (dfs(row, col, 0)) return true;\n    }\n  }\n  return false;\n}\n`
  },
  {
    name: "Palindrome Partitioning",
    statement: "Given a string, return all possible ways to partition it so that every substring is a palindrome.",
    answer: "I would use backtracking because I need to try every valid cut position, but only continue when the chosen substring is a palindrome. The current partition path is the backtracking state, and each recursive call decides the next cut.",
    solution: "Start from index zero. At each recursion level, try every end index from the current start to the end of the string. If the substring from start to end is a palindrome, push it to the current partition, recurse from end plus one, and pop it afterward. When the start reaches the end of the string, record the partition.",
    code: `function solve_palindrome_partitioning(text) {\n  const result = [];\n  const path = [];\n\n  function isPalindrome(left, right) {\n    while (left < right) {\n      if (text[left] !== text[right]) return false;\n      left += 1;\n      right -= 1;\n    }\n    return true;\n  }\n\n  function backtrack(start) {\n    if (start === text.length) {\n      result.push([...path]);\n      return;\n    }\n    for (let end = start; end < text.length; end += 1) {\n      if (!isPalindrome(start, end)) continue;\n      path.push(text.slice(start, end + 1));\n      backtrack(end + 1);\n      path.pop();\n    }\n  }\n\n  backtrack(0);\n  return result;\n}\n`
  },
  {
    name: "N-Queens",
    statement: "Given an integer n, return all distinct ways to place n queens on an n by n chessboard so that no two queens attack each other.",
    answer: "I would place queens row by row with backtracking. The important part is constant-time validity checks for columns and diagonals, which I can track with sets. Then each recursive call chooses a safe column for the current row.",
    solution: "Recurse by row. For each column, skip it if it is already occupied or if either diagonal is occupied. If it is safe, place the queen, mark the column and diagonals, recurse to the next row, and then remove those marks when backtracking. When the row index reaches n, convert the board into strings and record the arrangement.",
    code: `function solve_n_queens(n) {\n  const result = [];\n  const board = Array.from({ length: n }, () => Array(n).fill('.'));\n  const columns = new Set();\n  const diagOne = new Set();\n  const diagTwo = new Set();\n\n  function backtrack(row) {\n    if (row === n) {\n      result.push(board.map((line) => line.join('')));\n      return;\n    }\n    for (let col = 0; col < n; col += 1) {\n      const d1 = row - col;\n      const d2 = row + col;\n      if (columns.has(col) || diagOne.has(d1) || diagTwo.has(d2)) continue;\n      columns.add(col);\n      diagOne.add(d1);\n      diagTwo.add(d2);\n      board[row][col] = 'Q';\n      backtrack(row + 1);\n      board[row][col] = '.';\n      columns.delete(col);\n      diagOne.delete(d1);\n      diagTwo.delete(d2);\n    }\n  }\n\n  backtrack(0);\n  return result;\n}\n`
  },
  {
    name: "Restore IP Addresses",
    statement: "Given a string containing only digits, return all possible valid IP address combinations that can be formed by inserting dots.",
    answer: "I would use backtracking because I need to choose segment boundaries under several constraints: exactly four segments, each segment between zero and 255, and no leading zeroes unless the segment is exactly zero. Those constraints make recursive construction natural.",
    solution: "Recurse with the current index in the string and the current list of segments. If there are four segments and the whole string is consumed, record the address. Otherwise try segment lengths one to three, validate the segment, append it, recurse from the next index, and pop it afterward. Stop early when a segment starts with zero or exceeds 255.",
    code: `function solve_restore_ip_addresses(text) {\n  const result = [];\n  const path = [];\n\n  function backtrack(index) {\n    if (path.length === 4) {\n      if (index === text.length) result.push(path.join('.'));\n      return;\n    }\n    for (let length = 1; length <= 3 && index + length <= text.length; length += 1) {\n      const segment = text.slice(index, index + length);\n      if ((segment.length > 1 && segment[0] === '0') || Number(segment) > 255) continue;\n      path.push(segment);\n      backtrack(index + length);\n      path.pop();\n    }\n  }\n\n  backtrack(0);\n  return result;\n}\n`
  }
];

function buildQuestions(categorySlug, problems) {
  const items = [];
  for (let problemIndex = 0; problemIndex < problems.length; problemIndex += 1) {
    const base = problems[problemIndex];
    for (let variantIndex = 0; variantIndex < variants.length; variantIndex += 1) {
      const number = String(problemIndex * variants.length + variantIndex + 1).padStart(2, "0");
      items.push({
        slug: `${categorySlug}-${number}`,
        question: `${base.name}: ${base.statement} ${variants[variantIndex]}`,
        answer: base.answer,
        solution: `${base.solution} ${variants[variantIndex]}`,
        code: base.code,
        tip: "State the DP state definition or the backtracking decision tree before coding. That usually makes the explanation much easier for an interviewer to follow."
      });
    }
  }
  return items;
}

const targets = [
  {
    slug: "coding-dp-problems",
    title: "Dynamic Programming Coding Problems",
    summary: "High-value dynamic programming interview problems with clearer state definitions, stronger explanations, and JavaScript solutions.",
    questions: buildQuestions("coding-dp-problems", dpProblems)
  },
  {
    slug: "coding-backtracking-problems",
    title: "Backtracking Coding Problems",
    summary: "High-value backtracking interview problems with cleaner recursion strategy, stronger explanations, and JavaScript solutions.",
    questions: buildQuestions("coding-backtracking-problems", backtrackingProblems)
  }
];

for (const target of targets) {
  const index = researched.findIndex((item) => item.slug === target.slug);
  if (index >= 0) {
    researched[index] = { ...researched[index], title: target.title, summary: target.summary, questions: target.questions };
  }
}

fs.writeFileSync(researchedPath, JSON.stringify(researched, null, 2) + "\n");
console.log(JSON.stringify({
  upgradedCategories: targets.length,
  upgradedQuestions: targets.reduce((sum, item) => sum + item.questions.length, 0)
}, null, 2));
