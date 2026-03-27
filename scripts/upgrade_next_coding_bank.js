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

const twoPointerProblems = [
  {
    name: "Valid Palindrome",
    statement: "Given a string, determine whether it is a palindrome after ignoring non-alphanumeric characters and case differences.",
    answer: "I would solve this with two pointers moving toward each other from the ends of the string. Each pointer skips non-alphanumeric characters, and then the normalized characters are compared. This keeps the solution linear and avoids building unnecessary extra strings.",
    solution: "Initialize one pointer at the left and one at the right. Move each pointer inward until it lands on an alphanumeric character. Compare the lowercase versions of those characters. If they differ, return false. If the pointers cross without a mismatch, return true.",
    code: `function solve_valid_palindrome(text) {\n  let left = 0;\n  let right = text.length - 1;\n  const valid = /[a-z0-9]/i;\n  while (left < right) {\n    while (left < right && !valid.test(text[left])) left += 1;\n    while (left < right && !valid.test(text[right])) right -= 1;\n    if (text[left].toLowerCase() !== text[right].toLowerCase()) {\n      return false;\n    }\n    left += 1;\n    right -= 1;\n  }\n  return true;\n}\n`
  },
  {
    name: "Container With Most Water",
    statement: "Given an array of heights, return the maximum area of water that can be trapped between two vertical lines.",
    answer: "I would use two pointers because the area depends on the shorter of the two heights and the distance between them. Starting at both ends lets me evaluate wide containers first, and moving the shorter side is the only move that can possibly improve the answer.",
    solution: "Place one pointer at each end of the array. Compute the current area using the shorter height times the width. Record the best area seen so far. Move the pointer at the shorter height inward because moving the taller one cannot increase the limiting height for that width reduction.",
    code: `function solve_container_with_most_water(heights) {\n  let left = 0;\n  let right = heights.length - 1;\n  let best = 0;\n  while (left < right) {\n    const height = Math.min(heights[left], heights[right]);\n    best = Math.max(best, height * (right - left));\n    if (heights[left] < heights[right]) left += 1;\n    else right -= 1;\n  }\n  return best;\n}\n`
  },
  {
    name: "Remove Duplicates From Sorted Array",
    statement: "Given a sorted array, remove duplicates in place and return the length of the unique prefix.",
    answer: "I would use a slow pointer to mark the next unique write position and a fast pointer to scan the array. Because the array is sorted, every new unique value appears when the fast pointer sees a value different from the last written unique value.",
    solution: "If the array is empty, return zero. Keep write at one because the first element is already unique. Scan from the second element onward with read. Whenever nums[read] differs from nums[write - 1], copy nums[read] into nums[write] and advance write. Return write at the end.",
    code: `function solve_remove_duplicates_sorted(nums) {\n  if (!nums.length) return 0;\n  let write = 1;\n  for (let read = 1; read < nums.length; read += 1) {\n    if (nums[read] !== nums[write - 1]) {\n      nums[write] = nums[read];\n      write += 1;\n    }\n  }\n  return write;\n}\n`
  },
  {
    name: "Squares Of A Sorted Array",
    statement: "Given a sorted array of integers that may include negatives, return a sorted array of their squares.",
    answer: "I would use two pointers because the largest square comes from whichever end has the larger absolute value. Filling the output from right to left lets me keep the result sorted in O(n) time without an extra sort.",
    solution: "Create a result array of the same length. Keep left at the beginning and right at the end. Compare the absolute values at both ends, square the larger one, and write it at the current output position from the back of the result array. Move the pointer you used and continue.",
    code: `function solve_sorted_squares(nums) {\n  const result = Array(nums.length);\n  let left = 0;\n  let right = nums.length - 1;\n  for (let index = nums.length - 1; index >= 0; index -= 1) {\n    const leftValue = nums[left] * nums[left];\n    const rightValue = nums[right] * nums[right];\n    if (leftValue > rightValue) {\n      result[index] = leftValue;\n      left += 1;\n    } else {\n      result[index] = rightValue;\n      right -= 1;\n    }\n  }\n  return result;\n}\n`
  },
  {
    name: "Three Sum",
    statement: "Given an integer array, return all unique triplets that sum to zero.",
    answer: "I would sort the array first, then fix one value at a time and use two pointers on the remaining suffix to find matching pairs. Sorting allows me to move the pointers intelligently and skip duplicates cleanly, which is the key to producing only unique triplets.",
    solution: "Sort the array. For each index i, skip duplicate starting values. Set left to i plus one and right to the end. Compute the triplet sum. If it is too small, move left forward. If it is too large, move right backward. If it is zero, record the triplet and skip duplicates on both sides before continuing.",
    code: `function solve_three_sum(nums) {\n  nums.sort((a, b) => a - b);\n  const result = [];\n  for (let index = 0; index < nums.length - 2; index += 1) {\n    if (index > 0 && nums[index] === nums[index - 1]) continue;\n    let left = index + 1;\n    let right = nums.length - 1;\n    while (left < right) {\n      const total = nums[index] + nums[left] + nums[right];\n      if (total === 0) {\n        result.push([nums[index], nums[left], nums[right]]);\n        left += 1;\n        right -= 1;\n        while (left < right && nums[left] === nums[left - 1]) left += 1;\n        while (left < right && nums[right] === nums[right + 1]) right -= 1;\n      } else if (total < 0) {\n        left += 1;\n      } else {\n        right -= 1;\n      }\n    }\n  }\n  return result;\n}\n`
  },
  {
    name: "Merge Sorted Array",
    statement: "Given two sorted arrays where the first one has enough trailing space, merge the second into the first in sorted order.",
    answer: "I would merge from the back because the free space is already at the end of the first array. Comparing the largest remaining values from each array avoids overwriting useful data in the first array before it has been used.",
    solution: "Use three pointers: one at the last real value in the first array, one at the end of the second array, and one at the final write position. Compare the two values and write the larger one at the write position, then move the corresponding pointer backward. Continue until the second array is fully merged.",
    code: `function solve_merge_sorted_array(nums1, m, nums2, n) {\n  let write = m + n - 1;\n  let left = m - 1;\n  let right = n - 1;\n  while (right >= 0) {\n    if (left >= 0 && nums1[left] > nums2[right]) {\n      nums1[write] = nums1[left];\n      left -= 1;\n    } else {\n      nums1[write] = nums2[right];\n      right -= 1;\n    }\n    write -= 1;\n  }\n  return nums1;\n}\n`
  },
  {
    name: "Sort Colors",
    statement: "Given an array containing only 0, 1, and 2, sort it in place without using a library sort.",
    answer: "I would use the Dutch national flag two-pointer pattern. The idea is to maintain three regions: placed zeros at the left, placed twos at the right, and unknown values in the middle. Then I examine the current pointer and swap values into the correct region.",
    solution: "Keep low, mid, and high pointers. If nums[mid] is zero, swap it with nums[low] and move both low and mid. If nums[mid] is one, just move mid. If nums[mid] is two, swap it with nums[high] and move high backward, but do not move mid until the swapped-in value is checked.",
    code: `function solve_sort_colors(nums) {\n  let low = 0;\n  let mid = 0;\n  let high = nums.length - 1;\n  while (mid <= high) {\n    if (nums[mid] === 0) {\n      [nums[low], nums[mid]] = [nums[mid], nums[low]];\n      low += 1;\n      mid += 1;\n    } else if (nums[mid] === 1) {\n      mid += 1;\n    } else {\n      [nums[mid], nums[high]] = [nums[high], nums[mid]];\n      high -= 1;\n    }\n  }\n  return nums;\n}\n`
  },
  {
    name: "Backspace String Compare",
    statement: "Given two strings containing lowercase letters and backspace markers, determine whether they are equal after processing the backspaces.",
    answer: "I would scan both strings from right to left with two pointers and skip characters that should be deleted by backspaces. This avoids building the final strings explicitly and keeps the space usage constant.",
    solution: "Create a helper that moves a pointer left until it lands on a real visible character after accounting for backspaces. Compare the visible characters from both strings. If they differ, return false. If both strings are fully consumed without mismatch, return true.",
    code: `function solve_backspace_compare(leftText, rightText) {\n  function nextVisibleIndex(text, index) {\n    let skip = 0;\n    while (index >= 0) {\n      if (text[index] === '#') {\n        skip += 1;\n        index -= 1;\n      } else if (skip > 0) {\n        skip -= 1;\n        index -= 1;\n      } else {\n        break;\n      }\n    }\n    return index;\n  }\n  let left = leftText.length - 1;\n  let right = rightText.length - 1;\n  while (left >= 0 || right >= 0) {\n    left = nextVisibleIndex(leftText, left);\n    right = nextVisibleIndex(rightText, right);\n    if (left < 0 || right < 0) return left === right;\n    if (leftText[left] !== rightText[right]) return false;\n    left -= 1;\n    right -= 1;\n  }\n  return true;\n}\n`
  },
  {
    name: "Move Zeroes",
    statement: "Given an array, move all zero values to the end while preserving the relative order of non-zero values.",
    answer: "I would use a write pointer that tracks the next position for a non-zero value. As I scan the array, every non-zero value is written forward. After that pass, I fill the remaining positions with zeros. This preserves relative order and stays in place.",
    solution: "Initialize write at zero. Scan the array from left to right. For every non-zero value, write it at nums[write] and advance write. After the scan, fill the remaining positions from write onward with zeros. This keeps the original order of non-zero elements intact.",
    code: `function solve_move_zeroes(nums) {\n  let write = 0;\n  for (let read = 0; read < nums.length; read += 1) {\n    if (nums[read] !== 0) {\n      nums[write] = nums[read];\n      write += 1;\n    }\n  }\n  while (write < nums.length) {\n    nums[write] = 0;\n    write += 1;\n  }\n  return nums;\n}\n`
  },
  {
    name: "Is Subsequence",
    statement: "Given two strings s and t, determine whether s is a subsequence of t.",
    answer: "I would use two pointers, one for each string. The pointer on the larger string always moves forward, and the pointer on the smaller string moves only when the current characters match. If the smaller string is fully consumed, it is a subsequence.",
    solution: "Initialize one pointer at the start of s and one at the start of t. Move through t and compare characters. When there is a match, advance the pointer in s as well. At the end, return whether the pointer in s reached the end of that string.",
    code: `function solve_is_subsequence(shorter, longer) {\n  let left = 0;\n  let right = 0;\n  while (left < shorter.length && right < longer.length) {\n    if (shorter[left] === longer[right]) {\n      left += 1;\n    }\n    right += 1;\n  }\n  return left === shorter.length;\n}\n`
  }
];

