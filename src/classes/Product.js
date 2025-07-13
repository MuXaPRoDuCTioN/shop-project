export default class Product {
  constructor(name, price, attractiveness) {
    this.name = name; // название товара, например "Хлеб"
    this.price = price; // цена в рублях
    this.attractiveness = attractiveness; // вероятность, что покупатель возьмёт дополнительно
  }
}
