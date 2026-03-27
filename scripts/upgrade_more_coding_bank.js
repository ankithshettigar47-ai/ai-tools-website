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

const binarySearchProblems = [
  {
    name: "Binary Search",
    statement: "Given a sorted array and a target value, return the index of the target or negative one if it is absent.",
    answer: "I would use classic binary search because the array is already sorted. On each step I compare the middle element with the target and discard half of the remaining search space. That gives O(log n) time and is the baseline binary search problem interviewers expect.",
    solution: "Keep left and right pointers around the current valid search range. Compute the middle index carefully. If nums[mid] equals the target, return mid. If nums[mid] is smaller than the target, move left to mid plus one. Otherwise move right to mid minus one. If the loop finishes, the target is not present.",
    code: `function solve_binary_search(nums, target) {\n  let left = 0;\n  let right = nums.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}\n`
  },
  {
    name: "Search Insert Position",
    statement: "Given a sorted array and a target value, return the index where the target exists or should be inserted to preserve sorted order.",
    answer: "I would still use binary search, but instead of returning negative one when the target is missing, I return the left boundary where the search converges. That left pointer ends at the first valid insertion point, which makes the solution both simple and efficient.",
    solution: "Run a lower-bound style binary search. If nums[mid] is less than the target, move left to mid plus one. Otherwise move right to mid minus one because mid might still be the insertion point. When the loop ends, left is the correct insertion index.",
    code: `function solve_search_insert_position(nums, target) {\n  let left = 0;\n  let right = nums.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (nums[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return left;\n}\n`
  },
  {
    name: "First And Last Position In Sorted Array",
    statement: "Given a sorted array and a target value, return the first and last index of the target or [-1, -1] if it is absent.",
    answer: "I would use binary search twice: once to find the leftmost occurrence and once to find the rightmost occurrence. This is cleaner than scanning outward from one match, and it keeps the overall complexity at O(log n).",
    solution: "Write a helper that finds the first index where the value is at least the target. Use it for the target itself and again for target plus one. The start is the lower bound of target, and the end is the lower bound of target plus one minus one. If the start is outside the array or not equal to the target, return [-1, -1].",
    code: `function solve_search_range(nums, target) {\n  function lowerBound(value) {\n    let left = 0;\n    let right = nums.length;\n    while (left < right) {\n      const mid = Math.floor((left + right) / 2);\n      if (nums[mid] < value) left = mid + 1;\n      else right = mid;\n    }\n    return left;\n  }\n\n  const start = lowerBound(target);\n  if (start === nums.length || nums[start] !== target) return [-1, -1];\n  const end = lowerBound(target + 1) - 1;\n  return [start, end];\n}\n`
  },
  {
    name: "Find Minimum In Rotated Sorted Array",
    statement: "Given a sorted array rotated at an unknown pivot with no duplicates, return the minimum element.",
    answer: "I would use binary search on the rotation property. One half of the array is always sorted, and by comparing the middle value with the right boundary I can tell whether the minimum lies to the left or right. This avoids linear scanning.",
    solution: "Keep left and right pointers. Compute mid. If nums[mid] is greater than nums[right], the minimum must be to the right of mid, so move left to mid plus one. Otherwise the minimum is at mid or to its left, so move right to mid. When left meets right, that position holds the minimum.",
    code: `function solve_find_min_rotated(nums) {\n  let left = 0;\n  let right = nums.length - 1;\n  while (left < right) {\n    const mid = Math.floor((left + right) / 2);\n    if (nums[mid] > nums[right]) left = mid + 1;\n    else right = mid;\n  }\n  return nums[left];\n}\n`
  },
  {
    name: "Search In Rotated Sorted Array",
    statement: "Given a rotated sorted array with distinct values and a target, return the index of the target or negative one if absent.",
    answer: "I would still use binary search, but on each step I first determine which half is normally sorted. Then I decide whether the target lies inside that sorted half. This preserves the logarithmic complexity even though the array has been rotated.",
    solution: "At each iteration compute mid. If nums[mid] equals the target, return mid. If the left half from left to mid is sorted, check whether the target lies inside that range. If it does, move right leftward; otherwise search the other half. If the right half is sorted, apply the symmetrical check there.",
    code: `function solve_search_rotated_array(nums, target) {\n  let left = 0;\n  let right = nums.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (nums[mid] === target) return mid;\n    if (nums[left] <= nums[mid]) {\n      if (nums[left] <= target && target < nums[mid]) right = mid - 1;\n      else left = mid + 1;\n    } else {\n      if (nums[mid] < target && target <= nums[right]) left = mid + 1;\n      else right = mid - 1;\n    }\n  }\n  return -1;\n}\n`
  },
  {
    name: "Peak Index In Mountain Array",
    statement: "Given an array that strictly increases and then strictly decreases, return the peak index.",
    answer: "I would use binary search on the slope. If the middle value is smaller than the value to its right, I know I am on the increasing side and the peak is further right. Otherwise I am on the decreasing side or at the peak, so the answer is at mid or to the left.",
    solution: "Search on the range [0, n - 2] while comparing nums[mid] and nums[mid + 1]. If nums[mid] is smaller, move left to mid plus one. Otherwise move right to mid. When the pointers meet, that index is the peak.",
    code: `function solve_peak_index_mountain(nums) {\n  let left = 0;\n  let right = nums.length - 1;\n  while (left < right) {\n    const mid = Math.floor((left + right) / 2);\n    if (nums[mid] < nums[mid + 1]) left = mid + 1;\n    else right = mid;\n  }\n  return left;\n}\n`
  },
  {
    name: "Sqrt X",
    statement: "Given a non-negative integer x, return the integer square root of x, rounded down.",
    answer: "I would binary search on the answer itself between zero and x. The key comparison is whether mid times mid is less than or equal to x. This avoids floating-point issues and works efficiently even for large values.",
    solution: "Handle small values directly. Search from one to x. If mid squared is less than or equal to x, record mid as a valid answer and move left to mid plus one to look for a larger square root. Otherwise move right to mid minus one. The last recorded valid mid is the integer square root.",
    code: `function solve_integer_sqrt(x) {\n  if (x < 2) return x;\n  let left = 1;\n  let right = x;\n  let answer = 0;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    const square = mid * mid;\n    if (square <= x) {\n      answer = mid;\n      left = mid + 1;\n    } else {\n      right = mid - 1;\n    }\n  }\n  return answer;\n}\n`
  },
  {
    name: "Koko Eating Bananas",
    statement: "Given banana piles and a limited number of hours, return the minimum eating speed that lets Koko finish on time.",
    answer: "This is binary search on the answer space rather than on array indexes. If a speed works, every larger speed also works, which creates the monotonic condition binary search needs. That is the core idea interviewers want to hear.",
    solution: "Search the speed between one and the largest pile size. For a candidate speed, compute the total hours by summing the ceiling of pile divided by speed across all piles. If the total hours fit within the limit, record the speed and search smaller speeds. Otherwise search larger speeds.",
    code: `function solve_koko_bananas(piles, hours) {\n  let left = 1;\n  let right = Math.max(...piles);\n  let answer = right;\n  while (left <= right) {\n    const speed = Math.floor((left + right) / 2);\n    let needed = 0;\n    for (const pile of piles) {\n      needed += Math.ceil(pile / speed);\n    }\n    if (needed <= hours) {\n      answer = speed;\n      right = speed - 1;\n    } else {\n      left = speed + 1;\n    }\n  }\n  return answer;\n}\n`
  },
  {
    name: "Capacity To Ship Packages Within D Days",
    statement: "Given package weights and a number of days, return the minimum ship capacity needed to ship all packages within that time.",
    answer: "This is another binary search on the answer. A capacity either works or it does not, and if one capacity works then any larger capacity also works. That monotonic behavior is what makes binary search the right pattern here.",
    solution: "Search between the heaviest single package and the sum of all weights. For a candidate capacity, simulate one pass through the weights and count how many days are needed if packages must stay in order. If the days fit within the limit, try a smaller capacity; otherwise try a larger one.",
    code: `function solve_ship_within_days(weights, days) {\n  let left = Math.max(...weights);\n  let right = weights.reduce((sum, value) => sum + value, 0);\n  let answer = right;\n  while (left <= right) {\n    const capacity = Math.floor((left + right) / 2);\n    let usedDays = 1;\n    let currentLoad = 0;\n    for (const weight of weights) {\n      if (currentLoad + weight > capacity) {\n        usedDays += 1;\n        currentLoad = 0;\n      }\n      currentLoad += weight;\n    }\n    if (usedDays <= days) {\n      answer = capacity;\n      right = capacity - 1;\n    } else {\n      left = capacity + 1;\n    }\n  }\n  return answer;\n}\n`
  },
  {
    name: "Find Duplicate Number",
    statement: "Given an array containing n plus one integers where each integer is between one and n, return the duplicate value without modifying the array.",
    answer: "A strong interview approach is binary search on the value range rather than the indexes. If I count how many values are less than or equal to mid and that count is larger than mid, the duplicate must be in the lower half. This uses the pigeonhole principle and avoids modifying the input.",
    solution: "Search on the value range from one to n. For each candidate mid, count how many numbers in the array are less than or equal to mid. If that count is greater than mid, the duplicate is in the lower half including mid. Otherwise it is in the upper half. Continue until left equals right.",
    code: `function solve_find_duplicate_number(nums) {\n  let left = 1;\n  let right = nums.length - 1;\n  while (left < right) {\n    const mid = Math.floor((left + right) / 2);\n    let count = 0;\n    for (const value of nums) {\n      if (value <= mid) count += 1;\n    }\n    if (count > mid) right = mid;\n    else left = mid + 1;\n  }\n  return left;\n}\n`
  }
];

