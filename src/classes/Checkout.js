export default class Checkout {
  constructor(x, y) {
    this.position = { x, y };
    this.totalRevenue = 0;
  }

  checkout(customer) {
    this.totalRevenue += customer.cart.getTotalPrice();
  }
}
