<template>
  <div>
    <h1>Супермаркет (🟩 — полка, 🟦 — касса)</h1>

    <div class="controls">
      <button @click="startSimulation" :disabled="running">▶️ Старт</button>
      <button @click="pauseSimulation" :disabled="!running">⏸️ Пауза</button>
      <button @click="resumeSimulation" :disabled="running">🔄 Продолжить</button>
      <button @click="resetSimulation">🔁 Сброс</button>

      <label>
        ⏱️ Тик (мс за тик):
        <input type="range" v-model.number="speed" min="50" max="1000" step="50" /> {{ speed }}
      </label>

      <label>
        👥 Макс покупателей:
        <input type="range" v-model.number="maxCustomers" min="1" :max="20" /> {{ maxCustomers }}
      </label>

      <label>
        🚪 Интервал входа (мс):
        <input type="range" v-model.number="spawnInterval" min="200" max="5000" step="200" /> {{ spawnInterval }}
      </label>
    </div>

    <p>Выручка: {{ totalRevenue }} руб.</p>

    <div class="grid-container" :style="gridContainerStyle">
      <!-- Клетки поля -->
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

      <!-- Кассы -->
<div
  v-for="(checkout, index) in store.checkouts"
  :key="'checkout' + index"
  class="entity checkout"
  :style="entityStyle(checkout)"
  @click.stop="selectCheckout(index)"
>
  🟦
  <!-- Кнопка справа от кассы -->
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

    <!-- Инфоблок -->
    <div v-if="selectedShelf" class="info-box">
      <h3>Полка</h3>
      <p><strong>Товар:</strong> {{ selectedShelf.productType.name }}</p>
      <p><strong>Количество:</strong> {{ selectedShelf.getCurrentQuantity() }} / {{ selectedShelf.maxQuantity }}</p>
    </div>

    <div v-else-if="selectedCustomer" class="info-box">
      <h3>Покупатель {{ selectedCustomer.id }}</h3>
      <p><strong>Список покупок:</strong> {{ selectedCustomer.originalShoppingList.join(', ') }}</p>
      <p><strong>Корзина:</strong> {{ selectedCustomer.cart.listNames().join(', ') }}</p>
    </div>

    <div v-else-if="selectedManager" class="info-box">
      <h3>Менеджер {{ selectedManager.id }}</h3>
      <p v-if="selectedManager.carrying">Несёт: {{ selectedManager.carrying.name }}</p>
      <p v-if="selectedManager.targetShelf">Цель: {{ selectedManager.targetShelf.productType.name }}</p>
      <p v-else>Ожидает задания</p>
    </div>

    <div v-else-if="selectedCheckout !== null" class="info-box">
  <h3>Касса №{{ selectedCheckout + 1 }} — список обслуженных</h3>
  <p><strong>Выручка:</strong> {{ store.checkouts[selectedCheckout].totalRevenue }} руб.</p>

  <div class="served-customers-box">
  <ul>
    <li v-for="(entry, i) in store.checkouts[selectedCheckout].servedCustomers" :key="i">
  <strong>Покупатель {{ entry.customerId }}</strong> — {{ entry.total }} руб.
  <span v-if="entry.unneededTotal > 0"> (лишнего на {{ entry.unneededTotal }} руб.)</span>
  <br />
  <em>Список покупок:</em> {{ entry.shoppingList.join(', ') || '–' }}<br />
  <em>Корзина:</em> {{ entry.cartItems.join(', ') || '–' }}
</li>

  </ul>
</div>




</div>

  </div>
</template>

<script>
import Store from '../classes/Store.js';

