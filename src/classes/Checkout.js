export default class Checkout {
  constructor(x, y) {
    this.position = { x, y };             // Позиция кассы на карте
    this.queue = [];                      // Очередь покупателей
    this.totalRevenue = 0;               // Общая сумма выручки

    this.processingCustomer = null;       // Покупатель, которого сейчас обслуживают
    this.processingTimeLeft = 0;          // Оставшееся время до завершения обслуживания
    this.processingSpeedPerItem = 500;    // Время обработки одного товара (в мс)

    this.servedCustomers = [];            // Список обслуженных покупателей
  }

  // Добавляет покупателя в очередь, если его ещё нет
  enqueue(customer) {
    if (!this.queue.includes(customer)) {
      this.queue.push(customer);
    }
  }

  // Начало обслуживания покупателя
  startProcessing(customer) {
    this.processingCustomer = customer;

    const itemCount = customer.cart.products.length;
    this.processingTimeLeft = itemCount * this.processingSpeedPerItem;
  }

  // Обновляет состояние кассы за прошедшее время (deltaTime в мс)
  update(deltaTime) {
    // Если кто-то обслуживается — уменьшаем таймер
    if (this.processingCustomer) {
      this.processingTimeLeft -= deltaTime;

      if (this.processingTimeLeft <= 0) {
        this.finishProcessing(); // завершить обслуживание
      }

      return; // выход — не трогаем очередь
    }

    // Если свободна — берём следующего из очереди, если он подошёл
    if (this.queue.length > 0) {
      const next = this.queue[0];

      // Начинаем обслуживание только если покупатель подошёл к кассе
      if (
        next.position.x === this.position.x &&
        next.position.y === this.position.y
      ) {
        this.queue.shift(); // удаляем из очереди
        this.startProcessing(next); // начинаем обслуживание
      }
    }
  }

  // Завершает обслуживание текущего покупателя
  // Подсчитывает выручку, сохраняет статистику, очищает текущего клиента
  finishProcessing() {
    const cust = this.processingCustomer;
    const total = cust.cart.getTotal(); // сумма покупок

    this.totalRevenue += total;

    this.servedCustomers.push({
      customerId: cust.id,
      total: total,

      // Стоимость ненужных (не из списка) товаров
      unneededTotal: cust.cart.hasUnwantedItems(cust.shoppingList)
        ? cust.cart.products
            .filter(p => !cust.originalShoppingList.includes(p.name))
            .reduce((sum, p) => sum + p.price, 0)
        : 0,

      shoppingList: [...cust.originalShoppingList],         // список покупок
      cartItems: cust.cart.products.map(p => p.name),       // купленные товары
    });

    this.processingCustomer = null;  // освобождаем кассу
    cust.checkedOut = true;          // помечаем покупателя как обслуженного

    // Удаляем из очереди (на всякий случай)
    const idx = this.queue.indexOf(cust);
    if (idx !== -1) this.queue.splice(idx, 1);
  }
}
