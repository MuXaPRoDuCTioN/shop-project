import { findPath } from './Pathfinding.js';

export default class Manager {
  static idCounter = 1;

  constructor(shelves, position = { x: 0, y: 0 }) {
    this.id = Manager.idCounter++;
    this.shelves = shelves;
    this.position = position;
    this.path = [];
    this.targetShelf = null;
  }

  getAdjacentTile(pos, store) {
    const dirs = [
      { x: pos.x + 1, y: pos.y },
      { x: pos.x - 1, y: pos.y },
      { x: pos.x, y: pos.y + 1 },
      { x: pos.x, y: pos.y - 1 },
    ];
    return dirs.find(p =>
      p.x >= 0 && p.x < store.mapWidth &&
      p.y >= 0 && p.y < store.mapHeight &&
      !store.getShelfAt(p.x, p.y)
    ) || this.position;
  }

  chooseTarget() {
    for (const shelf of this.shelves) {
      if (shelf.getCurrentQuantity() < shelf.maxQuantity) {
        return shelf;
      }
    }
    return null;
  }

  update(store) {
    if (!this.targetShelf || this.targetShelf.getCurrentQuantity() === this.targetShelf.maxQuantity) {
      this.targetShelf = this.chooseTarget(store);
      this.path = [];
    }

    if (this.targetShelf) {
      const targetPos = this.getAdjacentTile(this.targetShelf.position, store);

      if (!this.path.length) {
        this.path = findPath(
          this.position,
          targetPos,
          (x, y) => !store.getShelfAt(x, y),
          store.mapWidth,
          store.mapHeight
        ) || [];
      }

      if (this.path.length > 0) {
        this.position = this.path.shift();
      }

      const adjacent = Math.abs(this.position.x - this.targetShelf.position.x) +
                       Math.abs(this.position.y - this.targetShelf.position.y) === 1;

      if (adjacent) {
        this.targetShelf.restock();
        this.path = [];
        this.targetShelf = null;
      }
    }
  }

  reset() {
    this.position = { x: 0, y: 0 };
    this.path = [];
    this.targetShelf = null;
  }
}
