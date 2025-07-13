import { findPath } from './Pathfinding.js';
import Cart from './Cart.js';

export default class Customer {
  static idCounter = 1;

  constructor(shoppingList) {
    this.id = Customer.idCounter++;
    this.shoppingList = Array.isArray(shoppingList) && shoppingList.length
      ? [...shoppingList]
      : ['Яблоки'];
    this.cart = new Cart();
    this.position = { x: 0, y: 0 };
    this.path = [];
    this.checkedOut = false;
  }

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
      !store.getShelfAt(p.x, p.y)
    ) || pos;
  }

  chooseNextTarget(store) {
    if (this.shoppingList.length === 0) return store.checkout.position;

    for (const prod of this.shoppingList) {
      const shelf = store.shelves.find(s =>
        s.productType.name === prod && s.getCurrentQuantity() > 0
      );
      if (shelf) return this.getAdjacentTile(shelf.position, store);
    }

    return store.checkout.position;
  }

  tryTakeProduct(store) {
    const dirs = [
      { x: this.position.x + 1, y: this.position.y },
      { x: this.position.x - 1, y: this.position.y },
      { x: this.position.x, y: this.position.y + 1 },
      { x: this.position.x, y: this.position.y - 1 },
    ];
    for (const n of dirs) {
      const shelf = store.getShelfAt(n.x, n.y);
      if (shelf && shelf.getCurrentQuantity() > 0) {
        const isNeeded = this.shoppingList.includes(shelf.productType.name);
        if (isNeeded || Math.random() < shelf.productType.attractiveness * 0.05) {
          const product = shelf.take();
          if (product) {
            this.cart.add(product);
            if (isNeeded) {
              this.shoppingList = this.shoppingList.filter(p => p !== product.name);
            }
            this.path = [];
            break;
          }
        }
      }
    }
  }

  update(store) {
    if (this.checkedOut) return;

    if (!this.path || this.path.length === 0) {
      const target = this.chooseNextTarget(store);
      this.path = findPath(this.position, target,
        (x, y) => !store.getShelfAt(x, y),
        store.mapWidth, store.mapHeight
      ) || [];
    }

    if (this.path.length > 0) {
      this.position = this.path.shift();
    }

    if (this.position.x === store.checkout.position.x &&
        this.position.y === store.checkout.position.y) {
      store.checkout.checkout(this);
      this.checkedOut = true;
      return;
    }

    this.tryTakeProduct(store);
  }
}
