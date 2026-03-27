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

const hashProblems = [
  {
    name: "Two Sum",
    statement: "Given an array of integers and a target value, return the indexes of two numbers whose sum equals the target.",
    answer: "I would solve Two Sum with a hash map that stores each value I have already seen along with its index. For each number, I compute the complement needed to reach the target and check whether that complement is already in the map. This reduces the time complexity from O(n squared) brute force to O(n) average time.",
    solution: "Start with an empty map from number to index. Scan the array from left to right. For each value, compute target minus value. If that complement already exists in the map, return the stored index and the current index. Otherwise store the current value and index in the map and continue.",
    code: `function solve_two_sum(nums, target) {\n  const seen = new Map();\n  for (let index = 0; index < nums.length; index += 1) {\n    const value = nums[index];\n    const complement = target - value;\n    if (seen.has(complement)) {\n      return [seen.get(complement), index];\n    }\n    if (!seen.has(value)) {\n      seen.set(value, index);\n    }\n  }\n  return [];\n}\n`
  },
  {
    name: "First Unique Character",
    statement: "Given a string, return the index of the first character that appears exactly once.",
    answer: "I would count the frequency of every character first, then scan the string again to find the first character whose count is one. A hash map works well here because frequency lookup stays constant on average and the logic is easy to explain.",
    solution: "Create a frequency map by scanning the string once. Then scan the string a second time from left to right. The first character whose frequency is one is the answer. If no such character exists, return negative one.",
    code: `function solve_first_unique_character(text) {\n  const counts = new Map();\n  for (const char of text) {\n    counts.set(char, (counts.get(char) || 0) + 1);\n  }\n  for (let index = 0; index < text.length; index += 1) {\n    if (counts.get(text[index]) === 1) {\n      return index;\n    }\n  }\n  return -1;\n}\n`
  },
  {
    name: "Group Anagrams",
    statement: "Given an array of strings, group the strings that are anagrams of each other.",
    answer: "I would map each word to a signature that is identical for all of its anagrams, such as the sorted characters of the word. Then I use a hash map from that signature to the list of words in that group. This makes grouping straightforward and keeps the explanation clean in an interview.",
    solution: "Initialize an empty map. For each word, sort its letters to build a stable key. If the key is not in the map yet, create an empty array for it. Push the word into that group. At the end, return the map values as the grouped answer.",
    code: `function solve_group_anagrams(words) {\n  const groups = new Map();\n  for (const word of words) {\n    const key = word.split(\"\").sort().join(\"\");\n    if (!groups.has(key)) {\n      groups.set(key, []);\n    }\n    groups.get(key).push(word);\n  }\n  return [...groups.values()];\n}\n`
  },
  {
    name: "Contains Duplicate Within K",
    statement: "Given an integer array and an integer k, determine whether there are two equal values whose indexes differ by at most k.",
    answer: "I would use a hash map from value to its latest index. As I scan the array, if the value has already appeared and the distance between the current index and the stored index is at most k, the answer is true. Otherwise I update the stored index and keep scanning.",
    solution: "Store the most recent index for each value in a map. For each array position, check whether the current value already exists in the map. If it does, compare the current index with the previous index. If the difference is within k, return true. Otherwise update the index in the map and continue.",
    code: `function solve_contains_duplicate_within_k(nums, k) {\n  const lastSeen = new Map();\n  for (let index = 0; index < nums.length; index += 1) {\n    const value = nums[index];\n    if (lastSeen.has(value) && index - lastSeen.get(value) <= k) {\n      return true;\n    }\n    lastSeen.set(value, index);\n  }\n  return false;\n}\n`
  },
  {
    name: "Longest Consecutive Sequence",
    statement: "Given an unsorted array of integers, return the length of the longest consecutive sequence.",
    answer: "I would use a set so I can test whether a number exists in constant average time. The trick is to start counting only from numbers that do not have a predecessor, because those are the true starts of consecutive runs. That avoids repeated work and keeps the runtime near O(n).",
    solution: "Insert every number into a set. For each number, check whether number minus one is missing. If so, that number starts a new sequence, so keep extending forward while the next values exist in the set. Track the maximum sequence length seen during the scan.",
    code: `function solve_longest_consecutive_sequence(nums) {\n  const values = new Set(nums);\n  let best = 0;\n  for (const value of values) {\n    if (!values.has(value - 1)) {\n      let length = 1;\n      while (values.has(value + length)) {\n        length += 1;\n      }\n      best = Math.max(best, length);\n    }\n  }\n  return best;\n}\n`
  },
  {
    name: "Subarray Sum Equals K",
    statement: "Given an integer array and a target k, return how many contiguous subarrays sum to k.",
    answer: "I would combine prefix sums with a hash map of seen prefix frequencies. If the current prefix sum is current and I have already seen current minus k before, then each occurrence of that earlier prefix creates a valid subarray ending here. This keeps the solution O(n) instead of checking every subarray explicitly.",
    solution: "Initialize a map with prefix sum zero appearing once. Walk through the array and maintain a running prefix sum. At each step, look up running sum minus k in the map and add its frequency to the answer. Then increment the frequency of the current running sum in the map.",
    code: `function solve_subarray_sum_equals_k(nums, k) {\n  const prefixCounts = new Map([[0, 1]]);\n  let running = 0;\n  let total = 0;\n  for (const value of nums) {\n    running += value;\n    total += prefixCounts.get(running - k) || 0;\n    prefixCounts.set(running, (prefixCounts.get(running) || 0) + 1);\n  }\n  return total;\n}\n`
  },
  {
    name: "Top K Frequent Elements",
    statement: "Given an integer array and an integer k, return the k most frequent elements.",
    answer: "I would count frequencies first with a hash map, then sort or bucket the results depending on the constraints. In an interview, the clearest baseline is often map plus sort, and then I can mention bucket optimization if linear time is important.",
    solution: "Build a frequency map from value to count. Convert the map into an array of pairs, sort that array by descending frequency, and return the first k values. If the interviewer asks for a more optimal approach, bucket sort by frequency is a natural follow-up.",
    code: `function solve_top_k_frequent(nums, k) {\n  const counts = new Map();\n  for (const value of nums) {\n    counts.set(value, (counts.get(value) || 0) + 1);\n  }\n  return [...counts.entries()]\n    .sort((a, b) => b[1] - a[1])\n    .slice(0, k)\n    .map(([value]) => value);\n}\n`
  },
  {
    name: "Majority Element",
    statement: "Given an array, return the element that appears more than half of the time.",
    answer: "A hash map solution is simple and easy to explain: count how many times each value appears and return the value whose count exceeds half the array length. It is not the most space-efficient approach, but it is correct, readable, and a good starting point before mentioning Boyer-Moore as an optimization.",
    solution: "Scan the array once and update the frequency of each value in a map. After each update, check whether the frequency is greater than half of the array length. As soon as it is, return that value.",
    code: `function solve_majority_element(nums) {\n  const counts = new Map();\n  const threshold = Math.floor(nums.length / 2);\n  for (const value of nums) {\n    const nextCount = (counts.get(value) || 0) + 1;\n    counts.set(value, nextCount);\n    if (nextCount > threshold) {\n      return value;\n    }\n  }\n  return null;\n}\n`
  },
  {
    name: "Valid Anagram",
    statement: "Given two strings, determine whether one string is an anagram of the other.",
    answer: "I would compare the character frequencies of the two strings. A hash map makes the counting logic explicit and works well even when the input is not limited to one small character set. If the lengths differ, I can return false immediately before doing any extra work.",
    solution: "If the strings have different lengths, return false. Count the characters of the first string in a map. Then scan the second string and decrease the corresponding count. If any character is missing or a count drops below zero, return false. If the scan finishes cleanly, the strings are anagrams.",
    code: `function solve_valid_anagram(left, right) {\n  if (left.length !== right.length) return false;\n  const counts = new Map();\n  for (const char of left) {\n    counts.set(char, (counts.get(char) || 0) + 1);\n  }\n  for (const char of right) {\n    if (!counts.has(char)) return false;\n    const nextCount = counts.get(char) - 1;\n    if (nextCount < 0) return false;\n    counts.set(char, nextCount);\n  }\n  return true;\n}\n`
  },
  {
    name: "Array Intersection With Counts",
    statement: "Given two integer arrays, return their intersection while preserving repeated values that appear in both arrays.",
    answer: "I would count the frequency of one array in a hash map, then scan the second array and emit values only while the stored count is still positive. This approach is efficient and handles duplicates correctly without nested loops.",
    solution: "Build a frequency map from the first array. Initialize an empty result list. Scan the second array and, for each value, check whether its frequency in the map is positive. If it is, push the value to the result and decrease the stored count. Return the result at the end.",
    code: `function solve_array_intersection_with_counts(left, right) {\n  const counts = new Map();\n  const result = [];\n  for (const value of left) {\n    counts.set(value, (counts.get(value) || 0) + 1);\n  }\n  for (const value of right) {\n    const available = counts.get(value) || 0;\n    if (available > 0) {\n      result.push(value);\n      counts.set(value, available - 1);\n    }\n  }\n  return result;\n}\n`
  }
];

