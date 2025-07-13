import { findPath } from './Pathfinding.js';

export default class Manager {
  static idCounter = 1;

  constructor(shelves, position = { x: 0, y: 0 }) {
    this.id = Manager.idCounter++;     // Уникальный ID для менеджера
    this.shelves = shelves;            // Список всех полок в магазине
    this.position = position;          // Текущая позиция менеджера
    this.path = [];                    // Текущий путь до цели
    this.targetShelf = null;           // Целевая полка для пополнения

    this.restockingTime = 0;           // Время, оставшееся до завершения пополнения (в мс)
    this.restockingDelay = 1000;       // Задержка на пополнение (по умолчанию 1 секунда)
    this.restockAmount = 1;            // Сколько товаров добавляется за одно пополнение
  }

  // Возвращает соседнюю с указанной позицией клетку, в которую можно встать
  getAdjacentTile(pos, store) {
    const dirs = [
      { x: pos.x + 1, y: pos.y },
      { x: pos.x - 1, y: pos.y },
      { x: pos.x, y: pos.y + 1 },
      { x: pos.x, y: pos.y - 1 },
    ];

    return dirs.find(p =>
      p.x >= 0 && p.x < store.mapWidth &&
      p.y >= 0 && p.y < store.mapHeight &&
      !store.getShelfAt(p.x, p.y) // не занято полкой
    ) || this.position; // если нет подходящих — остаётся на месте
  }

  // Выбирает первую недозаполненную полку из списка
  chooseTarget() {
    for (const shelf of this.shelves) {
      if (shelf.getCurrentQuantity() < shelf.maxQuantity) {
        return shelf;
      }
    }
    return null;
  }

  // Основной метод обновления состояния менеджера
  update(store, deltaTime) {
    // 1. Менеджер занят пополнением — ждёт окончания таймера
    if (this.restockingTime > 0) {
      this.restockingTime -= deltaTime || 0;
      if (this.restockingTime <= 0 && this.targetShelf) {
        this.targetShelf.restock(this.restockAmount); // добавляем товары
        this.targetShelf = null; // цель выполнена
        this.path = [];          // путь больше не нужен
      }
      return;
    }

    // 2. Если нет цели или она уже полная — ищем новую
    if (!this.targetShelf || this.targetShelf.getCurrentQuantity() === this.targetShelf.maxQuantity) {
      this.targetShelf = this.chooseTarget(store); // может вернуть null
      this.path = [];
    }

    // 3. Есть цель — строим путь и двигаемся
    if (this.targetShelf) {
      const targetPos = this.getAdjacentTile(this.targetShelf.position, store); // соседняя клетка

      // Если путь ещё не построен — строим
      if (!this.path.length) {
        this.path = findPath(
          this.position,
          targetPos,
          (x, y) => !store.getShelfAt(x, y), // условие проходимости
          store.mapWidth,
          store.mapHeight
        ) || [];
      }

      // Идём по пути, по одной клетке за update
      if (this.path.length > 0) {
        this.position = this.path.shift();
      }

      // Проверка: рядом ли менеджер с полкой
      const adjacent = Math.abs(this.position.x - this.targetShelf.position.x) +
                       Math.abs(this.position.y - this.targetShelf.position.y) === 1;

      if (adjacent) {
        this.restockingTime = this.restockingDelay; // начинаем пополнение
      }
    }
  }

  // Сброс состояния менеджера (используется при перезапуске симуляции)
  reset() {
    this.position = { x: 0, y: 0 };
    this.path = [];
    this.targetShelf = null;
  }
}
