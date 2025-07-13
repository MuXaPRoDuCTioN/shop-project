export default class Checkout {
  constructor(x, y) {
    this.position = { x, y };
    this.queue = [];
    this.totalRevenue = 0;

    this.processingCustomer = null;
    this.processingTimeLeft = 0;
    this.processingTimePerCustomer = 2000; // 2 секунды
    this.servedCustomers = [];
  }

  enqueue(customer) {
  if (!this.queue.includes(customer)) {
    this.queue.push(customer);
  }
}

  startProcessing(customer) {
    this.processingCustomer = customer;
    this.processingTimeLeft = this.processingTimePerCustomer;
    console.log(`⏳ Start processing customer ${customer.id} for ${this.processingTimePerCustomer}ms`);
  }

  update(deltaTime) {
    // 1) Если есть активный processingCustomer — идёт оплата
    if (this.processingCustomer) {
      this.processingTimeLeft -= deltaTime;
      if (this.processingTimeLeft <= 0) {
        this.finishProcessing();
      }
      return;
    }

    // 2) Если никого не обслуживаем, проверяем очередь
    if (this.queue.length > 0) {
      const next = this.queue[0];
      if (
        next.position.x === this.position.x &&
        next.position.y === this.position.y
      ) {
        this.queue.shift();
        this.startProcessing(next);
      }
    }
  }

  finishProcessing() {
  const cust = this.processingCustomer;
  const total = cust.cart.getTotal();

  this.totalRevenue += total;
  this.servedCustomers.push({
    customerId: cust.id,
    total: total,
    unneededTotal: cust.cart.hasUnwantedItems(cust.shoppingList) 
      ? cust.cart.products
          .filter(p => !cust.originalShoppingList.includes(p.name))
          .reduce((sum, p) => sum + p.price, 0)
      : 0,
    shoppingList: [...cust.originalShoppingList], // копия списка покупок
    cartItems: cust.cart.products.map(p => p.name), // копия корзины (названия товаров)
  });

  this.processingCustomer = null;

  cust.checkedOut = true;

  // Если остался в очереди — удаляем
  const idx = this.queue.indexOf(cust);
  if (idx !== -1) this.queue.splice(idx, 1);
}


}