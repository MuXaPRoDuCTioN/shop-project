export function findPath(start, goal, isWalkable, mapWidth, mapHeight) {
  const openSet = [];
  const cameFrom = new Map();

  function nodeKey(p) { return p.x + ',' + p.y; }

  function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  const gScore = new Map();
  const fScore = new Map();

  gScore.set(nodeKey(start), 0);
  fScore.set(nodeKey(start), heuristic(start, goal));

  openSet.push({ pos: start, fScore: fScore.get(nodeKey(start)) });

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.fScore - b.fScore);
    const current = openSet.shift().pos;

    if (current.x === goal.x && current.y === goal.y) {
      // reconstruct path
      const path = [];
      let cur = current;
      while (cameFrom.has(nodeKey(cur))) {
        path.unshift(cur);
        cur = cameFrom.get(nodeKey(cur));
      }
      path.unshift(start);
      return path;
    }

    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ].filter(p => p.x >= 0 && p.y >= 0 && p.x < mapWidth && p.y < mapHeight && isWalkable(p.x, p.y));

    for (const neighbor of neighbors) {
      const tentativeGScore = gScore.get(nodeKey(current)) + 1;
      const neighborKey = nodeKey(neighbor);

      if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeGScore);
        fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, goal));

        if (!openSet.find(n => n.pos.x === neighbor.x && n.pos.y === neighbor.y)) {
          openSet.push({ pos: neighbor, fScore: fScore.get(neighborKey) });
        }
      }
    }
  }

  return null; // no path found
}
