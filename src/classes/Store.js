import Product from './Product.js';
import Shelf from './Shelf.js';
import Customer from './Customer.js';
import Manager from './Manager.js';
import Checkout from './Checkout.js';

export default class Store {
  constructor() {
    this.mapWidth = 14;
    this.mapHeight = 6;

    this.productsByCategory = {
      'Молочные продукты': [
        new Product('Молоко', 50, 0.1),
        new Product('Сыр', 120, 0.15),
        new Product('Йогурт', 70, 0.1),
        new Product('Масло', 80, 0.1),
      ],
      'Мясные продукты': [
        new Product('Колбаса', 200, 0.2),
        new Product('Курица', 150, 0.15),
        new Product('Говядина', 250, 0.25),
        new Product('Свинина', 230, 0.2),
      ],
      'Овощи': [
        new Product('Помидоры', 40, 0.05),
        new Product('Огурцы', 35, 0.05),
        new Product('Морковь', 30, 0.05),
        new Product('Капуста', 30, 0.05),
      ],
      'Фрукты': [
        new Product('Яблоки', 60, 0.1),
        new Product('Бананы', 50, 0.1),
        new Product('Апельсины', 55, 0.1),
        new Product('Груши', 55, 0.1),
      ],
    };

    this.categories = Object.keys(this.productsByCategory);
    this.availableProducts = Object.values(this.productsByCategory).flat();

    this.shelves = [];
    this.customers = [];
    this.managers = [];

    this.checkout = new Checkout(this.mapWidth - 1, this.mapHeight - 1);

    this.initShelves();
    this.initManagers();
  }

  initShelves() {
    // По столбцам: x = 2, 5, 8, 11
    const shelfColumns = [2, 5, 8, 11];
    shelfColumns.forEach((colX, idx) => {
      const products = this.productsByCategory[this.categories[idx]];
      for (let i = 0; i < 4; i++) {
        const product = products[i % products.length];
        this.shelves.push(new Shelf(colX, i + 1, product, 50));
      }
    });
  }

  initManagers() {
    const shelfColumns = [2, 5, 8, 11];
    let idCounter = 1;
    shelfColumns.forEach((x) => {
      const colShelves = this.shelves.filter(s => s.position.x === x);
      const startY = colShelves.length > 0 ? colShelves[0].position.y : 0;
      const manager = new Manager(idCounter++, colShelves, { x: 0, y: startY });
      this.managers.push(manager);
    });
  }

  reset() {
    this.shelves.forEach(s => s.restock());
    this.customers = [];
    this.managers.forEach(m => m.reset());
  }

  addCustomer(shoppingList) {
    const list = Array.isArray(shoppingList)
      ? shoppingList.length ? shoppingList : [this.availableProducts[0].name]
      : [this.availableProducts[0].name];

    const customer = new Customer(list);
    customer.position = { x: 0, y: this.mapHeight - 1 }; // в левый нижний угол
    this.customers.push(customer);
  }

  getAllProductNames() {
    return this.availableProducts.map(p => p.name);
  }

  getShelfAt(x, y) {
    return this.shelves.find(s => s.position.x === x && s.position.y === y);
  }

  getCustomerAt(x, y) {
    return this.customers.find(c => c.position.x === x && c.position.y === y && !c.checkedOut);
  }

  getManagerAt(x, y) {
    return this.managers.find(m => m.position.x === x && m.position.y === y);
  }

  tick() {
    this.managers.forEach(m => m.update(this));
    this.customers.forEach(c => c.update(this));
    this.customers = this.customers.filter(c => !c.checkedOut);
  }

  getTotalRevenue() {
    return this.checkout.totalRevenue;
  }
}
