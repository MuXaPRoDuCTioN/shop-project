export default class Shelf {
  constructor(x, y, productType, maxQuantity) {
    this.position = { x, y };
    this.productType = productType;
    this.maxQuantity = maxQuantity;
    this.currentQuantity = maxQuantity;
  }

  getCurrentQuantity() {
    return this.currentQuantity;
  }

  // Берёт один товар и возвращает сам продукт, или null, если на полке пусто
  take() {
    if (this.currentQuantity > 0) {
      this.currentQuantity--;
      // возвращаем отдельный объект продукта, чтобы не мутировать оригинал
      return { ...this.productType };
    }
    return null;
  }

  restock(amount = 10) {
    this.currentQuantity = Math.min(this.currentQuantity + amount, this.maxQuantity);
  }
}
