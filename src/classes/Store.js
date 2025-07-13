import Product from './Product.js';
import Shelf from './Shelf.js';
import Customer from './Customer.js';
import Manager from './Manager.js';
import Checkout from './Checkout.js';

export default class Store {
  constructor() {
    this.mapWidth = 17; // Ширина карты
    this.mapHeight = 8; // Высота карты
    this.attractivenessMultiplier = 1.0;  // Множитель привлекательности товара

    // Создание продуктов
    this.productsByCategory = {
      'Молочные продукты': [
        new Product('Молоко', 50, 0.1),
        new Product('Сыр', 120, 0.15),
        new Product('Йогурт', 70, 0.1),
        new Product('Масло', 80, 0.1),
      ],
      'Мясные продукты': [
        new Product('Колбаса', 200, 0.2),
        new Product('Курица', 150, 0.15),
        new Product('Говядина', 250, 0.25),
        new Product('Свинина', 230, 0.2),
      ],
      'Овощи': [
        new Product('Помидоры', 40, 0.05),
        new Product('Огурцы', 35, 0.05),
        new Product('Морковь', 30, 0.05),
        new Product('Капуста', 30, 0.05),
      ],
      'Фрукты': [
        new Product('Яблоки', 60, 0.1),
        new Product('Бананы', 50, 0.1),
        new Product('Апельсины', 55, 0.1),
        new Product('Груши', 55, 0.1),
      ],
    };
    this.pickingDelay = 1000; // Задержка взятия (по умолчанию 1000мс)

    this.categories = Object.keys(this.productsByCategory);   // Категории товаров
    this.shelves = [];  // Полки
    this.customers = [];  // Покупатели
    this.managers = []; // Менеджеры
    this.checkouts = [];  // Кассы

    // Создаем кассы вдоль правой стены
    const checkoutCount = 3;
    for (let i = 0; i < checkoutCount; i++) {
      const y = Math.floor((this.mapHeight / checkoutCount) * i + (this.mapHeight / checkoutCount) / 2);
      this.checkouts.push(new Checkout(this.mapWidth - 1, y));
    }

    this.initShelves(); // Создаем полки
    this.initManagers();  // Создаем менеджеров
  }

  // Метод создания полок
  initShelves() {
    const shelfColumns = [2, 5, 8, 11];
    shelfColumns.forEach((colX, idx) => {
      const category = this.categories[idx];
      const products = this.productsByCategory[category];
      for (let i = 0; i < 4; i++) {
        const product = products[i];
        const y = 2 + i;
        this.shelves.push(new Shelf(colX, y, product, 50));
      }
    });
  }

  // Метод создания менеджера в левом верхнем углу
  initManagers() {
    this.managers.push(new Manager(this.shelves, { x: 0, y: 0 }));
  }

  // Метод получения названия всех продуктов
  getAllProductNames() {
    return Object.values(this.productsByCategory).flat().map(p => p.name);
  }

  // Метод добавления покупателя
  addCustomer() {
    if (this.customers.length >= 20) return;
    const allProducts = this.getAllProductNames();
    const count = Math.floor(Math.random() * 3) + 1;  // Число продуктов в списке
    const shoppingList = [];  // Сам список
    // Наполняем список
    for (let i = 0; i < count; i++) {
      shoppingList.push(allProducts[Math.floor(Math.random() * allProducts.length)]);
    }

    // Создаем покупателя с данным списком в левом нижнем углу
    const customer = new Customer(shoppingList);
    customer.position = { x: 0, y: this.mapHeight - 1 };
    this.customers.push(customer);
  }

