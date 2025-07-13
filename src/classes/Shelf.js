export default class Shelf {
  constructor(x, y, productType, maxQuantity) {
    this.position = { x, y };            // Координаты полки на карте
    this.productType = productType;      // Продукт, который хранится на полке (один тип на полку)
    this.maxQuantity = maxQuantity;      // Максимальная вместимость полки
    this.currentQuantity = maxQuantity;  // Текущее количество товара (изначально полная)
  }

  // Возвращает текущее количество товара на полке
  getCurrentQuantity() {
    return this.currentQuantity;
  }
 
  // Покупатель пытается взять товар с полки.
  // Если товар есть, уменьшаем количество и возвращаем копию продукта
  take() {
    if (this.currentQuantity > 0) {
      this.currentQuantity--;
      // Возвращаем копию объекта продукта, чтобы не мутировать оригинал
      return { ...this.productType };
    }
    return null;
  }

  // Пополняет запасы на полке
  restock(amount) {
    // Добавляем товар, но не превышаем максимальный лимит
    this.currentQuantity = Math.min(this.currentQuantity + amount, this.maxQuantity);
  }
}
