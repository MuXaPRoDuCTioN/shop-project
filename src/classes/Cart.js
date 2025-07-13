export default class Cart {
  constructor(shoppingList = []) {
    this.products = [];
    this.shoppingList = [...shoppingList]; // изменяемый (используется в симуляции)
    this.originalShoppingList = [...shoppingList]; // неизменяемый оригинал
  }

  add(product) {
    this.products.push(product);
  }

  getTotal() {
    return this.products.reduce((sum, p) => sum + p.price, 0);
  }

  getTotalPrice() {
    return this.getTotal(); // для совместимости с Checkout
  }

  listNames() {
    return this.products.map(p => p.name);
  }

  hasUnwantedItems() {
    return this.products.some(p => !this.originalShoppingList.includes(p.name));
  }

  getUnneededPrice() {
    return this.products
      .filter(p => !this.originalShoppingList.includes(p.name))
      .reduce((sum, p) => sum + p.price, 0);
  }
}
