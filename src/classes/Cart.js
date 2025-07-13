export default class Cart {
  // Создаёт новую корзину для покупателя
  constructor(shoppingList = []) {
    this.products = [];                          // Список добавленных продуктов (фактическое содержимое корзины)
    this.shoppingList = [...shoppingList];       // Изменяемый список нужных товаров (может укорачиваться по мере сбора)
    this.originalShoppingList = [...shoppingList]; // Оригинальный список покупок (неизменяемый, нужен для проверки лишних покупок)
  }

  // Добавляет продукт в корзину
  add(product) {
    this.products.push(product);
  }

  // Считает общую стоимость всех товаров в корзине
  getTotal() {
    return this.products.reduce((sum, p) => sum + p.price, 0);
  }

  // Просто вызывает getTotal()
  getTotalPrice() {
    return this.getTotal();
  }

  // Возвращает список названий всех товаров в корзине
  listNames() {
    return this.products.map(p => p.name);
  }

  // Проверяет, есть ли в корзине товары, которых не было в изначальном списке покупок
  hasUnwantedItems() {
    return this.products.some(p => !this.originalShoppingList.includes(p.name));
  }

  // Возвращает сумму стоимости всех лишних товаров, не входящих в оригинальный список покупок
  getUnneededPrice() {
    return this.products
      .filter(p => !this.originalShoppingList.includes(p.name))
      .reduce((sum, p) => sum + p.price, 0);
  }
}
