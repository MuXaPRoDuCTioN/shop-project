<template>
  <div>
    <h1>Супермаркет (🟩 — полка, 🟦 — касса, 🧍 — покупатель, 🧑‍💼 — менеджер)</h1>

    <div class="controls">
      <button @click="startSimulation" :disabled="running">▶️ Старт</button>
      <button @click="pauseSimulation" :disabled="!running">⏸️ Пауза</button>
      <button @click="resumeSimulation" :disabled="running">🔄 Продолжить</button>
      <button @click="resetSimulation">🔁 Сброс</button>
      <label>
        ⏱️ Скорость:
        <input type="range" v-model="speed" min="100" max="2000" step="100" />
      </label>
    </div>

    <p>Выручка: {{ store.getTotalRevenue() }} руб.</p>

    <div class="grid" :style="gridStyle">
      <div
        v-for="i in mapWidth * mapHeight"
        :key="i"
        class="cell"
        :class="getCellClass(x(i), y(i))"
        @click="selectEntity(x(i), y(i))"
      >
        <span v-if="customerAt(x(i), y(i))" class="customer">🧍</span>
        <span v-else-if="managerAt(x(i), y(i))" class="manager">🧑‍💼</span>
      </div>
    </div>

    <div v-if="selectedCustomer" class="info-box">
      <h3>Покупатель {{ selectedCustomer.id }}</h3>
      <p><strong>Список покупок:</strong> {{ selectedCustomer.shoppingList.join(', ') }}</p>
      <p><strong>Корзина:</strong> {{ selectedCustomer.cart.listNames().join(', ') }}</p>
    </div>

    <div v-else-if="selectedShelf" class="info-box">
      <h3>Полка</h3>
      <p><strong>Товар:</strong> {{ selectedShelf.productType.name }}</p>
      <p><strong>Количество:</strong> {{ selectedShelf.getCurrentQuantity() }} / {{ selectedShelf.maxQuantity }}</p>
    </div>

    <div v-else-if="selectedManager" class="info-box">
      <h3>Менеджер {{ selectedManager.id }}</h3>
      <p v-if="selectedManager.carrying">
        Несёт: {{ selectedManager.carrying.name }}<br />
        К точке: ({{ selectedManager.targetShelf?.position.x }}, {{ selectedManager.targetShelf?.position.y }})
      </p>
      <p v-else>
        Ожидает задания
      </p>
    </div>
  </div>
</template>

<script>
import Store from '../classes/Store.js';

export default {
  data() {
    return {
      store: new Store(),
      selectedCustomer: null,
      selectedShelf: null,
      selectedManager: null,
      interval: null,
      speed: 1000,
      running: false,
    };
  },
  computed: {
    mapWidth() {
      return this.store.mapWidth;
    },
    mapHeight() {
      return this.store.mapHeight;
    },
    gridStyle() {
      return {
        display: 'grid',
        gridTemplateColumns: `repeat(${this.mapWidth}, 40px)`,
        gridTemplateRows: `repeat(${this.mapHeight}, 40px)`,
        gap: '1px',
      };
    },
  },
  methods: {
    x(i) {
      return (i - 1) % this.mapWidth;
    },
    y(i) {
      return Math.floor((i - 1) / this.mapWidth);
    },
    addCustomer() {
      // Для примера, покупатель хочет 1-2 случайных товара
      const allProducts = this.store.availableProducts.map((p) => p.name);
      const count = Math.floor(Math.random() * 2) + 1;
      const randomItems = [];
      for (let i = 0; i < count; i++) {
        randomItems.push(allProducts[Math.floor(Math.random() * allProducts.length)]);
      }
      this.store.addCustomer(randomItems);
    },
    tick() {
      this.store.tick();
    },
    startSimulation() {
      if (this.running) return;
      this.addCustomer();
      this.interval = setInterval(() => {
        this.tick();
        if (Math.random() < 0.3) this.addCustomer();
      }, this.speed);
      this.running = true;
    },
    pauseSimulation() {
      if (!this.running) return;
      clearInterval(this.interval);
      this.interval = null;
      this.running = false;
    },
    resumeSimulation() {
      if (this.running) return;
      this.interval = setInterval(() => {
        this.tick();
        if (Math.random() < 0.3) this.addCustomer();
      }, this.speed);
      this.running = true;
    },
    resetSimulation() {
      this.pauseSimulation();
      this.store.reset();
      this.selectedCustomer = null;
      this.selectedShelf = null;
      this.selectedManager = null;
    },
    isShelf(x, y) {
      return !!this.store.getShelfAt(x, y);
    },
    isCheckout(x, y) {
      const c = this.store.checkout.position;
      return c.x === x && c.y === y;
    },
    customerAt(x, y) {
      return this.store.getCustomerAt(x, y);
    },
    managerAt(x, y) {
      return this.store.getManagerAt(x, y);
    },
    selectEntity(x, y) {
      this.selectedCustomer = this.customerAt(x, y) || null;
      this.selectedShelf = this.store.getShelfAt(x, y) || null;
      this.selectedManager = this.managerAt(x, y) || null;
    },
    getCellClass(x, y) {
      if (this.isShelf(x, y)) return 'shelf';
      if (this.isCheckout(x, y)) return 'checkout';
      return '';
    },
  },
  watch: {
    speed() {
      if (this.running) {
        this.pauseSimulation();
        this.resumeSimulation();
      }
    },
  },
};
</script>

<style scoped>
.grid {
  margin-top: 20px;
}
.cell {
  width: 40px;
  height: 40px;
  border: 1px solid #ccc;
  background-color: #f9f9f9;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  cursor: pointer;
}
.shelf {
  background-color: lightgreen !important;
}
.checkout {
  background-color: lightblue !important;
}
.customer {
  font-size: 24px;
  line-height: 1;
}
.manager {
  font-size: 24px;
  line-height: 1;
}
.controls {
  margin-bottom: 10px;
}
.controls button,
.controls input {
  margin-right: 10px;
}
.info-box {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #888;
  background: #eee;
  width: 320px;
}
</style>