export default {
  data() {
    return {
      store: new Store(),
      running: false,
      speed: 200,
      spawnInterval: 1000,
      maxCustomers: 5,
      interval: null,
      lastTickTime: 0,
      lastSpawnTime: 0,
      cellSize: 40,
      selectedShelf: null,
      selectedCustomer: null,
      selectedManager: null,
      selectedCheckout: null,
      visibleCheckoutsInfo: [],
    };
  },
  mounted() {
  this.visibleCheckoutsInfo = this.store.checkouts.map(() => false);
},
  computed: {
    mapWidth() { return this.store.mapWidth; },
    mapHeight() { return this.store.mapHeight; },
    totalRevenue() {
      return this.store.checkouts.reduce((sum, co) => sum + co.totalRevenue, 0);
    },
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
    x(i) { return (i - 1) % this.mapWidth; },
    y(i) { return Math.floor((i - 1) / this.mapWidth); },

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

    getCellClass(x, y) {
      if (this.store.checkouts.some(co => co.position.x === x && co.position.y === y)) {
        return 'cell-checkout';
      }
      if (this.store.getShelfAt(x, y)) {
        // подсветка цели менеджера
        if (this.selectedManager && this.selectedManager.targetShelf) {
          const ts = this.selectedManager.targetShelf.position;
          if (ts.x === x && ts.y === y) {
            return 'cell-shelf target-shelf';
          }
        }
        return 'cell-shelf';
      }
      return 'cell-empty';
    },

    selectEntity(x, y) {
      this.selectedShelf = this.store.getShelfAt(x, y);
      this.selectedCustomer = this.store.getCustomerAt(x, y);
      this.selectedManager = this.store.getManagerAt(x, y);
      const ci = this.store.checkouts.findIndex(co => co.position.x === x && co.position.y === y);
      this.selectedCheckout = ci >= 0 ? ci : null;
    },
    selectCustomer(c) {
      this.selectedCustomer = c; this.selectedShelf = null; this.selectedManager = null; this.selectedCheckout = null;
    },
    selectManager(m) {
      this.selectedManager = m; this.selectedCustomer = null; this.selectedShelf = null; this.selectedCheckout = null;
    },
    selectCheckout(idx) {
      this.selectedCheckout = idx; this.selectedShelf = this.selectedCustomer = this.selectedManager = null;
    },

    tick() {
      const now = performance.now();
      const dt = this.lastTickTime ? now - this.lastTickTime : this.speed;
      this.lastTickTime = now;

      // спавн покупателей
      if (now - this.lastSpawnTime >= this.spawnInterval) {
        if (this.store.customers.length < this.maxCustomers) {
          this.store.addCustomer();
        }
        this.lastSpawnTime = now;
      }

      this.store.tick(dt);
      this.$forceUpdate();
    },

    startSimulation() {
      if (this.running) return;
      this.running = true;
      this.lastTickTime = 0;
      this.lastSpawnTime = 0;
      this.interval = setInterval(this.tick, this.speed);
    },
    pauseSimulation() {
      clearInterval(this.interval);
      this.running = false;
    },
    resumeSimulation() {
      if (this.running) return;
      this.running = true;
      this.lastTickTime = 0;
      this.interval = setInterval(this.tick, this.speed);
    },
    resetSimulation() {
      this.pauseSimulation();
      this.store.reset();
      this.selectedShelf = this.selectedCustomer = this.selectedManager = this.selectedCheckout = null;
    },
    toggleCheckoutInfo(index) {
  this.visibleCheckoutsInfo = this.visibleCheckoutsInfo.map((v, i) => i === index ? !v : v);
},
getCustomerById(id) {
    return this.store.customers.find(c => c.id === id);
  },

  },
  watch: {
    speed(newVal) {
      if (this.running) {
        clearInterval(this.interval);
        this.interval = setInterval(this.tick, newVal);
      }
    },
  },
  beforeUnmount() {
    clearInterval(this.interval);
  },
};
</script>

<style scoped>
.grid-container { user-select: none; }
.cell {
  float: left;
  width: 40px; height: 40px;
  box-sizing: border-box;
  border: 1px solid #ccc;
}
.cell-empty { background: #f8f8f8; }
.cell-shelf { background: lightgreen; }
.target-shelf { background: red !important; }
.cell-checkout { background: lightblue; }
.entity { pointer-events: auto; }
.customer { z-index: 12; }
.manager { z-index: 11; }
.checkout { z-index: 10; color: white; }
.controls { margin-bottom: 10px; }
.controls > * { margin-right: 10px; }
.info-box {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #888;
  background: #eee;
  width: 320px;

  max-height: 300px; /* Ограничим по высоте */
  overflow-y: auto;  /* Добавим вертикальную прокрутку */
}

.checkout-button {
  position: absolute;
  z-index: 20;
  background: white;
  border: 1px solid #888;
  border-radius: 4px;
  padding: 2px;
}

.served-customers-box {
  max-height: 160px; /* вертикальная граница */
  max-width: 100%;   /* при необходимости — горизонтальная */
  overflow: auto;    /* прокрутка по x и y при необходимости */
  padding: 4px;
  border: 1px solid #ccc;
  background: #fff;
  margin-top: 10px;
}

.served-customers-box ul {
  padding-left: 16px;
  margin: 0;
}

.served-customers-box::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.served-customers-box::-webkit-scrollbar-thumb {
  background-color: #aaa;
  border-radius: 3px;
}

</style>
