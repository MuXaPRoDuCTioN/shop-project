export default class Shelf {
  constructor(x, y, productType, maxQuantity) {
    this.position = { x, y };
    this.productType = productType;
    this.maxQuantity = maxQuantity;
    this.quantity = maxQuantity;
  }

  getCurrentQuantity() {
    return this.quantity;
  }

  take() {
    if (this.quantity > 0) {
      this.quantity--;
      return this.productType;
    }
    return null;
  }

  restock() {
    this.quantity = this.maxQuantity;
  }
}
