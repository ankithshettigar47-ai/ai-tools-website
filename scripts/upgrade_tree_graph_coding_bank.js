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

const treeProblems = [
  {
    name: "Maximum Depth Of Binary Tree",
    statement: "Given the root of a binary tree, return the maximum depth of the tree.",
    answer: "I would solve this with DFS because the depth of a node depends on the deeper of its left and right subtrees. Recursion is a natural fit here because each subtree is the same problem on a smaller input.",
    solution: "If the node is null, its depth is zero. Otherwise recursively compute the depth of the left subtree and the right subtree, take the maximum, and add one for the current node. That directly matches the definition of tree depth.",
    code: `function solve_max_depth(root) {\n  if (!root) return 0;\n  return 1 + Math.max(solve_max_depth(root.left), solve_max_depth(root.right));\n}\n`
  },
  {
    name: "Same Tree",
    statement: "Given two binary trees, determine whether they are structurally identical and contain the same values.",
    answer: "I would compare both trees with DFS at the same time. At each pair of nodes, both the structure and the value must match. If one node is null and the other is not, or if their values differ, the trees are not the same.",
    solution: "If both nodes are null, return true. If only one is null, return false. If their values differ, return false. Otherwise recursively compare the left children and the right children. The trees are the same only if both recursive comparisons return true.",
    code: `function solve_same_tree(left, right) {\n  if (!left && !right) return true;\n  if (!left || !right) return false;\n  if (left.val !== right.val) return false;\n  return solve_same_tree(left.left, right.left) && solve_same_tree(left.right, right.right);\n}\n`
  },
  {
    name: "Invert Binary Tree",
    statement: "Given the root of a binary tree, invert the tree and return its root.",
    answer: "I would use DFS and swap each node's left and right children. The operation is local at each node, and recursion lets me apply the same transformation across the whole tree cleanly.",
    solution: "If the node is null, return null. Swap its left and right references. Then recursively invert the new left subtree and the new right subtree. Return the current node after the recursive calls finish.",
    code: `function solve_invert_tree(root) {\n  if (!root) return null;\n  [root.left, root.right] = [root.right, root.left];\n  solve_invert_tree(root.left);\n  solve_invert_tree(root.right);\n  return root;\n}\n`
  },
  {
    name: "Binary Tree Path Sum",
    statement: "Given the root of a binary tree and a target sum, determine whether the tree has a root-to-leaf path whose values add up to the target.",
    answer: "I would use DFS while carrying the remaining sum needed. Every recursive call reduces the target by the current node's value, and at a leaf I simply check whether the remaining sum matches that leaf.",
    solution: "If the node is null, return false. Subtract the current node's value from the target. If the node is a leaf, return whether the remaining target is zero. Otherwise recurse into the left and right children with the updated target and return true if either side succeeds.",
    code: `function solve_has_path_sum(root, targetSum) {\n  if (!root) return false;\n  const remaining = targetSum - root.val;\n  if (!root.left && !root.right) return remaining === 0;\n  return solve_has_path_sum(root.left, remaining) || solve_has_path_sum(root.right, remaining);\n}\n`
  },
  {
    name: "Diameter Of Binary Tree",
    statement: "Given the root of a binary tree, return the length of the diameter, where the diameter is the number of edges on the longest path between any two nodes.",
    answer: "I would use post-order DFS because at each node I need the height of the left subtree and the right subtree before I can compute a candidate diameter through that node. A single traversal can compute both heights and the best diameter seen so far.",
    solution: "Define a DFS helper that returns the height of a subtree. For each node, recursively get the left and right heights, update a shared best diameter with leftHeight plus rightHeight, and return one plus the larger height. After the traversal, return the best diameter recorded.",
    code: `function solve_diameter_binary_tree(root) {\n  let best = 0;\n\n  function dfs(node) {\n    if (!node) return 0;\n    const leftHeight = dfs(node.left);\n    const rightHeight = dfs(node.right);\n    best = Math.max(best, leftHeight + rightHeight);\n    return 1 + Math.max(leftHeight, rightHeight);\n  }\n\n  dfs(root);\n  return best;\n}\n`
  },
  {
    name: "Balanced Binary Tree",
    statement: "Given the root of a binary tree, determine whether it is height-balanced.",
    answer: "I would use DFS that returns subtree height, but also uses a sentinel value to signal imbalance. That way I can stop propagating useful heights once I already know the tree is not balanced, keeping the logic efficient and clean.",
    solution: "Write a helper that returns the height of a subtree or negative one if that subtree is unbalanced. Recursively compute the left and right heights. If either side is already negative one or their difference exceeds one, return negative one. Otherwise return one plus the larger height. The tree is balanced when the final result is not negative one.",
    code: `function solve_balanced_binary_tree(root) {\n  function dfs(node) {\n    if (!node) return 0;\n    const leftHeight = dfs(node.left);\n    if (leftHeight === -1) return -1;\n    const rightHeight = dfs(node.right);\n    if (rightHeight === -1) return -1;\n    if (Math.abs(leftHeight - rightHeight) > 1) return -1;\n    return 1 + Math.max(leftHeight, rightHeight);\n  }\n\n  return dfs(root) !== -1;\n}\n`
  },
  {
    name: "Lowest Common Ancestor In A Binary Search Tree",
    statement: "Given a binary search tree and two nodes, return their lowest common ancestor.",
    answer: "Because it is a BST, I can use the ordering property instead of searching the entire tree. If both target values are smaller than the current node, I go left. If both are larger, I go right. Otherwise the current node is the split point and therefore the LCA.",
    solution: "Start at the root. While the current node exists, compare both target values to the current value. If both are smaller, move to the left child. If both are larger, move to the right child. Otherwise return the current node because one target is on each side or one target is the current node itself.",
    code: `function solve_lca_bst(root, p, q) {\n  let current = root;\n  while (current) {\n    if (p.val < current.val && q.val < current.val) {\n      current = current.left;\n    } else if (p.val > current.val && q.val > current.val) {\n      current = current.right;\n    } else {\n      return current;\n    }\n  }\n  return null;\n}\n`
  },
  {
    name: "Validate Binary Search Tree",
    statement: "Given the root of a binary tree, determine whether it is a valid binary search tree.",
    answer: "I would validate each node against a range of allowable values rather than only comparing it with its direct parent. A node in the left subtree must be smaller than every ancestor that sets an upper bound, and similarly for the right subtree. DFS with min and max bounds captures that correctly.",
    solution: "Write a DFS helper that takes a node plus a lower and upper bound. If the node is null, it is valid. If the node's value is not strictly between the bounds, return false. Recurse left with the same lower bound and the current value as the new upper bound, and recurse right with the current value as the new lower bound.",
    code: `function solve_validate_bst(root) {\n  function dfs(node, lower, upper) {\n    if (!node) return true;\n    if (node.val <= lower || node.val >= upper) return false;\n    return dfs(node.left, lower, node.val) && dfs(node.right, node.val, upper);\n  }\n\n  return dfs(root, -Infinity, Infinity);\n}\n`
  },
  {
    name: "Kth Smallest Element In A BST",
    statement: "Given the root of a binary search tree and an integer k, return the kth smallest value in the tree.",
    answer: "I would use in-order traversal because it visits BST nodes in sorted order. As I walk the tree, I count how many nodes I have seen, and when that count reaches k I return the current value.",
    solution: "Perform DFS in-order: left subtree, current node, right subtree. Keep a counter outside the recursion. After processing the left subtree, increment the counter for the current node. If the counter equals k, record the answer. Otherwise continue to the right subtree.",
    code: `function solve_kth_smallest_bst(root, k) {\n  let seen = 0;\n  let answer = null;\n\n  function dfs(node) {\n    if (!node || answer !== null) return;\n    dfs(node.left);\n    seen += 1;\n    if (seen === k) {\n      answer = node.val;\n      return;\n    }\n    dfs(node.right);\n  }\n\n  dfs(root);\n  return answer;\n}\n`
  },
  {
    name: "Binary Tree Right Side View",
    statement: "Given the root of a binary tree, return the values visible when looking at the tree from the right side.",
    answer: "A clean DFS approach is to visit the right child before the left child and record the first node seen at each depth. That first node is exactly what would be visible from the right side.",
    solution: "Traverse the tree depth-first, visiting the right child before the left child. Keep a result array. When first reaching a depth equal to the current result length, push that node's value because it is the rightmost node encountered at that level. Continue recursion through both children.",
    code: `function solve_right_side_view(root) {\n  const result = [];\n\n  function dfs(node, depth) {\n    if (!node) return;\n    if (depth === result.length) result.push(node.val);\n    dfs(node.right, depth + 1);\n    dfs(node.left, depth + 1);\n  }\n\n  dfs(root, 0);\n  return result;\n}\n`
  }
];