  // Метод добавления менеджера
  addManager() {
    // Создаем менеджера с отступом (если нужно)
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const isOccupied =
          this.getShelfAt(x, y) ||
          this.getCustomerAt(x, y) ||
          this.getManagerAt(x, y) ||
          this.checkouts.some(co =>
            co.position.x === x && co.position.y === y ||
            co.queue.some(c => c.position.x === x && c.position.y === y) ||
            (co.processingCustomer &&
            co.processingCustomer.position.x === x &&
            co.processingCustomer.position.y === y)
          );

        if (!isOccupied) {
          const manager = new Manager(this.shelves, { x, y });
          this.managers.push(manager);
          return manager;
        }
      }
    }

    return null;
  }

  // Метод сброса симуляции
  reset(maxShelfQuantity = 50) {
    // Восстанавляваем все значения по умолчанию
    for (const shelf of this.shelves) {
    shelf.maxQuantity = maxShelfQuantity;
    shelf.currentQuantity = Math.min(shelf.currentQuantity, maxShelfQuantity);
    }
    this.customers = [];
    this.managers.forEach(m => m.reset && m.reset());
    this.checkouts.forEach(c => {
      c.queue = [];
      c.processingCustomer = null;
      c.processingTimeLeft = 0;
      c.servedCustomers = [];
      c.totalRevenue = 0;
    });
  }

  // Метод получения полки по координатам
  getShelfAt(x, y) {
    return this.shelves.find(s => s.position.x === x && s.position.y === y);
  }

  //Метод получения Покупателя по координатам
  getCustomerAt(x, y) {
    return this.customers.find(c => c.position.x === x && c.position.y === y && !c.checkedOut);
  }

  // Метод получения менеджера по координатам
  getManagerAt(x, y) {
    return this.managers.find(m => m.position.x === x && m.position.y === y);
  }

  // Меотд получения лучшей кассы для покупателя
  getBestCheckout(customer) {
    let best = null;
    let minQueueLength = Infinity;

    for (const co of this.checkouts) {
      if (customer && customer.targetCheckout === co) continue; // ← использовали customer

      const occupied = this.getQueueOccupiedPositions(co);
      if (occupied.length < minQueueLength) {
        minQueueLength = occupied.length;
        best = co;
      }
    }

    return best;
  }

  // Метод обновления симуляции
  tick(deltaTime) {
    this.managers.forEach(m => m.update(this, deltaTime));
    this.checkouts.forEach(co => co.update(deltaTime));
    this.customers = this.customers.filter(c => !c.checkedOut);

    for (const customer of this.customers) {
      // 1. Уже обслуживается на кассе
      if (
        customer.targetCheckout &&
        customer.position.x === customer.targetCheckout.position.x &&
        customer.position.y === customer.targetCheckout.position.y &&
        customer.targetCheckout.processingCustomer === customer
      ) {
        continue;
      }

      // 2. Если занят (взятием товара) — обновляем таймер
      if (customer.isBusy()) {
        customer.updatePicking(deltaTime);
        continue; // ждет завершения
      }

      // 3. Если путь есть — делаем шаг
      this.stepAlongPath(customer);

      // 4. Попытка взять товар
      const tookProduct = customer.tryTakeProduct(this);

      // 5. Все товары собраны — выбираем кассу
      if (!tookProduct && customer.shoppingList.length === 0 && !customer.targetCheckout) {
        customer.targetCheckout = this.getBestCheckout();
        customer.inQueue = false;
        customer.nextTarget = null;
        customer.path = [];
        customer.updatePath(this);
        continue;
      }

      // 6. Если касса уже выбрана — идем к позиции в очереди
      if (customer.targetCheckout) {
        const co = customer.targetCheckout;
        const isBeingServed = co.processingCustomer === customer;
        const isOnCheckout = customer.position.x === co.position.x && customer.position.y === co.position.y;

        // 6.1. Уже на кассе и обслуживается — ничего не делаем
        if (isBeingServed && isOnCheckout) continue;

        // 6.2. Перед кассой, и касса свободна — заходим
        if (
          customer.position.x === co.position.x - 1 &&
          customer.position.y === co.position.y &&
          co.processingCustomer === null &&
          !this.getCustomerAt(co.position.x, co.position.y)
        ) {
          if (!co.queue.includes(customer)) {
            co.enqueue(customer);
            customer.inQueue = true;
          }

          customer.position = { ...co.position };
          customer.path = [];
          customer.nextTarget = null;
          console.log(`Auto-move customer ${customer.id} onto checkout`);

          // Сразу запускаем обработку, если касса свободна
          if (co.processingCustomer === null) {
            co.queue = co.queue.filter(c => c !== customer); // Удалим из очереди вручную
            co.startProcessing(customer);
          }

          continue;
        }

        // 6.3. Найти ближайшую свободную позицию в очереди
        const queuePos = this.getFreeQueuePosition(co, customer);

        if (queuePos) {
          const standingAtTarget = customer.position.x === queuePos.x && customer.position.y === queuePos.y;

          // 6.3.1. Стоим на нужной позиции — встаем в очередь
          if (standingAtTarget) {
            if (!co.queue.includes(customer)) {
              co.enqueue(customer);
            }
            customer.inQueue = true;
            continue;
          }

          // 6.3.2. Цель изменилась — обновляем путь
          if (!customer.nextTarget ||
              customer.nextTarget.x !== queuePos.x ||
              customer.nextTarget.y !== queuePos.y) {
            customer.nextTarget = queuePos;
            customer.updatePath(this);
          }

          // 6.4. Смена кассы
          if (customer.inQueue && !isBeingServed && !customer.hasSwitchedCheckout) {
            const queue = co.queue;
            const isLast = queue[queue.length - 1] === customer;
            if (isLast) {
              const better = this.getBestCheckout();
              if (better && better !== co && better.queue.length + 1 < queue.length) {
                console.log(`Customer ${customer.id} меняет кассу с ${this.checkouts.indexOf(co)} на ${this.checkouts.indexOf(better)}`);

                const idx = queue.indexOf(customer);
                if (idx !== -1) queue.splice(idx, 1);

                customer.targetCheckout = better;
                customer.inQueue = false;
                customer.nextTarget = null;
                customer.path = [];
                customer.hasSwitchedCheckout = true;
                customer.updatePath(this);
                continue;
              }
            }
          }

          continue;
        }
      }

      // 7. Если ещё ищем товары — продолжаем путь
      if (!customer.nextTarget || customer.path.length === 0) {
        customer.updatePath(this);
      }
    }
  }

  // Шаг по пути: блокируем только тех, кто в очереди
  stepAlongPath(customer) {
    if (!customer.path || customer.path.length === 0) return;

    const next = customer.path[0];
    if (!next) return;

    // Покупатель уже на кассе и обслуживается — не трогаем
    if (
      customer.targetCheckout &&
      customer.targetCheckout.processingCustomer === customer &&
      customer.position.x === customer.targetCheckout.position.x &&
      customer.position.y === customer.targetCheckout.position.y
    ) {
      return;
    }

    // Если в очереди — проверяем, занята ли клетка
    if (customer.inQueue) {
      const occupied = this.customers.some(c =>
        c !== customer &&
        !c.checkedOut &&
        c.position.x === next.x &&
        c.position.y === next.y
      );

      if (!occupied) {
        customer.position = customer.path.shift();
      } else {
        // Принудительно пересчитать путь, если застряли
        customer.updatePath(this);
      }
    } else {
      // Вне очереди — можно ходить сквозь других
      customer.position = customer.path.shift();
    }
  }

  // Получение всего дохода
  getTotalRevenue() {
    return this.checkouts.reduce((sum, c) => sum + c.totalRevenue, 0);
  }

  // Получение занятого места в очереди
  getQueueOccupiedPositions(checkout) {
    const positions = [];

    for (const c of this.customers) {
      if (
        c.targetCheckout === checkout &&
        !c.checkedOut
      ) {
        const idx = checkout.queue.indexOf(c);
        const i = idx >= 0 ? idx : positions.length;
        const queueX = checkout.position.x - (i + 1);
        const queueY = checkout.position.y;
        positions.push({ x: queueX, y: queueY });
      }
    }

    return positions;
  }

  // Получение свободного места в очереди
  getFreeQueuePosition(checkout, forCustomer = null) {
    for (let i = 1; i < this.mapWidth; i++) {
      const x = checkout.position.x - i;
      const y = checkout.position.y;

      if (x < 0) break;

      const shelf = this.getShelfAt(x, y);
      if (shelf) continue;

      const occupied = this.customers.some(c =>
        c !== forCustomer && !c.checkedOut &&
        c.position.x === x && c.position.y === y
      );

      if (!occupied) {
        return { x, y };
      }
    }

    return null;
  }
}