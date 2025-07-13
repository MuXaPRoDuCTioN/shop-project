import { findPath } from './Pathfinding.js';

export default class Manager {
  constructor(id, x, y, sector, mapWidth, mapHeight, isWalkable) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.targetShelf = null;
    this.carrying = null;
    this.sector = sector; // {x1, x2, y1, y2}
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.isWalkable = isWalkable;

    this.path = [];
    this.pathIndex = 0;
  }

  isNear(pos) {
    const dx = Math.abs(pos.x - this.x);
    const dy = Math.abs(pos.y - this.y);
    return (dx + dy) === 1;
  }

  planPathTo(target) {
    const path = findPath(
      { x: this.x, y: this.y },
      target,
      this.isWalkable,
      this.mapWidth,
      this.mapHeight
    );
    if (path) {
      this.path = path;
      this.pathIndex = 1;
    } else {
      this.path = [];
      this.pathIndex = 0;
    }
  }

  assignRestockTask(shelves) {
    if (this.targetShelf) return; // уже идет

    const inSector = shelves.filter(s =>
      s.position.x >= this.sector.x1 && s.position.x <= this.sector.x2 &&
      s.position.y >= this.sector.y1 && s.position.y <= this.sector.y2 &&
      s.needsRestock()
    );
    if (inSector.length > 0) {
      const target = inSector.sort((a, b) => a.getCurrentQuantity() - b.getCurrentQuantity())[0];
      this.targetShelf = target;
      this.planPathTo({ x: target.position.x, y: target.position.y });
    }
  }

  moveStep() {
    if (!this.path || this.pathIndex >= this.path.length) return;

    const targetPos = this.path[this.pathIndex];
    if (targetPos.x === this.x && targetPos.y === this.y) {
      this.pathIndex++;
      return;
    }

    this.x = targetPos.x;
    this.y = targetPos.y;
    this.pathIndex++;
  }

  tryRestock() {
    if (!this.targetShelf) return;
    if (!this.carrying) {
      this.carrying = this.targetShelf.productType;
    }
    if (this.isNear(this.targetShelf.position)) {
      this.targetShelf.restock(2);
      this.carrying = null;
      this.targetShelf = null;
      this.path = [];
      this.pathIndex = 0;
    }
  }
}