const linkedListProblems = [
  {
    name: "Reverse Linked List",
    statement: "Given the head of a singly linked list, reverse the list and return the new head.",
    answer: "I would reverse the pointers iteratively with previous, current, and next references. It is the clearest in-place approach, it uses O(1) extra space, and it shows good pointer discipline in an interview.",
    solution: "Initialize previous as null and current as head. While current is not null, store current.next in a temporary variable, point current.next to previous, move previous to current, and move current to the saved next node. When the loop ends, previous is the new head.",
    code: `function solve_reverse_linked_list(head) {\n  let previous = null;\n  let current = head;\n  while (current) {\n    const nextNode = current.next;\n    current.next = previous;\n    previous = current;\n    current = nextNode;\n  }\n  return previous;\n}\n`
  },
  {
    name: "Middle Of The Linked List",
    statement: "Given the head of a singly linked list, return the middle node. If there are two middle nodes, return the second one.",
    answer: "I would use slow and fast pointers. Slow moves one step at a time while fast moves two steps. When fast reaches the end, slow is at the middle. This is the standard O(n) time and O(1) space solution interviewers expect.",
    solution: "Initialize both slow and fast at head. Move slow by one node and fast by two nodes while fast and fast.next both exist. When the loop stops, slow points to the middle node.",
    code: `function solve_middle_linked_list(head) {\n  let slow = head;\n  let fast = head;\n  while (fast && fast.next) {\n    slow = slow.next;\n    fast = fast.next.next;\n  }\n  return slow;\n}\n`
  },
  {
    name: "Merge Two Sorted Lists",
    statement: "Given the heads of two sorted linked lists, merge them into one sorted linked list and return its head.",
    answer: "I would use a dummy head and advance through both lists, always taking the smaller current node. The dummy node removes edge cases around the first insertion and keeps the merge logic clean.",
    solution: "Create a dummy node and a tail pointer. While both input lists still have nodes, attach the smaller node to tail and advance the corresponding list. After the loop, attach the remaining non-empty list. Return dummy.next as the merged head.",
    code: `function solve_merge_two_sorted_lists(list1, list2) {\n  const dummy = { val: 0, next: null };\n  let tail = dummy;\n  let left = list1;\n  let right = list2;\n  while (left && right) {\n    if (left.val <= right.val) {\n      tail.next = left;\n      left = left.next;\n    } else {\n      tail.next = right;\n      right = right.next;\n    }\n    tail = tail.next;\n  }\n  tail.next = left || right;\n  return dummy.next;\n}\n`
  },
  {
    name: "Linked List Cycle",
    statement: "Given the head of a linked list, determine whether the list contains a cycle.",
    answer: "I would use Floyd's tortoise and hare algorithm. Slow moves one step while fast moves two. If there is a cycle, the fast pointer will eventually lap the slow pointer and they will meet. If fast reaches null, there is no cycle.",
    solution: "Initialize slow and fast at head. Move slow by one and fast by two while fast and fast.next exist. If slow and fast ever point to the same node, return true. If the loop ends because fast cannot move, return false.",
    code: `function solve_linked_list_cycle(head) {\n  let slow = head;\n  let fast = head;\n  while (fast && fast.next) {\n    slow = slow.next;\n    fast = fast.next.next;\n    if (slow === fast) return true;\n  }\n  return false;\n}\n`
  },
  {
    name: "Palindrome Linked List",
    statement: "Given the head of a singly linked list, determine whether the sequence of values forms a palindrome.",
    answer: "I would find the middle with slow and fast pointers, reverse the second half, and then compare both halves node by node. That keeps the space usage constant and demonstrates several core linked-list techniques together.",
    solution: "Find the midpoint. Reverse the list starting from the middle or the node after the middle depending on parity. Compare the first half and reversed second half one node at a time. If every compared value matches, the list is a palindrome. Optionally restore the list if required by the problem setting.",
    code: `function solve_palindrome_linked_list(head) {\n  let slow = head;\n  let fast = head;\n  while (fast && fast.next) {\n    slow = slow.next;\n    fast = fast.next.next;\n  }\n\n  let previous = null;\n  let current = slow;\n  while (current) {\n    const nextNode = current.next;\n    current.next = previous;\n    previous = current;\n    current = nextNode;\n  }\n\n  let left = head;\n  let right = previous;\n  while (right) {\n    if (left.val !== right.val) return false;\n    left = left.next;\n    right = right.next;\n  }\n  return true;\n}\n`
  },
  {
    name: "Remove Nth Node From End Of List",
    statement: "Given the head of a linked list and an integer n, remove the nth node from the end and return the head.",
    answer: "I would use two pointers with a dummy head. First I move the fast pointer n plus one steps ahead, then move both pointers together until fast reaches the end. At that point slow is just before the node that must be removed.",
    solution: "Create a dummy node pointing to head. Move fast forward n plus one steps from the dummy. Then move fast and slow together until fast becomes null. Now slow.next is the node to remove, so bypass it by setting slow.next to slow.next.next. Return dummy.next.",
    code: `function solve_remove_nth_from_end(head, n) {\n  const dummy = { val: 0, next: head };\n  let slow = dummy;\n  let fast = dummy;\n  for (let step = 0; step <= n; step += 1) {\n    fast = fast.next;\n  }\n  while (fast) {\n    slow = slow.next;\n    fast = fast.next;\n  }\n  slow.next = slow.next.next;\n  return dummy.next;\n}\n`
  },
  {
    name: "Intersection Of Two Linked Lists",
    statement: "Given the heads of two singly linked lists, return the node where the two lists intersect, or null if they do not intersect.",
    answer: "I would use the pointer-switching trick. One pointer starts on each list, and when it reaches the end it switches to the other list's head. If the lists intersect, the pointers meet at the intersection after equalizing path lengths. If not, they both reach null.",
    solution: "Initialize pointerA at headA and pointerB at headB. On each step move each pointer forward by one node, but when a pointer reaches the end of its list, redirect it to the head of the other list. Continue until the pointers are equal. That shared node or null is the answer.",
    code: `function solve_intersection_linked_lists(headA, headB) {\n  let pointerA = headA;\n  let pointerB = headB;\n  while (pointerA !== pointerB) {\n    pointerA = pointerA ? pointerA.next : headB;\n    pointerB = pointerB ? pointerB.next : headA;\n  }\n  return pointerA;\n}\n`
  },
  {
    name: "Add Two Numbers",
    statement: "Given two non-empty linked lists representing two non-negative integers in reverse digit order, return the sum as a linked list in the same reverse order.",
    answer: "I would simulate grade-school addition while walking both lists together. At each step I add the current digits and the carry, create a new node for the ones digit, and carry the tens digit forward. This is a natural linked-list construction problem.",
    solution: "Use a dummy head and tail pointer for the result list. Keep a carry initialized to zero. While either list still has nodes or carry is non-zero, add the current digits and carry, create a node with sum modulo ten, update carry to Math.floor(sum divided by ten), and advance the input pointers when possible.",
    code: `function solve_add_two_numbers(list1, list2) {\n  const dummy = { val: 0, next: null };\n  let tail = dummy;\n  let carry = 0;\n  let left = list1;\n  let right = list2;\n  while (left || right || carry) {\n    const total = (left ? left.val : 0) + (right ? right.val : 0) + carry;\n    carry = Math.floor(total / 10);\n    tail.next = { val: total % 10, next: null };\n    tail = tail.next;\n    if (left) left = left.next;\n    if (right) right = right.next;\n  }\n  return dummy.next;\n}\n`
  },
  {
    name: "Reorder List",
    statement: "Given a singly linked list L0 to Ln, reorder it in-place to L0, Ln, L1, Ln-1, and so on.",
    answer: "I would break this into three steps: find the middle, reverse the second half, and merge the two halves by alternating nodes. That decomposition keeps the pointer logic manageable and is exactly how interviewers expect this problem to be structured.",
    solution: "Find the midpoint with slow and fast pointers. Reverse the second half of the list. Then merge the first half and reversed second half by alternating nodes until the second half is exhausted. Be careful to save next pointers before rewiring links.",
    code: `function solve_reorder_list(head) {\n  if (!head || !head.next) return head;\n\n  let slow = head;\n  let fast = head;\n  while (fast.next && fast.next.next) {\n    slow = slow.next;\n    fast = fast.next.next;\n  }\n\n  let previous = null;\n  let current = slow.next;\n  slow.next = null;\n  while (current) {\n    const nextNode = current.next;\n    current.next = previous;\n    previous = current;\n    current = nextNode;\n  }\n\n  let first = head;\n  let second = previous;\n  while (second) {\n    const firstNext = first.next;\n    const secondNext = second.next;\n    first.next = second;\n    second.next = firstNext;\n    first = firstNext;\n    second = secondNext;\n  }\n  return head;\n}\n`
  },
  {
    name: "Sort List",
    statement: "Given the head of a linked list, return the list sorted in ascending order in O(n log n) time.",
    answer: "I would use merge sort because linked lists split and merge naturally without random access. Finding the middle with slow and fast pointers, sorting each half recursively, and merging them gives the required O(n log n) time with clean pointer logic.",
    solution: "Handle the base case of zero or one node. Find the midpoint and split the list into two halves. Recursively sort both halves. Then merge the sorted halves with the standard linked-list merge routine. Return the merged head.",
    code: `function solve_sort_list(head) {\n  if (!head || !head.next) return head;\n\n  let slow = head;\n  let fast = head.next;\n  while (fast && fast.next) {\n    slow = slow.next;\n    fast = fast.next.next;\n  }\n\n  const rightHead = slow.next;\n  slow.next = null;\n  const leftSorted = solve_sort_list(head);\n  const rightSorted = solve_sort_list(rightHead);\n\n  const dummy = { val: 0, next: null };\n  let tail = dummy;\n  let left = leftSorted;\n  let right = rightSorted;\n  while (left && right) {\n    if (left.val <= right.val) {\n      tail.next = left;\n      left = left.next;\n    } else {\n      tail.next = right;\n      right = right.next;\n    }\n    tail = tail.next;\n  }\n  tail.next = left || right;\n  return dummy.next;\n}\n`
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
        tip: "State the search invariant or pointer role before coding. That usually makes binary search and linked-list answers much easier for the interviewer to follow."
      });
    }
  }
  return items;
}

const targets = [
  {
    slug: "coding-binary-search-problems",
    title: "Binary Search Coding Problems",
    summary: "High-value binary search interview problems with clearer problem framing, stronger explanations, and JavaScript solutions.",
    questions: buildQuestions("coding-binary-search-problems", binarySearchProblems)
  },
  {
    slug: "coding-linked-list-problems",
    title: "Linked List Coding Problems",
    summary: "High-value linked list interview problems with stronger explanations and cleaner JavaScript solutions.",
    questions: buildQuestions("coding-linked-list-problems", linkedListProblems)
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
