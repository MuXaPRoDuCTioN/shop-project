<template>
  <!-- Заголовок и общая статистика -->
  <h1>Супермаркет (🟩 — полка, 🟦 — касса)</h1>
  <p>💰 Выручка: {{ totalRevenue }} руб. Из них ненужные товары: {{ unneededRevenue }} руб.</p>

  <!-- Главная область: слева карта, справа управление -->
  <div class="main-area">
    <!-- Сетка магазина -->
    <div class="grid-container" :style="gridContainerStyle">
      <!-- Клетки поля (пустые, полки, кассы) -->
      <div
        v-for="i in mapWidth * mapHeight"
        :key="i"
        class="cell"
        :class="getCellClass(x(i), y(i))"
        @click="selectEntity(x(i), y(i))"
      ></div>

      <!-- Покупатели -->
      <div
        v-for="customer in store.customers"
        :key="'c' + customer.id"
        class="entity customer"
        :style="entityStyle(customer)"
        @click.stop="selectCustomer(customer)"
      >🧍</div>

      <!-- Менеджеры -->
      <div
        v-for="manager in store.managers"
        :key="'m' + manager.id"
        class="entity manager"
        :style="entityStyle(manager)"
        @click.stop="selectManager(manager)"
      >🧑‍💼</div>

      <!-- Кассы с кнопкой просмотра -->
      <div
        v-for="(checkout, index) in store.checkouts"
        :key="'checkout' + index"
        class="entity checkout"
        :style="entityStyle(checkout)"
        @click.stop="selectCheckout(index)"
      >
        🟦
        <!-- Кнопка 👁 справа от кассы -->
        <button
          class="checkout-button"
          @click.stop="selectCheckout(index)"
          :style="{
            position: 'absolute',
            left: `${cellSize}px`,
            top: '0px',
            width: '40px',
            height: '40px',
            fontSize: '16px',
            cursor: 'pointer'
          }"
        >👁</button>
      </div>
    </div>

    <!-- Панель управления симуляцией -->
    <div class="controls-wrapper">
      <!-- Кнопки управления запуском -->
      <div class="controls-buttons">
        <button @click="startSimulation" :disabled="running || !hasBeenReset">▶️ Старт</button>
        <button @click="pauseSimulation" :disabled="!running">⏸️ Пауза</button>
        <button @click="resumeSimulation" :disabled="running || !wasPaused">🔄 Продолжить</button>
        <button @click="resetSimulation">🔁 Сброс</button>
      </div>

      <!-- Ползунки настроек -->
      <div class="controls-scrollable">
        <!-- Скорость перемещения покупателей -->
        <label>
          ⏱️ Скорость перемещения (мс):
          <input type="range" v-model.number="speed" min="100" max="1000" step="50" />
          {{ speed }}
        </label>

        <!-- Максимальное количество покупателей на карте -->
        <label>
          👥 Макс покупателей:
          <input type="range" v-model.number="maxCustomers" min="1" :max="20" />
          {{ maxCustomers }}
        </label>

        <!-- Интервал появления новых покупателей -->
        <label>
          🚪 Интервал входа (мс):
          <input type="range" v-model.number="spawnInterval" min="200" max="5000" step="200" />
          {{ spawnInterval }}
        </label>

        <!-- Задержка при взятии товара с полки -->
        <label>
          🛒 Задержка взятия товара (мс):
          <input type="range" min="0" max="3000" step="100" v-model="pickingDelay" />
          {{ pickingDelay }}
        </label>

        <!-- Время оплаты одного товара на кассе -->
        <label>
          💳 Скорость оплаты (мс за товар):           
          <input type="range" v-model.number="checkoutSpeed" min="300" max="2000" step="100"/>
          {{ checkoutSpeed }}
        </label>

        <!-- Множитель привлекательности полок -->
        <label>
          🌟 Множитель привлекательности: 
          <input type="range" v-model.number="attractivenessMultiplier" min="0.5" max="2" step="0.1"/>
          {{ attractivenessMultiplier.toFixed(2) }}
        </label>

        <!-- Количество менеджеров -->
        <label>
          🧑‍💼 Менеджеры:
          <input type="range" v-model.number="managerCount" min="0" :max="4" />
          {{ managerCount }}
        </label>

        <!-- Задержка между пополнениями полок -->
        <label>
          ⏳ Задержка пополнения (мс): 
          <input type="range" min="100" max="3000" step="100" v-model="restockingDelay" />
          {{ restockingDelay }}
        </label>

        <!-- Сколько товара менеджер приносит за раз -->
        <label>
          📦 Кол-во пополнения за раз:
          <input type="range" min="1" max="10" step="1" v-model.number="restockAmount" />
          {{ restockAmount }}
        </label>
      </div>
    </div>
  </div>

  <!-- Блок информации о выбранной сущности -->
  <!-- Информация о выбранной полке -->
  <div v-if="selectedShelf" class="info-box">
    <h3>Полка</h3>
    <p><strong>Товар:</strong> {{ selectedShelf.productType.name }}</p>
    <p><strong>Цена:</strong> {{ selectedShelf.productType.price }} руб.</p>
    <p><strong>Количество:</strong> {{ selectedShelf.getCurrentQuantity() }} / {{ selectedShelf.maxQuantity }}</p>
    <label>
      📦 Макс. кол-во товара:
      <input
        type="range"
        v-model.number="selectedShelfMaxQuantity"
        min="10"
        max="100"
        step="5"
      /> {{ selectedShelfMaxQuantity }}
    </label>
  </div>

  <!-- Информация о покупателе -->
  <div v-else-if="selectedCustomer" class="info-box">
    <h3>Покупатель {{ selectedCustomer.id }}</h3>
    <p><strong>Список покупок:</strong> {{ selectedCustomer.originalShoppingList.join(', ') }}</p>
    <p><strong>Корзина:</strong> {{ selectedCustomer.cart.listNames().join(', ') }}</p>
  </div>

  <!-- Информация о менеджере -->
  <div v-else-if="selectedManager" class="info-box">
    <h3>Менеджер {{ selectedManager.id }}</h3>
    <p v-if="selectedManager.carrying">Несёт: {{ selectedManager.carrying.name }}</p>
    <p v-if="selectedManager.targetShelf">Цель: {{ selectedManager.targetShelf.productType.name }}</p>
    <p v-else>Ожидает задания</p>
  </div>

  <!-- Информация о кассе -->
  <div v-else-if="selectedCheckout !== null" class="info-box">
    <h3>Касса №{{ selectedCheckout + 1 }} — список обслуженных</h3>
    <p><strong>Выручка:</strong> {{ store.checkouts[selectedCheckout].totalRevenue }} руб.</p>

    <!-- Список обслуженных покупателей -->
    <div class="served-customers-box">
      <ul>
        <li
          v-for="(entry, i) in store.checkouts[selectedCheckout].servedCustomers"
          :key="i"
        >
          <strong>Покупатель {{ entry.customerId }}</strong> — {{ entry.total }} руб.
          <span v-if="entry.unneededTotal > 0">
            (лишнего на {{ entry.unneededTotal }} руб.)
          </span><br />
          <em>Список покупок:</em> {{ entry.shoppingList.join(', ') || '–' }}<br />
          <em>Корзина:</em> {{ entry.cartItems.join(', ') || '–' }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import Store from '../classes/Store.js'; // Импорт основного класса магазина

export default {
  data() {
    return {
      // Основной объект магазина
      store: new Store(),

      // Состояние симуляции
      running: false,
      hasBeenReset: true,
      wasPaused: false,

      // Параметры симуляции
      speed: 200, // скорость тика (мс)
      spawnInterval: 1000, // интервал появления покупателей
      maxCustomers: 5, // максимальное количество покупателей
      pickingDelay: 1000, // задержка взятия товара (мс)
      checkoutSpeed: 500, // скорость обработки на кассе (мс на товар)
      attractivenessMultiplier: 1.0, // коэффициент привлекательности товара
      managerCount: 1, // количество менеджеров
      restockingDelay: 1000, // задержка пополнения (мс)
      restockAmount: 1, // сколько товара приносят за раз

      // Таймеры и контроль времени
      interval: null,
      lastTickTime: 0,
      lastSpawnTime: 0,

      // Размер ячейки на экране
      cellSize: 40,

      // Выбранные сущности
      selectedShelf: null,
      selectedCustomer: null,
      selectedManager: null,
      selectedCheckout: null,

      // Отображение инфо по кассам
      visibleCheckoutsInfo: [],

      // Для ползунка управления maxQuantity
      selectedShelfMaxQuantity: 50,
    };
  },

  mounted() {
    // Инициализация массива для отображения информации по каждой кассе
    this.visibleCheckoutsInfo = this.store.checkouts.map(() => false);
  },

  computed: {
    // Размеры карты
    mapWidth() { return this.store.mapWidth; },
    mapHeight() { return this.store.mapHeight; },

    // Общая выручка со всех касс
    totalRevenue() {
      return this.store.checkouts.reduce((sum, co) => sum + co.totalRevenue, 0);
    },

    // Сумма за ненужные товары у всех касс
    unneededRevenue() {
      return this.store.checkouts.reduce(
        (sum, co) => sum + co.servedCustomers.reduce((sub, entry) => sub + entry.unneededTotal, 0),
        0
      );
    },

    // Стили контейнера сетки
    gridContainerStyle() {
      return {
        width: `${this.mapWidth * this.cellSize}px`,
        height: `${this.mapHeight * this.cellSize}px`,
        position: 'relative',
        backgroundColor: '#f9f9f9',
        border: '2px solid #444',
      };
    },
  },

  methods: {
    // Преобразование индекса в координаты x/y
    x(i) { return (i - 1) % this.mapWidth; },
    y(i) { return Math.floor((i - 1) / this.mapWidth); },

    // Вычисление стиля для отображения сущности (позиция и анимация)
    entityStyle(ent) {
      if (!ent.position) return {};
      return {
        position: 'absolute',
        width: `${this.cellSize}px`,
        height: `${this.cellSize}px`,
        fontSize: `${this.cellSize * 0.6}px`,
        lineHeight: `${this.cellSize}px`,
        textAlign: 'center',
        transform: `translate(${ent.position.x * this.cellSize}px, ${ent.position.y * this.cellSize}px)`,
        transition: 'transform 0.3s linear',
      };
    },

    // Определение класса клетки (полка, касса, пусто)
    getCellClass(x, y) {
      if (this.store.checkouts.some(co => co.position.x === x && co.position.y === y)) {
        return 'cell-checkout';
      }
      const shelf = this.store.getShelfAt(x, y);
      if (shelf) {
        if (this.selectedManager?.targetShelf?.position.x === x &&
            this.selectedManager.targetShelf.position.y === y) {
          return 'cell-shelf target-shelf';
        }
        return 'cell-shelf';
      }
      return 'cell-empty';
    },

    // Выбор сущности по клику
    selectEntity(x, y) {
      this.selectedShelf = this.store.getShelfAt(x, y);
      this.selectedCustomer = this.store.getCustomerAt(x, y);
      this.selectedManager = this.store.getManagerAt(x, y);
      const ci = this.store.checkouts.findIndex(co => co.position.x === x && co.position.y === y);
      this.selectedCheckout = ci >= 0 ? ci : null;
    },

    // Выбор конкретной сущности (и сброс остальных)
    selectCustomer(c) {
      this.selectedCustomer = c;
      this.selectedShelf = this.selectedManager = this.selectedCheckout = null;
    },
    selectManager(m) {
      this.selectedManager = m;
      this.selectedCustomer = this.selectedShelf = this.selectedCheckout = null;
    },
    selectCheckout(idx) {
      this.selectedCheckout = idx;
      this.selectedShelf = this.selectedCustomer = this.selectedManager = null;
    },

    // Главный цикл симуляции (тик)
    tick() {
      const now = performance.now();
      const dt = this.lastTickTime ? now - this.lastTickTime : this.speed;
      this.lastTickTime = now;

      // Появление покупателей
      if (now - this.lastSpawnTime >= this.spawnInterval) {
        if (this.store.customers.length < this.maxCustomers) {
          this.store.addCustomer();
        }
        this.lastSpawnTime = now;
      }

      this.store.tick(dt);
      this.$forceUpdate(); // Обновить UI
    },

    // Старт симуляции
    startSimulation() {
      if (this.running || !this.hasBeenReset) return;
      this.running = true;
      this.hasBeenReset = false;
      this.lastTickTime = 0;
      this.lastSpawnTime = 0;
      this.interval = setInterval(this.tick, this.speed);
    },

    // Пауза симуляции
    pauseSimulation() {
      clearInterval(this.interval);
      this.running = false;
      this.wasPaused = true;
    },

    // Продолжение после паузы
    resumeSimulation() {
      if (this.running || !this.wasPaused) return;
      this.running = true;
      this.wasPaused = false;
      this.lastTickTime = 0;
      this.interval = setInterval(this.tick, this.speed);
    },

    // Сброс симуляции
    resetSimulation() {
      this.pauseSimulation();
      this.store.reset(this.maxShelfQuantity); // сброс магазина
      this.selectedShelf = this.selectedCustomer = this.selectedManager = this.selectedCheckout = null;
      this.hasBeenReset = true;
      this.wasPaused = false;
    },

    // Переключение видимости блока с информацией по кассе
    toggleCheckoutInfo(index) {
      this.visibleCheckoutsInfo = this.visibleCheckoutsInfo.map((v, i) => i === index ? !v : v);
    },

    // Получить покупателя по id (например, из отчёта)
    getCustomerById(id) {
      return this.store.customers.find(c => c.id === id);
    },
  },

  watch: {
    // При выборе новой полки обновляем ползунок maxQuantity
    selectedShelf(newShelf) {
      if (newShelf) {
        this.selectedShelfMaxQuantity = newShelf.maxQuantity;
      }
    },

    // Изменение максимального количества товара на полке
    selectedShelfMaxQuantity(newVal) {
      if (this.selectedShelf) {
        this.selectedShelf.maxQuantity = newVal;
        if (this.selectedShelf.getCurrentQuantity() > newVal) {
          this.selectedShelf.currentQuantity = newVal;
        }
      }
    },

    // Обновление задержки взятия товара
    pickingDelay(newDelay) {
      this.store.pickingDelay = newDelay;
    },

    // Обновление максимального количества товара на всех полках
    maxShelfQuantity(newVal) {
      for (const shelf of this.store.shelves) {
        shelf.maxQuantity = newVal;
        if (shelf.getCurrentQuantity() > newVal) {
          shelf.currentQuantity = newVal;
        }
      }
    },

    // Изменение задержки пополнения для менеджеров
    restockingDelay(newDelay) {
      this.store.managers.forEach(m => m.restockingDelay = newDelay);
    },

    // Изменение количества менеджеров
    managerCount(newCount) {
      const current = this.store.managers.length;
      if (newCount > current) {
        for (let i = current; i < newCount; i++) {
          this.store.addManager();
        }
      } else if (newCount < current) {
        this.store.managers.splice(newCount);
      }
    },

    // Изменение скорости тика (перезапуск таймера)
    speed(newVal) {
      if (this.running) {
        clearInterval(this.interval);
        this.interval = setInterval(this.tick, newVal);
      }
    },

    // Изменение количества товара за одну пополняемую операцию
    restockAmount(newAmount) {
      this.store.managers.forEach(m => m.restockAmount = newAmount);
    },

    // Изменение коэффициента привлекательности
    attractivenessMultiplier(newMultiplier) {
      this.store.attractivenessMultiplier = newMultiplier;
    },

    // Изменение скорости оплаты на кассах
    checkoutSpeed(newSpeed) {
      this.store.checkouts.forEach(co => {
        co.processingSpeedPerItem = newSpeed;
      });
    },
  },

  beforeUnmount() {
    // Очистка таймера при удалении компонента
    clearInterval(this.interval);
  },
};
</script>


<style scoped>
/* Контейнер с сеткой (полем) */
.grid-container {
  user-select: none;     /* Запрет на выделение мышью */
  flex-shrink: 0;        /* Запрет на сжатие внутри flex-контейнера */
}

/* Общие стили клетки */
.cell {
  float: left;           /* Клетки идут в ряд */
  width: 40px;
  height: 40px;
  box-sizing: border-box;
  border: 1px solid #ccc; /* Сетка */
}

/* Типы клеток */
.cell-empty { background: #f8f8f8; }           /* Пустая клетка */
.cell-shelf { background: lightgreen; }        /* Полка */
.target-shelf { background: red !important; }  /* Целевая полка менеджера */
.cell-checkout { background: lightblue; }      /* Касса */

/* Общие стили сущностей (иконки поверх поля) */
.entity {
  pointer-events: auto; /* Позволяет кликать */
}

/* z-index для управления наложением */
.customer { z-index: 12; }  /* Покупатель поверх всего */
.manager  { z-index: 11; }  /* Менеджер чуть ниже */
.checkout { z-index: 10; color: white; } /* Касса — самая нижняя среди сущностей */

/* Основная область (сетка + панель управления) */
.main-area {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 100px; /* Отступ между сеткой и панелью */
}

/* Обёртка над кнопками и ползунками */
.controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Информационный блок (о покупателе, кассе, полке, менеджере) */
.info-box {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #888;
  background: #eee;
  width: 320px;

  max-height: 300px;     /* Ограничение высоты */
  overflow-y: auto;      /* Вертикальная прокрутка при переполнении */
}

/* Кнопка 👁 возле кассы */
.checkout-button {
  position: absolute;
  z-index: 20;         /* Поверх кассы и других сущностей */
  background: white;
  border: 1px solid #888;
  border-radius: 4px;
  padding: 2px;
}

/* Блок со списком обслуженных покупателей */
.served-customers-box {
  max-height: 160px;   /* Ограничение по высоте */
  max-width: 100%;     /* Не шире родителя */
  overflow: auto;      /* Прокрутка по x и y */
  padding: 4px;
  border: 1px solid #ccc;
  background: #fff;
  margin-top: 10px;
}

/* Список внутри списка обслуженных */
.served-customers-box ul {
  padding-left: 16px;
  margin: 0;
}

/* Кастомный скроллбар */
.served-customers-box::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.served-customers-box::-webkit-scrollbar-thumb {
  background-color: #aaa;
  border-radius: 3px;
}

/* Обёртка для всех контролов */
.controls-wrapper {
  display: flex;
  flex-direction: column;
  width: 320px;
  max-height: 320px;
  overflow: hidden;
  border: 1px solid #aaa;
  padding: 10px;
  box-sizing: border-box;
  background: #f5f5f5;
}

/* Кнопки управления симуляцией (Старт, Пауза и т.д.) */
.controls-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2 столбца */
  gap: 8px;
  margin-bottom: 10px;
}

/* Стили кнопок */
.controls-buttons button {
  padding: 8px;
  font-size: 14px;
  width: 100%;
  height: 40px;
  box-sizing: border-box;
}

/* Блок с ползунками */
.controls-scrollable {
  overflow-y: auto;           /* Вертикальный скролл */
  overflow-x: hidden;         /* Убираем горизонтальный скролл */
  flex-grow: 1;               /* Растягивается в доступное пространство */
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 100%;
  padding-right: 4px;         /* Для отображения скроллбара */
}

/* Обёртка над каждой группой label + input */
.controls-scrollable label {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  white-space: nowrap;       /* 💡 Не переносить подпись ползунка */
}

/* Ползунки */
.controls-scrollable input[type="range"] {
  width: 100%;
  margin-top: 4px;
  box-sizing: border-box;
}
</style>
