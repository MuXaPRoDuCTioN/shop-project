import Cart from './Cart.js';
import { findPath } from './Pathfinding.js';

export default class Customer {
  constructor(id, shoppingList, entryX = 0, entryY = 0, mapWidth, mapHeight, isWalkable) {
    this.id = id;
    this.cart = new Cart();
    this.shoppingList = shoppingList;
    this.x = entryX;
    this.y = entryY;
    this.path = [];
    this.pathIndex = 0;
    this.done = false;
    this.checkedOut = false;
    this.shoppingDone = false;
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.isWalkable = isWalkable;
  }

  getAdjacentTo(pos) {
    return [
      { x: pos.x - 1, y: pos.y },
      { x: pos.x + 1, y: pos.y },
      { x: pos.x, y: pos.y - 1 },
      { x: pos.x, y: pos.y + 1 }
    ];
  }

  isNear(pos) {
    return this.getAdjacentTo(pos).some(p => p.x === this.x && p.y === this.y);
  }

  planPathTo(target) {
    const path = findPath(
      { x: this.x, y: this.y },
      target,
      this.isWalkable,
      this.mapWidth,
      this.mapHeight
    );
    if (path) {
      this.path = path;
      this.pathIndex = 1; // 0 - current position
    } else {
      this.path = [];
      this.pathIndex = 0;
    }
  }

  moveStep() {
    if (this.done) return;
    if (!this.path || this.pathIndex >= this.path.length) return;

    const targetPos = this.path[this.pathIndex];
    if (targetPos.x === this.x && targetPos.y === this.y) {
      this.pathIndex++;
      return;
    }

    this.x = targetPos.x;
    this.y = targetPos.y;
    this.pathIndex++;
  }

  tryShop(shelves, checkoutPos) {
    if (this.shoppingDone) return;

    for (const shelf of shelves) {
      if (this.isNear(shelf.position)) {
        const product = shelf.productType;
        const needed = this.shoppingList.includes(product.name) && !this.cart.has(product.name);
        const tempted = !this.cart.has(product.name) && Math.random() < product.attractiveness;
        if (needed || tempted) {
          const taken = shelf.take();
          if (taken) this.cart.add(taken);
        }
      }
    }

    const stillNeed = this.shoppingList.filter(item => !this.cart.has(item));
    if (stillNeed.length === 0) {
      this.shoppingDone = true;
      // Планируем путь к кассе
      this.planPathTo(checkoutPos);
    }
  }

  tryCheckout(checkout) {
    if (this.x === checkout.x && this.y === checkout.y && !this.checkedOut) {
      this.checkedOut = true;
      this.done = true;
      return this.cart.total();
    }
    return 0;
  }
}
