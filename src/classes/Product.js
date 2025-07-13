export default class Product {
  constructor(name, price, attractiveness) {
    this.name = name;                   // Название товара
    this.price = price;                 // Стоимость товара
    this.attractiveness = attractiveness; // "Привлекательность" товара (шанс быть взятым вне списка)
  }
}
