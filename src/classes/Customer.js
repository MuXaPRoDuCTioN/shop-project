import { findPath } from './Pathfinding.js';
import Cart from './Cart.js';

export default class Customer {
  static idCounter = 1;

  constructor(shoppingList) {
    this.id = Customer.idCounter++;
    this.shoppingList = Array.isArray(shoppingList) && shoppingList.length ? [...shoppingList] : ['Яблоки'];
    this.originalShoppingList = [...this.shoppingList];  // сохраняем оригинал
    this.cart = new Cart();
    this.position = { x: 0, y: 0 };
    this.path = [];
    this.nextTarget = null;
    this.inQueue = false;
    this.targetCheckout = null;
    this.checkedOut = false;
    this.hasSwitchedCheckout = false; // Новый флаг смены кассы
  }

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

  hasUnwantedItems() {
    return this.cart.products.some(p => !this.shoppingList.includes(p.name));
  }

  updatePath(store) {
    let target = null;

    // 1) Если есть что покупать — цель полка
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
    }

    // 2) Если список пуст — цель касса
    if (!target && this.shoppingList.length === 0) {
      if (!this.targetCheckout) {
        this.targetCheckout = store.getBestCheckout();
      }
      if (this.targetCheckout) {
        const isBeingServed = this.targetCheckout.processingCustomer === this;
        if (isBeingServed) {
          target = this.targetCheckout.position;
        } else {
          if (this.targetCheckout.queue.length === 0 && this.targetCheckout.processingCustomer === null) {
            target = { x: this.targetCheckout.position.x - 1, y: this.targetCheckout.position.y };
          } else {
            const queuePositions = [];
            for (let i = 1; i <= this.targetCheckout.queue.length + 1; i++) {
              queuePositions.push({ x: this.targetCheckout.position.x - i, y: this.targetCheckout.position.y });
            }
            target = queuePositions.find(pos => {
              if (store.getShelfAt(pos.x, pos.y)) return false;
              if (store.customers.some(c => c !== this && !c.checkedOut && c.position.x === pos.x && c.position.y === pos.y)) return false;
              return true;
            }) || { x: this.targetCheckout.position.x - 1, y: this.targetCheckout.position.y };
          }
        }
      }
    }

    if (!target) {
      this.path = [];
      return;
    }

    this.nextTarget = target;

    const rawPath = findPath(
      this.position,
      target,
      (x, y) => {
        if (store.getShelfAt(x, y)) return false;

        const checkout = store.checkouts.find(co => co.position.x === x && co.position.y === y);
        if (checkout) {
          const isBeingServed = this.targetCheckout && this.targetCheckout.processingCustomer === this;
          if (x === target.x && y === target.y && isBeingServed) return true;
          if (this.targetCheckout &&
              x === this.targetCheckout.position.x &&
              y === this.targetCheckout.position.y) {
            return false;
          }
          return false;
        }

        const occupiedByCustomer = store.customers.some(c => c !== this && !c.checkedOut && c.position.x === x && c.position.y === y);
        if (this.inQueue) {
          return !occupiedByCustomer || (x === target.x && y === target.y);
        } else {
          return true;
        }
      },
      store.mapWidth,
      store.mapHeight
    ) || [];

    if (rawPath.length > 0 &&
        rawPath[0].x === this.position.x &&
        rawPath[0].y === this.position.y) {
      rawPath.shift();
    }

    this.path = rawPath;
    console.log(`Customer ${this.id} new path to (${target.x},${target.y}), length=${this.path.length}`);
  }

  tryTakeProduct(store) {
    const dirs = [
      this.position,
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
        const chance = needed ? 1 : shelf.productType.attractiveness;
        if (Math.random() < chance) {
          const product = shelf.take();
          if (product) {
            this.cart.add(product);
            if (needed) {
  const index = this.shoppingList.indexOf(name);
  if (index !== -1) {
    this.shoppingList.splice(index, 1); // Удаляем только одно вхождение
  }
}
            this.path = [];
            this.nextTarget = null;
            console.log(`Customer ${this.id} взял товар '${product.name}'. Осталось в списке: [${this.shoppingList.join(', ')}]`);
            return true;
          }
        }
      }
    }
    return false;
  }

  update(store) {
    if (this.checkedOut) return;

    console.log(`Customer ${this.id} update called, targetCheckout: ${this.targetCheckout ? 'yes' : 'no'}`);

    if (this.targetCheckout) {
      const onCheckout = this.position.x === this.targetCheckout.position.x &&
                         this.position.y === this.targetCheckout.position.y;
      const isBeingServed = this.targetCheckout.processingCustomer === this;
      console.log(`Customer ${this.id} position: (${this.position.x},${this.position.y}), onCheckout: ${onCheckout}, isBeingServed: ${isBeingServed}`);

      if (onCheckout && (this.inQueue || isBeingServed)) {
        return;
      }

      const posBeforeCheckout = { x: this.targetCheckout.position.x - 1, y: this.targetCheckout.position.y };
      const isAtPosBefore = this.position.x === posBeforeCheckout.x && this.position.y === posBeforeCheckout.y;
      const isCheckoutFree = this.targetCheckout.processingCustomer === null;
      console.log(`isAtPosBefore: ${isAtPosBefore}, isCheckoutFree: ${isCheckoutFree}`);

      if (isAtPosBefore && isCheckoutFree) {
        this.position = { ...this.targetCheckout.position };
        this.inQueue = false;
        this.path = [];
        this.nextTarget = null;
        console.log(`Customer ${this.id} перешёл на кассу`);
        return;
      }
    }

    if (this.shoppingList.length > 0 && this.tryTakeProduct(store)) {
      this.updatePath(store);
    }

    if (!this.path.length || (this.nextTarget && 
       (this.path[this.path.length - 1].x !== this.nextTarget.x || this.path[this.path.length - 1].y !== this.nextTarget.y))) {
      this.updatePath(store);
    }

    if (this.path.length > 0) {
      const next = this.path[0];
      const occupied = store.customers.some(c => c !== this && !c.checkedOut && c.position.x === next.x && c.position.y === next.y);

      if (!occupied || !this.inQueue) {
        this.position = this.path.shift();
        if (!this.inQueue) this.inQueue = false;
      } else {
        this.updatePath(store);
      }
    }
  }
}