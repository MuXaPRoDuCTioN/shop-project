export function findPath(start, goal, isWalkable, mapWidth, mapHeight) {
  const openSet = [];
  const cameFrom = new Map();

  function nodeKey(p) { return `${p.x},${p.y}`; }
  function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  const gScore = new Map();
  const fScore = new Map();

  gScore.set(nodeKey(start), 0);
  fScore.set(nodeKey(start), heuristic(start, goal));
  openSet.push({ pos: start, fScore: fScore.get(nodeKey(start)) });

  while (openSet.length) {
    openSet.sort((a, b) => a.fScore - b.fScore);
    const current = openSet.shift().pos;

    if (current.x === goal.x && current.y === goal.y) {
      const path = [];
      let cur = current;
      while (cameFrom.has(nodeKey(cur))) {
        path.unshift(cur);
        cur = cameFrom.get(nodeKey(cur));
      }
      path.unshift(start);
      return path;
    }

    const directions = [
      { x: 1, y: 0 }, { x: -1, y: 0 },
      { x: 0, y: 1 }, { x: 0, y: -1 },
    ];

    for (const d of directions) {
      const neighbor = { x: current.x + d.x, y: current.y + d.y };
      if (neighbor.x < 0 || neighbor.y < 0 || neighbor.x >= mapWidth || neighbor.y >= mapHeight) continue;
      if (!isWalkable(neighbor.x, neighbor.y)) continue;

      const tentativeG = gScore.get(nodeKey(current)) + 1;
      const nk = nodeKey(neighbor);
      if (!gScore.has(nk) || tentativeG < gScore.get(nk)) {
        cameFrom.set(nk, current);
        gScore.set(nk, tentativeG);
        fScore.set(nk, tentativeG + heuristic(neighbor, goal));
        if (!openSet.some(n => n.pos.x === neighbor.x && n.pos.y === neighbor.y)) {
          openSet.push({ pos: neighbor, fScore: fScore.get(nk) });
        }
      }
    }
  }

  return []; // нет пути
}