const slidingProblems = [
  {
    name: "Longest Substring Without Repeating Characters",
    statement: "Given a string, return the length of the longest substring without repeated characters.",
    answer: "I would use a sliding window and a map of the latest index for each character. As I expand the right pointer, if I see a repeated character inside the current window, I move the left pointer to one position after its previous occurrence. That keeps the window valid in O(n) time.",
    solution: "Track the left edge of the current window and a map from character to last seen index. For each new character at the right edge, update left if that character already appeared inside the current window. Then update the best window length and store the current index for the character.",
    code: `function solve_longest_unique_substring(text) {\n  const lastSeen = new Map();\n  let left = 0;\n  let best = 0;\n  for (let right = 0; right < text.length; right += 1) {\n    const char = text[right];\n    if (lastSeen.has(char) && lastSeen.get(char) >= left) {\n      left = lastSeen.get(char) + 1;\n    }\n    lastSeen.set(char, right);\n    best = Math.max(best, right - left + 1);\n  }\n  return best;\n}\n`
  },
  {
    name: "Maximum Sum Subarray Of Size K",
    statement: "Given an integer array and a positive integer k, return the maximum sum of any contiguous subarray of size k.",
    answer: "I would maintain a fixed-size sliding window sum. Instead of recomputing each subarray sum from scratch, I add the new rightmost value and remove the value that falls out of the window. This gives O(n) time with constant extra space.",
    solution: "Initialize a running sum and add values as the window grows. Once the window size exceeds k, subtract the element leaving from the left. Every time the window size is exactly k, compare the running sum with the best sum seen so far.",
    code: `function solve_max_sum_subarray_k(nums, k) {\n  let left = 0;\n  let running = 0;\n  let best = -Infinity;\n  for (let right = 0; right < nums.length; right += 1) {\n    running += nums[right];\n    if (right - left + 1 > k) {\n      running -= nums[left];\n      left += 1;\n    }\n    if (right - left + 1 === k) {\n      best = Math.max(best, running);\n    }\n  }\n  return best === -Infinity ? 0 : best;\n}\n`
  },
  {
    name: "Minimum Size Subarray Sum",
    statement: "Given a positive integer array and a target sum, return the length of the smallest contiguous subarray whose sum is at least the target.",
    answer: "I would use a shrinking sliding window because all values are positive, which means expanding increases the sum and shrinking decreases it predictably. That monotonic behavior lets me minimize the window efficiently in linear time.",
    solution: "Expand the right pointer and add values to the running sum. While the running sum is at least the target, update the best answer with the current window size and then shrink from the left to see whether a smaller valid window exists.",
    code: `function solve_min_size_subarray_sum(target, nums) {\n  let left = 0;\n  let running = 0;\n  let best = Infinity;\n  for (let right = 0; right < nums.length; right += 1) {\n    running += nums[right];\n    while (running >= target) {\n      best = Math.min(best, right - left + 1);\n      running -= nums[left];\n      left += 1;\n    }\n  }\n  return best === Infinity ? 0 : best;\n}\n`
  },
  {
    name: "Longest Repeating Character Replacement",
    statement: "Given a string and an integer k, return the length of the longest substring that can be made of one repeating character after replacing at most k characters.",
    answer: "I would use a sliding window with character frequencies and track the maximum frequency inside the window. The window is valid while its length minus the count of the most frequent character is at most k. That condition tells me whether the remaining characters can be replaced.",
    solution: "Expand the right side of the window and update the count of that character. Keep track of the highest frequency seen in the current window. If window length minus highest frequency exceeds k, shrink from the left. Record the maximum valid window size throughout the scan.",
    code: `function solve_character_replacement(text, k) {\n  const counts = new Map();\n  let left = 0;\n  let best = 0;\n  let highest = 0;\n  for (let right = 0; right < text.length; right += 1) {\n    const char = text[right];\n    const nextCount = (counts.get(char) || 0) + 1;\n    counts.set(char, nextCount);\n    highest = Math.max(highest, nextCount);\n    while (right - left + 1 - highest > k) {\n      counts.set(text[left], counts.get(text[left]) - 1);\n      left += 1;\n    }\n    best = Math.max(best, right - left + 1);\n  }\n  return best;\n}\n`
  },
  {
    name: "Permutation In String",
    statement: "Given two strings, determine whether the second string contains a permutation of the first as a substring.",
    answer: "I would compare character counts over a fixed-size sliding window. The first string defines the required frequency map, and the second string is scanned with a window of the same length. If the window frequencies match the target frequencies at any point, a permutation exists.",
    solution: "Count the characters of the first string. Build a second frequency map for the current window in the second string. As the window moves right, add the new character and remove the outgoing one. Compare the maps after each shift or maintain a matched-counter optimization.",
    code: `function solve_permutation_in_string(pattern, text) {\n  if (pattern.length > text.length) return false;\n  const need = new Map();\n  const window = new Map();\n  for (const char of pattern) {\n    need.set(char, (need.get(char) || 0) + 1);\n  }\n  let left = 0;\n  for (let right = 0; right < text.length; right += 1) {\n    window.set(text[right], (window.get(text[right]) || 0) + 1);\n    if (right - left + 1 > pattern.length) {\n      const nextCount = window.get(text[left]) - 1;\n      if (nextCount === 0) window.delete(text[left]);\n      else window.set(text[left], nextCount);\n      left += 1;\n    }\n    if (right - left + 1 === pattern.length) {\n      let matches = true;\n      for (const [char, count] of need.entries()) {\n        if ((window.get(char) || 0) !== count) {\n          matches = false;\n          break;\n        }\n      }\n      if (matches) return true;\n    }\n  }\n  return false;\n}\n`
  },
  {
    name: "Fruit Into Baskets",
    statement: "Given an array of fruit types, return the length of the longest contiguous subarray containing at most two distinct values.",
    answer: "This is a classic at-most-k-distinct sliding window. I would keep a frequency map for the current window and shrink from the left whenever more than two fruit types are present. The longest valid window seen during the scan is the answer.",
    solution: "Expand the right pointer one fruit at a time and increase its count in the map. If the map grows beyond two distinct fruit types, remove fruit from the left until only two types remain. Update the best answer after each expansion.",
    code: `function solve_fruit_into_baskets(fruits) {\n  const counts = new Map();\n  let left = 0;\n  let best = 0;\n  for (let right = 0; right < fruits.length; right += 1) {\n    counts.set(fruits[right], (counts.get(fruits[right]) || 0) + 1);\n    while (counts.size > 2) {\n      const nextCount = counts.get(fruits[left]) - 1;\n      if (nextCount === 0) counts.delete(fruits[left]);\n      else counts.set(fruits[left], nextCount);\n      left += 1;\n    }\n    best = Math.max(best, right - left + 1);\n  }\n  return best;\n}\n`
  },
  {
    name: "Maximum Average Subarray I",
    statement: "Given an integer array and a positive integer k, return the maximum average value of any contiguous subarray of size k.",
    answer: "I would use the fixed-size window sum pattern. Since the denominator is constant, maximizing the average is the same as maximizing the sum. That means I only need to maintain the running sum of the current window and divide once at the end.",
    solution: "Maintain a running sum across a window of size k. Add the new rightmost value and subtract the outgoing leftmost value when the window exceeds size k. Every time the window size is exactly k, compare the running sum with the best sum seen so far and convert that to an average at the end.",
    code: `function solve_max_average_subarray(nums, k) {\n  let left = 0;\n  let running = 0;\n  let best = -Infinity;\n  for (let right = 0; right < nums.length; right += 1) {\n    running += nums[right];\n    if (right - left + 1 > k) {\n      running -= nums[left];\n      left += 1;\n    }\n    if (right - left + 1 === k) {\n      best = Math.max(best, running);\n    }\n  }\n  return best / k;\n}\n`
  },
  {
    name: "Minimum Window Substring",
    statement: "Given strings s and t, return the smallest substring of s that contains all characters of t.",
    answer: "I would use a variable-size sliding window with required counts for the target string. As I expand the window, I track whether all required characters are satisfied. Once they are, I shrink from the left as much as possible while keeping the window valid. That gives the minimum valid substring.",
    solution: "Count the required characters from the target string. Scan the source string with a right pointer and update the window counts. Track how many required characters are currently satisfied. When the window is valid, try shrinking from the left to minimize it while preserving validity. Record the best substring boundaries seen.",
    code: `function solve_minimum_window_substring(source, target) {\n  if (!target.length || target.length > source.length) return \"\";\n  const need = new Map();\n  for (const char of target) {\n    need.set(char, (need.get(char) || 0) + 1);\n  }\n  const window = new Map();\n  let formed = 0;\n  let left = 0;\n  let best = [Infinity, 0, 0];\n  for (let right = 0; right < source.length; right += 1) {\n    const char = source[right];\n    window.set(char, (window.get(char) || 0) + 1);\n    if (need.has(char) && window.get(char) === need.get(char)) {\n      formed += 1;\n    }\n    while (formed === need.size) {\n      if (right - left + 1 < best[0]) best = [right - left + 1, left, right];\n      const leftChar = source[left];\n      window.set(leftChar, window.get(leftChar) - 1);\n      if (need.has(leftChar) && window.get(leftChar) < need.get(leftChar)) {\n        formed -= 1;\n      }\n      left += 1;\n    }\n  }\n  return best[0] === Infinity ? \"\" : source.slice(best[1], best[2] + 1);\n}\n`
  },
  {
    name: "Count Nice Subarrays",
    statement: "Given an integer array and an integer k, return how many contiguous subarrays contain exactly k odd numbers.",
    answer: "I would convert the problem into counting subarrays with at most k odd numbers and subtract the count for at most k minus one. Sliding window works well because odd counts change predictably as the window expands and shrinks.",
    solution: "Write a helper that counts subarrays with at most a given number of odd values. Inside that helper, use a sliding window that shrinks whenever the odd count exceeds the limit. For each right pointer position, add the number of valid starting positions. The final answer is atMost(k) minus atMost(k - 1).",
    code: `function solve_count_nice_subarrays(nums, k) {\n  function atMost(limit) {\n    let left = 0;\n    let oddCount = 0;\n    let total = 0;\n    for (let right = 0; right < nums.length; right += 1) {\n      if (nums[right] % 2 !== 0) oddCount += 1;\n      while (oddCount > limit) {\n        if (nums[left] % 2 !== 0) oddCount -= 1;\n        left += 1;\n      }\n      total += right - left + 1;\n    }\n    return total;\n  }\n  return atMost(k) - atMost(k - 1);\n}\n`
  },
  {
    name: "Longest Ones After Flips",
    statement: "Given a binary array and an integer k, return the length of the longest contiguous segment containing only ones after flipping at most k zeros.",
    answer: "I would use a sliding window that counts how many zeros are currently inside the window. The window is valid while the zero count is at most k. Whenever it exceeds k, I shrink from the left until the window becomes valid again.",
    solution: "Track left, right, zero count, and best length. Expand the window by moving right. If the new value is zero, increase the zero count. While zero count is greater than k, shrink from the left and reduce the zero count when a zero leaves. Update the best window length after each expansion.",
    code: `function solve_longest_ones_after_flips(nums, k) {\n  let left = 0;\n  let zeros = 0;\n  let best = 0;\n  for (let right = 0; right < nums.length; right += 1) {\n    if (nums[right] === 0) zeros += 1;\n    while (zeros > k) {\n      if (nums[left] === 0) zeros -= 1;\n      left += 1;\n    }\n    best = Math.max(best, right - left + 1);\n  }\n  return best;\n}\n`
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
        tip: "State the brute-force idea briefly, then explain why the sliding or hashing pattern improves efficiency before you write code."
      });
    }
  }
  return items;
}

const targets = [
  {
    slug: "coding-hash-map-problems",
    title: "Hash Map Coding Problems",
    summary: "High-value hash map interview problems with cleaner statements, explanations, and JavaScript solutions.",
    questions: buildQuestions("coding-hash-map-problems", hashProblems)
  },
  {
    slug: "coding-sliding-window-problems",
    title: "Sliding Window Coding Problems",
    summary: "High-value sliding window interview problems with stronger problem framing, solutions, and JavaScript code.",
    questions: buildQuestions("coding-sliding-window-problems", slidingProblems)
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
