// A* алгоритм поиска пути на клеточной карте
export function findPath(start, goal, isWalkable, mapWidth, mapHeight) {
  const openSet = [];               // Очередь на проверку (узлы, которые ещё не обработаны)
  const cameFrom = new Map();       // Карта предков: откуда пришли в каждую клетку

  // Уникальный ключ для точки по координатам
  function nodeKey(p) {
    return `${p.x},${p.y}`;
  }

  // Эвристическая функция: манхэттенское расстояние до цели
  function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  const gScore = new Map();         // Стоимость пути от старта до клетки
  const fScore = new Map();         // Прогнозируемая общая стоимость (g + эвристика)

  // Инициализация стартовой точки
  gScore.set(nodeKey(start), 0);
  fScore.set(nodeKey(start), heuristic(start, goal));
  openSet.push({ pos: start, fScore: fScore.get(nodeKey(start)) });

  // Основной цикл поиска
  while (openSet.length) {
    // Сортируем очередь по fScore и берём лучший узел
    openSet.sort((a, b) => a.fScore - b.fScore);
    const current = openSet.shift().pos;

    // Если цель достигнута — собираем путь
    if (current.x === goal.x && current.y === goal.y) {
      const path = [];
      let cur = current;
      while (cameFrom.has(nodeKey(cur))) {
        path.unshift(cur); // Вставляем в начало
        cur = cameFrom.get(nodeKey(cur));
      }
      path.unshift(start);
      return path;
    }

    // Возможные направления (вверх, вниз, влево, вправо)
    const directions = [
      { x: 1, y: 0 }, { x: -1, y: 0 },
      { x: 0, y: 1 }, { x: 0, y: -1 },
    ];

    for (const d of directions) {
      const neighbor = {
        x: current.x + d.x,
        y: current.y + d.y,
      };

      // Пропускаем клетки за пределами карты
      if (
        neighbor.x < 0 || neighbor.y < 0 ||
        neighbor.x >= mapWidth || neighbor.y >= mapHeight
      ) continue;

      // Пропускаем непроходимые клетки
      if (!isWalkable(neighbor.x, neighbor.y)) continue;

      const nk = nodeKey(neighbor);                         // Ключ соседа
      const tentativeG = gScore.get(nodeKey(current)) + 1;  // Новый gScore

      // Если путь к соседу короче — обновляем данные
      if (!gScore.has(nk) || tentativeG < gScore.get(nk)) {
        cameFrom.set(nk, current);                           // Запоминаем путь
        gScore.set(nk, tentativeG);                          // Обновляем gScore
        fScore.set(nk, tentativeG + heuristic(neighbor, goal)); // f = g + h

        // Добавляем в очередь, если ещё не в ней
        if (!openSet.some(n => n.pos.x === neighbor.x && n.pos.y === neighbor.y)) {
          openSet.push({ pos: neighbor, fScore: fScore.get(nk) });
        }
      }
    }
  }

  return []; // Путь не найден
}
