import { findPath } from './Pathfinding.js';
import Cart from './Cart.js';

export default class Customer {
  static idCounter = 1;

  constructor(shoppingList) {
    this.id = Customer.idCounter++;

    // Список товаров, которые покупатель хочет купить (в процессе может изменяться)
    this.shoppingList = Array.isArray(shoppingList) && shoppingList.length
      ? [...shoppingList]
      : ['Яблоки'];

    // Оригинальный список (для анализа покупок)
    this.originalShoppingList = [...this.shoppingList];

    this.cart = new Cart();               // Корзина с выбранными товарами
    this.position = { x: 0, y: 0 };       // Текущая позиция на карте
    this.path = [];                       // Текущий путь движения
    this.nextTarget = null;              // Целевая позиция, к которой двигается
    this.inQueue = false;                // Стоит ли в очереди
    this.targetCheckout = null;          // Целевая касса
    this.checkedOut = false;             // Завершил ли обслуживание

    this.pickingTime = 0;                // Время задержки на взятие товара
    this.pickingDelay = 1000;            // Базовая задержка (можно изменять через store.pickingDelay)

    this.hasSwitchedCheckout = false;    // Сменил ли уже кассу
  }

  // Возвращает свободную соседнюю клетку рядом с позицией
  getAdjacentTile(pos, store) {
    const dirs = [
      { x: pos.x + 1, y: pos.y },
      { x: pos.x - 1, y: pos.y },
      { x: pos.x, y: pos.y + 1 },
      { x: pos.x, y: pos.y - 1 },
    ];
    return dirs.find(p =>
      p.x >= 0 && p.y >= 0 &&
      p.x < store.mapWidth && p.y < store.mapHeight &&
      !store.getShelfAt(p.x, p.y)
    ) || { x: this.position.x, y: this.position.y };
  }

  // Проверяет, есть ли в корзине ненужные товары
  hasUnwantedItems() {
    return this.cart.products.some(p => !this.shoppingList.includes(p.name));
  }

  // Обновляет путь до следующей цели (полки или кассы)
  updatePath(store) {
    let target = null;

    // 1. Если есть товары в списке — идём за ними
    if (this.shoppingList.length > 0) {
      for (const prod of this.shoppingList) {
        const shelf = store.shelves.find(s =>
          s.productType.name === prod && s.getCurrentQuantity() > 0
        );
        if (shelf) {
          target = this.getAdjacentTile(shelf.position, store);
          break;
        }
      }

      // Если ни один товар не найден — идём к кассе
      if (!target) {
        this.shoppingList = []; // очищаем список — всё недоступно
      }
    }

    // 2. Если товаров нет — направляемся к кассе
    if (!target && this.shoppingList.length === 0) {
      if (!this.targetCheckout) {
        this.targetCheckout = store.getBestCheckout();
      }

      if (this.targetCheckout) {
        const isBeingServed = this.targetCheckout.processingCustomer === this;

        if (isBeingServed) {
          target = this.targetCheckout.position;
        } else {
          // Вычисляем доступные позиции в очереди
          if (this.targetCheckout.queue.length === 0 && !this.targetCheckout.processingCustomer) {
            target = {
              x: this.targetCheckout.position.x - 1,
              y: this.targetCheckout.position.y,
            };
          } else {
            const queuePositions = [];
            for (let i = 1; i <= this.targetCheckout.queue.length + 1; i++) {
              queuePositions.push({
                x: this.targetCheckout.position.x - i,
                y: this.targetCheckout.position.y
              });
            }

            target = queuePositions.find(pos =>
              !store.getShelfAt(pos.x, pos.y) &&
              !store.customers.some(c =>
                c !== this &&
                !c.checkedOut &&
                c.position.x === pos.x &&
                c.position.y === pos.y
              )
            ) || { x: this.targetCheckout.position.x - 1, y: this.targetCheckout.position.y };
          }
        }
      }
    }

    // 3. Нет цели — путь пуст
    if (!target) {
      this.path = [];
      return;
    }

    this.nextTarget = target;

    // 4. Находим путь до цели
    const rawPath = findPath(
      this.position,
      target,
      (x, y) => {
        if (store.getShelfAt(x, y)) return false;

        const checkout = store.checkouts.find(co => co.position.x === x && co.position.y === y);
        if (checkout) {
          const isBeingServed = this.targetCheckout?.processingCustomer === this;
          if (x === target.x && y === target.y && isBeingServed) return true;
          if (this.targetCheckout &&
              x === this.targetCheckout.position.x &&
              y === this.targetCheckout.position.y) {
            return false;
          }
          return false;
        }

        const occupied = store.customers.some(c =>
          c !== this &&
          !c.checkedOut &&
          c.position.x === x &&
          c.position.y === y
        );

        return this.inQueue
          ? (!occupied || (x === target.x && y === target.y))
          : true;
      },
      store.mapWidth,
      store.mapHeight
    ) || [];

    // Убираем первую позицию, если она совпадает с текущей
    if (rawPath.length > 0 &&
        rawPath[0].x === this.position.x &&
        rawPath[0].y === this.position.y) {
      rawPath.shift();
    }

    this.path = rawPath;

    console.log(`Customer ${this.id} new path to (${target.x},${target.y}), length=${this.path.length}`);
  }

  // Попытка взять товар с соседней полки
  tryTakeProduct(store) {
    if (this.pickingTime > 0) return false;

    const dirs = [
      { x: this.position.x + 1, y: this.position.y },
      { x: this.position.x - 1, y: this.position.y },
      { x: this.position.x, y: this.position.y + 1 },
      { x: this.position.x, y: this.position.y - 1 },
    ];

    for (const pos of dirs) {
      const shelf = store.getShelfAt(pos.x, pos.y);
      if (shelf && shelf.getCurrentQuantity() > 0) {
        const name = shelf.productType.name;
        const needed = this.shoppingList.includes(name);

        const baseAttractiveness = shelf.productType.attractiveness;
        const multiplier = store.attractivenessMultiplier ?? 1;
        const chance = needed ? 1 : baseAttractiveness * multiplier;

        if (Math.random() < chance) {
          const product = shelf.take();
          if (product) {
            this.cart.add(product);

            // Убираем из списка покупок, если нужный товар
            if (needed) {
              const index = this.shoppingList.indexOf(name);
              if (index !== -1) this.shoppingList.splice(index, 1);
            }

            this.path = [];
            this.nextTarget = null;

            this.pickingTime = store.pickingDelay ?? 1000;

            console.log(`Customer ${this.id} взял товар '${product.name}'. Осталось: [${this.shoppingList.join(', ')}]`);
            return true;
          }
        }
      }
    }

    return false;
  }

  // Проверяет, занят ли покупатель
  isBusy() {
    return this.pickingTime > 0;
  }

  // Обновляет задержку взятия товара (уменьшает время на таймере)
  updatePicking(deltaTime) {
    if (this.pickingTime > 0) {
      this.pickingTime -= deltaTime;
      if (this.pickingTime < 0) this.pickingTime = 0;
    }
  }
}
