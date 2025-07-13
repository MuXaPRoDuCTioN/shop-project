export default class Checkout {
  constructor(x, y) {
    this.revenue = 0;
    this.position = { x, y };
  }

  process(customer) {
    this.revenue += customer.tryCheckout(this.position);
  }
}