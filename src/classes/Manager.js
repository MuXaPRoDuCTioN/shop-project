import { findPath } from './Pathfinding.js';

export default class Manager {
  constructor(id, shelves, position) {
    this.id = id;
    this.shelves = shelves;
    this.position = { ...position };
    this.targetShelf = null;
    this.path = [];
    this.carrying = null;
  }

  reset() {
    this.path = [];
    this.carrying = null;
    this.targetShelf = null;
  }

  update(store) {
    if (!this.targetShelf || this.targetShelf.getCurrentQuantity() >= this.targetShelf.maxQuantity) {
      this.targetShelf = this.shelves.find(s => s.getCurrentQuantity() < s.maxQuantity);
      if (this.targetShelf) {
        const adj = this.getAdjacentTile(this.targetShelf.position, store);
        this.path = findPath(this.position, adj,
          (x, y) => !store.getShelfAt(x, y),
          store.mapWidth, store.mapHeight
        ) || [];
      }
    }

    if (this.path.length > 0) {
      this.position = this.path.shift();
    }

    if (this.targetShelf) {
      const adj = this.getAdjacentTile(this.targetShelf.position, store);
      if (this.position.x === adj.x && this.position.y === adj.y) {
        this.targetShelf.restock();
        this.targetShelf = null;
        this.path = [];
      }
    }
  }

  getAdjacentTile(pos, store) {
    if (!pos) return { x: 0, y: 0 };
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
    ) || pos;
  }
}
