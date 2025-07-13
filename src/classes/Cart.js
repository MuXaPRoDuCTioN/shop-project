export default class Cart {
  constructor() {
    this.items = [];
  }

  add(product) {
    this.items.push(product);
  }

  total() {
    return this.items.reduce((sum, p) => sum + p.price, 0);
  }

  listNames() {
    return this.items.map(p => p.name);
  }

  has(name) {
    return this.items.some(p => p.name === name);
  }
}