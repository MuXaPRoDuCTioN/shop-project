export default class Product {
  constructor(name, price, attractiveness = 0.1) {
    this.name = name;
    this.price = price;
    this.attractiveness = attractiveness;
  }
}