const stackQueueProblems = [
  {
    name: "Valid Parentheses",
    statement: "Given a string containing brackets, determine whether the brackets are balanced and properly nested.",
    answer: "I would use a stack because the most recent opening bracket must match the next closing bracket. That last-in-first-out behavior is exactly what a stack models, and it makes the validation logic straightforward.",
    solution: "Scan the string character by character. Push opening brackets onto the stack. For a closing bracket, check whether the stack is non-empty and whether its top is the matching opening bracket. If not, return false immediately. At the end, the stack should be empty for the string to be valid.",
    code: `function solve_valid_parentheses(text) {\n  const pairs = new Map([[\")\", \"(\"], [\"]\", \"[\"], [\"}\", \"{\"]]);\n  const stack = [];\n  for (const char of text) {\n    if (pairs.has(char)) {\n      if (stack.pop() !== pairs.get(char)) {\n        return false;\n      }\n    } else {\n      stack.push(char);\n    }\n  }\n  return stack.length === 0;\n}\n`
  },
  {
    name: "Next Greater Element",
    statement: "Given an array, return for each position the next greater value to its right or negative one if none exists.",
    answer: "I would use a monotonic decreasing stack of indexes. As I move left to right, the current value resolves all earlier positions whose values are smaller than it. This makes the solution O(n) because each index is pushed and popped at most once.",
    solution: "Initialize the result array with negative one. Scan the input from left to right. While the stack is not empty and the current value is greater than the value at the index on top of the stack, pop that index and record the current value as its next greater element. Push the current index afterward.",
    code: `function solve_next_greater_element(nums) {\n  const result = Array(nums.length).fill(-1);\n  const stack = [];\n  for (let index = 0; index < nums.length; index += 1) {\n    while (stack.length && nums[stack[stack.length - 1]] < nums[index]) {\n      result[stack.pop()] = nums[index];\n    }\n    stack.push(index);\n  }\n  return result;\n}\n`
  },
  {
    name: "Daily Temperatures",
    statement: "Given an array of daily temperatures, return how many days each day must wait until a warmer temperature appears.",
    answer: "This is another monotonic stack problem. I keep indexes of days with unresolved warmer temperatures, and the stack remains decreasing by temperature. When a warmer day appears, it resolves waiting times for earlier colder days.",
    solution: "Scan the temperature array from left to right. While the stack is not empty and the current temperature is warmer than the temperature at the index on top of the stack, pop that index and compute the distance to the current day. Push the current index afterward. Unresolved entries stay zero.",
    code: `function solve_daily_temperatures(temperatures) {\n  const answer = Array(temperatures.length).fill(0);\n  const stack = [];\n  for (let index = 0; index < temperatures.length; index += 1) {\n    while (stack.length && temperatures[stack[stack.length - 1]] < temperatures[index]) {\n      const previous = stack.pop();\n      answer[previous] = index - previous;\n    }\n    stack.push(index);\n  }\n  return answer;\n}\n`
  },
  {
    name: "Min Stack",
    statement: "Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.",
    answer: "I would maintain a normal value stack and a second stack that tracks the minimum seen so far at each level. That way, the current minimum is always available at the top of the min stack in O(1) time.",
    solution: "When pushing a value, push it onto the value stack and also push the new minimum onto the min stack. The new minimum is the smaller of the pushed value and the previous minimum. Pop from both stacks together. Top returns the value stack top, and getMin returns the min stack top.",
    code: `class MinStack {\n  constructor() {\n    this.values = [];\n    this.minimums = [];\n  }\n\n  push(value) {\n    this.values.push(value);\n    const nextMin = this.minimums.length\n      ? Math.min(value, this.minimums[this.minimums.length - 1])\n      : value;\n    this.minimums.push(nextMin);\n  }\n\n  pop() {\n    this.minimums.pop();\n    return this.values.pop();\n  }\n\n  top() {\n    return this.values[this.values.length - 1];\n  }\n\n  getMin() {\n    return this.minimums[this.minimums.length - 1];\n  }\n}\n`
  },
  {
    name: "Implement Queue Using Stacks",
    statement: "Implement a queue using two stacks while preserving correct first-in-first-out behavior.",
    answer: "I would use one stack for incoming pushes and one for outgoing pops. When the outgoing stack is empty and I need to pop or peek, I transfer all items from the incoming stack to the outgoing stack. That reversal restores queue order efficiently across operations.",
    solution: "Push values onto the input stack. Before pop or peek, if the output stack is empty, move every value from input to output by popping input and pushing onto output. Then pop or read from output. The queue is empty only when both stacks are empty.",
    code: `class QueueUsingStacks {\n  constructor() {\n    this.input = [];\n    this.output = [];\n  }\n\n  push(value) {\n    this.input.push(value);\n  }\n\n  shiftStacks() {\n    if (!this.output.length) {\n      while (this.input.length) {\n        this.output.push(this.input.pop());\n      }\n    }\n  }\n\n  pop() {\n    this.shiftStacks();\n    return this.output.pop();\n  }\n\n  peek() {\n    this.shiftStacks();\n    return this.output[this.output.length - 1];\n  }\n}\n`
  },
  {
    name: "Evaluate Reverse Polish Notation",
    statement: "Given a list of tokens representing a Reverse Polish Notation expression, return its evaluated value.",
    answer: "I would use a stack because every operator consumes the most recent operands. Numbers are pushed directly, and operators pop the top two values, compute the result, and push the result back. This mirrors the structure of postfix expressions exactly.",
    solution: "Scan the token list. If the token is a number, push it as an integer. If it is an operator, pop the second operand, then the first operand, apply the operation in that order, and push the result. After the scan, the stack top is the final answer.",
    code: `function solve_eval_rpn(tokens) {\n  const stack = [];\n  for (const token of tokens) {\n    if ([\"+\", \"-\", \"*\", \"/\"].includes(token)) {\n      const right = stack.pop();\n      const left = stack.pop();\n      if (token === \"+\") stack.push(left + right);\n      else if (token === \"-\") stack.push(left - right);\n      else if (token === \"*\") stack.push(left * right);\n      else stack.push(Math.trunc(left / right));\n    } else {\n      stack.push(Number(token));\n    }\n  }\n  return stack.pop();\n}\n`
  },
  {
    name: "Sliding Window Maximum",
    statement: "Given an array and an integer k, return the maximum value in every contiguous window of size k.",
    answer: "I would use a deque that keeps indexes in decreasing order of values. The front of the deque is always the maximum for the current window, and the back removes smaller values that can never become useful while the current value is still inside the window.",
    solution: "Scan the array with index right. Remove indexes from the front of the deque if they are outside the current window. Remove indexes from the back while their values are smaller than the current value. Push the current index. Once the window reaches size k, record the value at the front index as the current maximum.",
    code: `function solve_sliding_window_maximum(nums, k) {\n  const deque = [];\n  const result = [];\n  for (let index = 0; index < nums.length; index += 1) {\n    while (deque.length && deque[0] <= index - k) deque.shift();\n    while (deque.length && nums[deque[deque.length - 1]] <= nums[index]) deque.pop();\n    deque.push(index);\n    if (index >= k - 1) result.push(nums[deque[0]]);\n  }\n  return result;\n}\n`
  },
  {
    name: "Simplify Path",
    statement: "Given a Unix-style absolute file path, return its simplified canonical path.",
    answer: "I would split the path into segments and use a stack to model the directories that remain in the final answer. A normal directory name is pushed, a double dot pops the previous directory if one exists, and dots or empty segments are ignored.",
    solution: "Split the path by slashes. Scan each segment. If the segment is empty or a single dot, skip it. If it is a double dot, pop the stack when possible. Otherwise push the directory name. Join the stack with slashes and prepend a leading slash for the canonical result.",
    code: `function solve_simplify_path(pathText) {\n  const stack = [];\n  for (const segment of pathText.split('/')) {\n    if (!segment || segment === '.') continue;\n    if (segment === '..') stack.pop();\n    else stack.push(segment);\n  }\n  return '/' + stack.join('/');\n}\n`
  },
  {
    name: "Largest Rectangle In Histogram",
    statement: "Given an array of bar heights in a histogram, return the area of the largest rectangle.",
    answer: "I would use a monotonic increasing stack of indexes. When I see a bar shorter than the one at the top of the stack, I know the taller bar cannot extend further, so I can compute the best rectangle using that height. This turns a hard nested-scan problem into O(n).",
    solution: "Append a zero-height sentinel or handle the final cleanup after the scan. For each index, while the current height is smaller than the height at the top stack index, pop that index and compute the rectangle area using the popped height and the current index as the right boundary. Push the current index afterward.",
    code: `function solve_largest_rectangle_histogram(heights) {\n  const stack = [];\n  let best = 0;\n  const extended = [...heights, 0];\n  for (let index = 0; index < extended.length; index += 1) {\n    while (stack.length && extended[stack[stack.length - 1]] > extended[index]) {\n      const height = extended[stack.pop()];\n      const left = stack.length ? stack[stack.length - 1] + 1 : 0;\n      best = Math.max(best, height * (index - left));\n    }\n    stack.push(index);\n  }\n  return best;\n}\n`
  },
  {
    name: "Decode String",
    statement: "Given an encoded string where patterns like 3[a2[c]] are allowed, return the decoded string.",
    answer: "I would use stacks to remember the string built before a bracket and the repeat count that should be applied to the bracket contents. Nested encoding is exactly why stack-based context saving works well here.",
    solution: "Scan the string from left to right. Build numbers when digits appear. On an opening bracket, push the current string and repeat count, then reset both. On a closing bracket, pop the last saved string and count, repeat the current substring that many times, and append it to the saved prefix. Plain characters are appended to the current substring.",
    code: `function solve_decode_string(text) {\n  const countStack = [];\n  const stringStack = [];\n  let current = '';\n  let number = 0;\n  for (const char of text) {\n    if (char >= '0' && char <= '9') {\n      number = number * 10 + Number(char);\n    } else if (char === '[') {\n      countStack.push(number);\n      stringStack.push(current);\n      number = 0;\n      current = '';\n    } else if (char === ']') {\n      const repeat = countStack.pop();\n      const prefix = stringStack.pop();\n      current = prefix + current.repeat(repeat);\n    } else {\n      current += char;\n    }\n  }\n  return current;\n}\n`
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
        tip: "Start by naming the invariant for each pointer or stack entry before you write code. That usually makes the explanation much clearer."
      });
    }
  }
  return items;
}

const targets = [
  {
    slug: "coding-two-pointer-problems",
    title: "Two Pointer Coding Problems",
    summary: "High-value two-pointer interview problems with clearer statements, explanations, and JavaScript solutions.",
    questions: buildQuestions("coding-two-pointer-problems", twoPointerProblems)
  },
  {
    slug: "coding-stack-queue-problems",
    title: "Stack and Queue Coding Problems",
    summary: "High-value stack and queue interview problems with stronger explanations and cleaner JavaScript solutions.",
    questions: buildQuestions("coding-stack-queue-problems", stackQueueProblems)
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
