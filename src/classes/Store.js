import Shelf from './Shelf.js';
import Checkout from './Checkout.js';
import Customer from './Customer.js';
import Manager from './Manager.js';
import Product from './Product.js';

export default class Store {
  constructor() {
    this.mapWidth = 16;
    this.mapHeight = 10;
    this.entryPoint = { x: 0, y: 0 };

    this.availableProducts = [
      new Product('Хлеб', 25, 0.1),
      new Product('Молоко', 50, 0.3),
      new Product('Сахар', 40, 0.2),
      new Product('Яблоки', 35, 0.4),
      new Product('Чипсы', 60, 0.8),
      new Product('Кола', 70, 0.9)
    ];

    this.shelves = [];
    this.checkout = new Checkout(15, 0);
    this.customers = [];

    this.managers = [
      new Manager(1, 15, 9, { x1: 0, x2: 7, y1: 0, y2: 9 }, this.mapWidth, this.mapHeight, this.isWalkable),
      new Manager(2, 14, 9, { x1: 8, x2: 15, y1: 0, y2: 9 }, this.mapWidth, this.mapHeight, this.isWalkable)
    ];

    this.customerCounter = 0;

    // Расставим полки рядами с шагом 3 по X, 2 по Y
    for (let y = 1; y < this.mapHeight - 1; y += 2) {
      for (let x = 2; x < this.mapWidth - 2; x += 3) {
        const product = this.availableProducts[Math.floor(Math.random() * this.availableProducts.length)];
        this.shelves.push(new Shelf(x, y, product));
      }
    }

    for (const shelf of this.shelves) shelf.restock(shelf.maxQuantity);
  }

  addCustomer(shoppingList) {
    const c = new Customer(
      this.customerCounter++,
      shoppingList,
      this.entryPoint.x,
      this.entryPoint.y,
      this.mapWidth,
      this.mapHeight,
      this.isWalkable
    );
    c.planPathTo(this.pickNextTargetForCustomer(c));
    this.customers.push(c);
  }

  // Логика выбора следующей точки для покупателя: сначала полки с нужным товаром, потом касса
  pickNextTargetForCustomer(customer) {
    // Возьмем полки с товарами, которые он еще не купил
    const neededShelves = this.shelves.filter(shelf =>
      customer.shoppingList.includes(shelf.productType.name) &&
      !customer.cart.has(shelf.productType.name)
    );

    // Найдем ближайшую из них
    if (neededShelves.length > 0) {
      neededShelves.sort((a, b) => {
        const da = Math.abs(a.position.x - customer.x) + Math.abs(a.position.y - customer.y);
        const db = Math.abs(b.position.x - customer.x) + Math.abs(b.position.y - customer.y);
        return da - db;
      });
      const shelf = neededShelves[0];
      // Возьмем клетку рядом с полкой, где можно подойти
      const adj = this.getAdjacentWalkable(shelf.position);
      if (adj) return adj;
      return shelf.position; // если нет, то сама полка (редко)
    }

    // Если все нужное куплено — путь к кассе
    return this.checkout.position;
  }

  getAdjacentWalkable(pos) {
    const adjacents = [
      { x: pos.x - 1, y: pos.y },
      { x: pos.x + 1, y: pos.y },
      { x: pos.x, y: pos.y - 1 },
      { x: pos.x, y: pos.y + 1 }
    ];
    for (const adj of adjacents) {
      if (this.isWalkable(adj.x, adj.y)) return adj;
    }
    return null;
  }

  tick() {
    for (const customer of this.customers) {
      if (!customer.done) {
        if (customer.path.length === 0 || customer.pathIndex >= customer.path.length) {
          // Планируем маршрут на следующую цель
          if (!customer.shoppingDone) {
            const target = this.pickNextTargetForCustomer(customer);
            customer.planPathTo(target);
          } else {
            // Уже идёт к кассе (путь уже запланирован)
          }
        }
        customer.moveStep();
        customer.tryShop(this.shelves, this.checkout.position);
        const money = customer.tryCheckout(this.checkout.position);
        if (money > 0) this.checkout.revenue += money;
      }
    }

    for (const manager of this.managers) {
      if (!manager.targetShelf) {
        manager.assignRestockTask(this.shelves);
      }
      if (manager.path.length === 0 || manager.pathIndex >= manager.path.length) {
        if (manager.targetShelf) {
          manager.planPathTo(this.getAdjacentWalkable(manager.targetShelf.position));
        }
      }
      manager.moveStep();
      manager.tryRestock(this.shelves);
    }
  }

  reset() {
    this.customers = [];
    this.customerCounter = 0;
    this.checkout.revenue = 0;
    for (const shelf of this.shelves) shelf.restock(shelf.maxQuantity);
  }

  getTotalRevenue() {
    return this.checkout.revenue;
  }

  getShelfAt(x, y) {
    return this.shelves.find(s => s.position.x === x && s.position.y === y);
  }

  getManagerAt(x, y) {
    return this.managers.find(m => m.x === x && m.y === y);
  }

  getCustomerAt(x, y) {
    return this.customers.find(c => c.x === x && c.y === y);
  }

  isWalkable = (x, y) => {
    if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) return false;
    if (this.getShelfAt(x, y)) return false;
    return true;
  }
}
