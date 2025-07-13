import Product from './Product.js';

export default class Shelf {
  constructor(x, y, product, maxQuantity = 5) {
    this.position = { x, y };
    this.productType = product;
    this.products = [];
    this.maxQuantity = maxQuantity;
  }

  restock(quantity) {
    const available = this.maxQuantity - this.products.length;
    const add = Math.min(quantity, available);
    for (let i = 0; i < add; i++) {
      this.products.push(new Product(this.productType.name, this.productType.price, this.productType.attractiveness));
    }
  }

  take() {
    return this.products.length > 0 ? this.products.pop() : null;
  }

  needsRestock() {
    return this.products.length < this.maxQuantity;
  }

  getCurrentQuantity() {
    return this.products.length;
  }
}