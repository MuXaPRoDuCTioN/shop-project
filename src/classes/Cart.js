export default class Cart {
  constructor() {
    this.products = [];
  }

  add(product) {
    this.products.push(product);
  }

  listNames() {
    return this.products.map(p => p.name);
  }

  getTotalPrice() {
    return this.products.reduce((sum, p) => sum + p.price, 0);
  }
}