const graphProblems = [
  {
    name: "Number Of Islands",
    statement: "Given a grid of land and water cells, return the number of islands.",
    answer: "I would scan the grid and launch a traversal each time I find unvisited land. BFS works well because it explores one connected component at a time and marks every cell in that island so it is not counted again.",
    solution: "Iterate through every cell. When you find land, increment the island count and start a BFS from that cell. In the BFS, push the starting cell into a queue, mark it visited, and repeatedly expand to the four neighboring cells that are inside the grid and also land. Continue until the queue is empty.",
    code: `function solve_number_of_islands(grid) {\n  if (!grid.length) return 0;\n  const rows = grid.length;\n  const cols = grid[0].length;\n  let count = 0;\n  const directions = [[1,0],[-1,0],[0,1],[0,-1]];\n\n  for (let row = 0; row < rows; row += 1) {\n    for (let col = 0; col < cols; col += 1) {\n      if (grid[row][col] !== '1') continue;\n      count += 1;\n      const queue = [[row, col]];\n      grid[row][col] = '0';\n      for (let index = 0; index < queue.length; index += 1) {\n        const [currentRow, currentCol] = queue[index];\n        for (const [dr, dc] of directions) {\n          const nextRow = currentRow + dr;\n          const nextCol = currentCol + dc;\n          if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) continue;\n          if (grid[nextRow][nextCol] !== '1') continue;\n          grid[nextRow][nextCol] = '0';\n          queue.push([nextRow, nextCol]);\n        }\n      }\n    }\n  }\n\n  return count;\n}\n`
  },
  {
    name: "Clone Graph",
    statement: "Given a reference to a node in a connected graph, return a deep copy of the graph.",
    answer: "I would use BFS with a map from original nodes to cloned nodes. The map guarantees each original node is cloned once, and BFS lets me wire up neighbor lists while traversing the graph level by level.",
    solution: "If the input node is null, return null. Create a clone of the starting node and store it in a map. Use a queue for BFS. For each original node dequeued, examine its neighbors. If a neighbor has not been cloned yet, create its clone, store it, and enqueue the original neighbor. Append the cloned neighbor to the current cloned node's neighbors list.",
    code: `function solve_clone_graph(node) {\n  if (!node) return null;\n  const clones = new Map();\n  clones.set(node, { val: node.val, neighbors: [] });\n  const queue = [node];\n  for (let index = 0; index < queue.length; index += 1) {\n    const current = queue[index];\n    for (const neighbor of current.neighbors) {\n      if (!clones.has(neighbor)) {\n        clones.set(neighbor, { val: neighbor.val, neighbors: [] });\n        queue.push(neighbor);\n      }\n      clones.get(current).neighbors.push(clones.get(neighbor));\n    }\n  }\n  return clones.get(node);\n}\n`
  },
  {
    name: "Course Schedule",
    statement: "Given a number of courses and prerequisite pairs, determine whether it is possible to finish all courses.",
    answer: "I would model the courses as a directed graph and run topological sorting with BFS on indegrees. If I can process all nodes, there is no cycle and the schedule is possible. If some nodes remain unprocessed, the graph contains a cycle.",
    solution: "Build an adjacency list and an indegree array. Enqueue all courses whose indegree is zero. Repeatedly dequeue a course, count it as completed, and decrease the indegree of each dependent course. Whenever a dependent course reaches indegree zero, enqueue it. At the end, return whether the number of processed courses equals the total number of courses.",
    code: `function solve_course_schedule(numCourses, prerequisites) {\n  const graph = Array.from({ length: numCourses }, () => []);\n  const indegree = Array(numCourses).fill(0);\n\n  for (const [course, prereq] of prerequisites) {\n    graph[prereq].push(course);\n    indegree[course] += 1;\n  }\n\n  const queue = [];\n  for (let course = 0; course < numCourses; course += 1) {\n    if (indegree[course] === 0) queue.push(course);\n  }\n\n  let completed = 0;\n  for (let index = 0; index < queue.length; index += 1) {\n    const course = queue[index];\n    completed += 1;\n    for (const nextCourse of graph[course]) {\n      indegree[nextCourse] -= 1;\n      if (indegree[nextCourse] === 0) queue.push(nextCourse);\n    }\n  }\n\n  return completed === numCourses;\n}\n`
  },
  {
    name: "Course Schedule II",
    statement: "Given a number of courses and prerequisite pairs, return one valid ordering of courses or an empty array if no valid ordering exists.",
    answer: "This is the constructive version of topological sort. I would use the same BFS indegree approach as Course Schedule, but instead of only counting processed nodes I record them in order as they leave the queue.",
    solution: "Build the graph and indegree array. Enqueue all zero-indegree courses. While the queue is non-empty, remove one course, add it to the answer order, and reduce indegrees of its outgoing neighbors. Enqueue any neighbor that reaches zero indegree. If the final order contains all courses, return it; otherwise return an empty array.",
    code: `function solve_course_schedule_two(numCourses, prerequisites) {\n  const graph = Array.from({ length: numCourses }, () => []);\n  const indegree = Array(numCourses).fill(0);\n\n  for (const [course, prereq] of prerequisites) {\n    graph[prereq].push(course);\n    indegree[course] += 1;\n  }\n\n  const queue = [];\n  for (let course = 0; course < numCourses; course += 1) {\n    if (indegree[course] === 0) queue.push(course);\n  }\n\n  const order = [];\n  for (let index = 0; index < queue.length; index += 1) {\n    const course = queue[index];\n    order.push(course);\n    for (const nextCourse of graph[course]) {\n      indegree[nextCourse] -= 1;\n      if (indegree[nextCourse] === 0) queue.push(nextCourse);\n    }\n  }\n\n  return order.length === numCourses ? order : [];\n}\n`
  },
  {
    name: "Rotting Oranges",
    statement: "Given a grid of empty cells, fresh oranges, and rotten oranges, return the minimum number of minutes needed to rot all fresh oranges or negative one if impossible.",
    answer: "I would use multi-source BFS because all initially rotten oranges start spreading rot at the same time. BFS naturally models level-by-level time expansion, so each layer in the queue corresponds to one minute.",
    solution: "First scan the grid to count fresh oranges and enqueue all rotten oranges. Then run BFS level by level. For each orange in the current level, spread rot to its four valid neighboring fresh oranges, turning them rotten and enqueuing them for the next minute. Count how many levels are processed. If fresh oranges remain at the end, return negative one; otherwise return the minutes used.",
    code: `function solve_rotting_oranges(grid) {\n  const rows = grid.length;\n  const cols = grid[0].length;\n  const queue = [];\n  let fresh = 0;\n  const directions = [[1,0],[-1,0],[0,1],[0,-1]];\n\n  for (let row = 0; row < rows; row += 1) {\n    for (let col = 0; col < cols; col += 1) {\n      if (grid[row][col] === 2) queue.push([row, col]);\n      if (grid[row][col] === 1) fresh += 1;\n    }\n  }\n\n  let minutes = 0;\n  for (let head = 0; head < queue.length && fresh > 0; ) {\n    const levelSize = queue.length - head;\n    for (let count = 0; count < levelSize; count += 1) {\n      const [row, col] = queue[head];\n      head += 1;\n      for (const [dr, dc] of directions) {\n        const nextRow = row + dr;\n        const nextCol = col + dc;\n        if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) continue;\n        if (grid[nextRow][nextCol] !== 1) continue;\n        grid[nextRow][nextCol] = 2;\n        fresh -= 1;\n        queue.push([nextRow, nextCol]);\n      }\n    }\n    minutes += 1;\n  }\n\n  return fresh === 0 ? minutes : -1;\n}\n`
  },
  {
    name: "Word Ladder",
    statement: "Given a start word, an end word, and a dictionary, return the length of the shortest transformation sequence where one letter changes at a time.",
    answer: "I would use BFS because each valid one-letter transformation is an edge, and BFS guarantees the first time I reach the end word is through the shortest number of transformations. The main work is generating valid neighboring words efficiently.",
    solution: "Put the word list into a set for fast lookup. Start BFS from the begin word with distance one. For each word dequeued, try changing every character position to each letter from a to z to form candidate neighbors. If a candidate exists in the set, remove it from the set, enqueue it, and continue. Return the distance when the end word is reached, otherwise zero if BFS finishes without finding it.",
    code: `function solve_word_ladder(beginWord, endWord, wordList) {\n  const words = new Set(wordList);\n  if (!words.has(endWord)) return 0;\n  const queue = [[beginWord, 1]];\n\n  for (let index = 0; index < queue.length; index += 1) {\n    const [word, steps] = queue[index];\n    if (word === endWord) return steps;\n    for (let position = 0; position < word.length; position += 1) {\n      for (let code = 97; code <= 122; code += 1) {\n        const nextWord = word.slice(0, position) + String.fromCharCode(code) + word.slice(position + 1);\n        if (!words.has(nextWord)) continue;\n        words.delete(nextWord);\n        queue.push([nextWord, steps + 1]);\n      }\n    }\n  }\n\n  return 0;\n}\n`
  },
  {
    name: "Shortest Path In Binary Matrix",
    statement: "Given a binary matrix where zero cells are open and one cells are blocked, return the length of the shortest path from the top-left cell to the bottom-right cell using eight directions.",
    answer: "I would use BFS because all moves have equal cost, so BFS finds the shortest path in an unweighted grid. The queue stores positions along with the current path length, and visited cells are marked so they are processed once.",
    solution: "Check that both the start and end cells are open. Start BFS from the top-left cell with distance one. Repeatedly pop the next cell, and if it is the bottom-right cell return its distance. Otherwise explore the eight neighboring cells that are inside bounds and still open, mark them visited, and enqueue them with distance plus one. If BFS ends without reaching the target, return negative one.",
    code: `function solve_shortest_path_binary_matrix(grid) {\n  const rows = grid.length;\n  const cols = grid[0].length;\n  if (grid[0][0] !== 0 || grid[rows - 1][cols - 1] !== 0) return -1;\n  const directions = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];\n  const queue = [[0, 0, 1]];\n  grid[0][0] = 1;\n\n  for (let index = 0; index < queue.length; index += 1) {\n    const [row, col, distance] = queue[index];\n    if (row === rows - 1 && col === cols - 1) return distance;\n    for (const [dr, dc] of directions) {\n      const nextRow = row + dr;\n      const nextCol = col + dc;\n      if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) continue;\n      if (grid[nextRow][nextCol] !== 0) continue;\n      grid[nextRow][nextCol] = 1;\n      queue.push([nextRow, nextCol, distance + 1]);\n    }\n  }\n\n  return -1;\n}\n`
  },
  {
    name: "Open The Lock",
    statement: "Given a lock with four wheels, a set of deadends, and a target combination, return the minimum number of moves needed to reach the target from 0000.",
    answer: "I would model each lock state as a graph node and use BFS from 0000. Each move changes one wheel one step, so every edge has equal cost. BFS therefore gives the minimum number of turns, while the deadends set prevents invalid states.",
    solution: "Store deadends in a set and return negative one immediately if 0000 is blocked. Start BFS from 0000 with zero moves and a visited set. For each state, generate the eight neighboring states by turning each wheel one step forward or backward. Skip neighbors already visited or in deadends. If a generated state matches the target, return the move count plus one. If BFS finishes, return negative one.",
    code: `function solve_open_lock(deadends, target) {\n  const blocked = new Set(deadends);\n  if (blocked.has('0000')) return -1;\n  const visited = new Set(['0000']);\n  const queue = [['0000', 0]];\n\n  function neighbors(state) {\n    const result = [];\n    for (let index = 0; index < 4; index += 1) {\n      const digit = Number(state[index]);\n      for (const change of [-1, 1]) {\n        const nextDigit = (digit + change + 10) % 10;\n        result.push(state.slice(0, index) + nextDigit + state.slice(index + 1));\n      }\n    }\n    return result;\n  }\n\n  for (let index = 0; index < queue.length; index += 1) {\n    const [state, steps] = queue[index];\n    if (state === target) return steps;\n    for (const nextState of neighbors(state)) {\n      if (blocked.has(nextState) || visited.has(nextState)) continue;\n      visited.add(nextState);\n      queue.push([nextState, steps + 1]);\n    }\n  }\n\n  return -1;\n}\n`
  },
  {
    name: "Pacific Atlantic Water Flow",
    statement: "Given a matrix of heights, return all coordinates from which water can flow to both the Pacific and Atlantic oceans.",
    answer: "Instead of starting from every cell, I would reverse the flow and run graph traversal from the ocean borders inward. A cell can flow to an ocean if the ocean can reach it by moving to equal or higher neighboring heights. Running BFS from both oceans and intersecting the reachable cells is much more efficient.",
    solution: "Initialize two visited sets or matrices, one for Pacific reachability and one for Atlantic reachability. Start BFS from the Pacific border cells into neighbors with height greater than or equal to the current cell, and do the same from the Atlantic border. After both traversals finish, collect the coordinates marked reachable in both visited structures.",
    code: `function solve_pacific_atlantic(heights) {\n  const rows = heights.length;\n  const cols = heights[0].length;\n  const directions = [[1,0],[-1,0],[0,1],[0,-1]];\n\n  function bfs(starts) {\n    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));\n    const queue = [];\n    for (const [row, col] of starts) {\n      if (!visited[row][col]) {\n        visited[row][col] = true;\n        queue.push([row, col]);\n      }\n    }\n    for (let index = 0; index < queue.length; index += 1) {\n      const [row, col] = queue[index];\n      for (const [dr, dc] of directions) {\n        const nextRow = row + dr;\n        const nextCol = col + dc;\n        if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) continue;\n        if (visited[nextRow][nextCol]) continue;\n        if (heights[nextRow][nextCol] < heights[row][col]) continue;\n        visited[nextRow][nextCol] = true;\n        queue.push([nextRow, nextCol]);\n      }\n    }\n    return visited;\n  }\n\n  const pacificStarts = [];\n  const atlanticStarts = [];\n  for (let row = 0; row < rows; row += 1) {\n    pacificStarts.push([row, 0]);\n    atlanticStarts.push([row, cols - 1]);\n  }\n  for (let col = 0; col < cols; col += 1) {\n    pacificStarts.push([0, col]);\n    atlanticStarts.push([rows - 1, col]);\n  }\n\n  const pacific = bfs(pacificStarts);\n  const atlantic = bfs(atlanticStarts);\n  const result = [];\n  for (let row = 0; row < rows; row += 1) {\n    for (let col = 0; col < cols; col += 1) {\n      if (pacific[row][col] && atlantic[row][col]) result.push([row, col]);\n    }\n  }\n  return result;\n}\n`
  },
  {
    name: "Walls And Gates",
    statement: "Given a grid of rooms, walls, and gates, fill each empty room with the distance to its nearest gate.",
    answer: "I would use multi-source BFS starting from all gates simultaneously. That way, the first time an empty room is reached, it is guaranteed to be reached from the nearest gate because BFS expands uniformly by distance.",
    solution: "Enqueue all gates at distance zero. Then run BFS through the grid. For each dequeued cell, look at its four neighbors. If a neighbor is an empty room, write the current distance plus one into that room and enqueue it. Rooms already filled or blocked by walls are skipped.",
    code: `function solve_walls_and_gates(rooms) {\n  const rows = rooms.length;\n  const cols = rooms[0].length;\n  const queue = [];\n  const directions = [[1,0],[-1,0],[0,1],[0,-1]];\n\n  for (let row = 0; row < rows; row += 1) {\n    for (let col = 0; col < cols; col += 1) {\n      if (rooms[row][col] === 0) queue.push([row, col]);\n    }\n  }\n\n  for (let index = 0; index < queue.length; index += 1) {\n    const [row, col] = queue[index];\n    for (const [dr, dc] of directions) {\n      const nextRow = row + dr;\n      const nextCol = col + dc;\n      if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) continue;\n      if (rooms[nextRow][nextCol] !== 2147483647) continue;\n      rooms[nextRow][nextCol] = rooms[row][col] + 1;\n      queue.push([nextRow, nextCol]);\n    }\n  }\n\n  return rooms;\n}\n`
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
        tip: "State what each DFS call returns or what each BFS layer represents before coding. That makes tree and graph answers much easier to follow."
      });
    }
  }
  return items;
}

const targets = [
  {
    slug: "coding-tree-problems",
    title: "Tree DFS Coding Problems",
    summary: "High-value tree DFS interview problems with clearer problem framing, stronger explanations, and JavaScript solutions.",
    questions: buildQuestions("coding-tree-problems", treeProblems)
  },
  {
    slug: "coding-graph-problems",
    title: "Graph and BFS Coding Problems",
    summary: "High-value graph and BFS interview problems with stronger explanations and cleaner JavaScript solutions.",
    questions: buildQuestions("coding-graph-problems", graphProblems)
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
