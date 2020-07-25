import Vector from "victor";

export default class SimulatedShip {
  constructor(x, y) {
    this.twoHeight = 500;
    this.twoWidth = 800;

    this.reset(x, y);
  }

  /**
   * Set the ship back to (x, y) position with no velocity or rotation, with engines on.
   * @param {Number} x
   * @param {Number} y
   */
  reset(x, y) {
    this.p = Vector(x, y);
    this.v = Vector(0, 0);
    this.aV = 0;
    this.leftEngine = true;
    this.rightEngine = true;
    this.theta = 0;
  }

  get gravity() {
    return 300.0;
  }

  get engineForce() {
    // 'acceleration' rather than 'force'
    return 250.0;
  }

  get engineTorque() {
    // 'angular acceleration' rather than 'torque'
    return 0.1;
  }

  /** Rate to reduce velocity per second, e.g. 0.2 reduces velocity by 20% per second. */
  get velocityDecay() {
    return 0.2;
  }

  /** Rate to reduce angular velocity per second, e.g. 0.2 reduces velocity by 20% per second. */
  get angularDecay() {
    return 0.2;
  }

  get maxY() {
    return this.twoHeight - 20;
  }

  get maxX() {
    return this.twoWidth - 20;
  }

  get minY() {
    return 20;
  }

  get minX() {
    return 20;
  }

  /** @returns {Vector} (ax, ay) */
  get acceleration() {
    let theta = this.theta;
    let [le, re] = [this.le, this.re];
    let engineMult = ((le ? 1 : 0) + (re ? 1 : 0)) * this.engineForce;
    let ay = this.gravity + engineMult * Math.sin(theta);
    let ax = engineMult * Math.cos(theta);
    return Vector(ax, ay);
  }

  /** @returns {Number} angular acceleration as scalar */
  get angularAcceleration() {
    let [le, re] = [this.leftEngine, this.rightEngine];
    if (le && !re) {
      return this.engineTorque;
    } else if (!le && re) {
      return -this.engineTorque;
    } else {
      return 0;
    }
  }

  /**
   * @param {Boolean} leftEngine set to on/off
   */
  set le(leftEngine) {
    this.leftEngine = leftEngine;
  }

  /**
   * @param {Boolean} leftEngine set to on/off
   */
  set re(rightEngine) {
    this.rightEngine = rightEngine;
  }

  /**
   * Apply movement physics to the Ship. deltaT may *not* be larger than 1000ms.
   * @param {Number} deltaT timespan in milliseconds
   */
  applyPhysics(deltaT) {
    deltaT = deltaT / 1000.0;

    // y is inverted
    let a = this.acceleration;
    let aA = this.angularAcceleration;

    this.p.add(this.v.clone().multiplyScalar(deltaT));
    let p = this.p.clone();
    p.x = Math.max(this.minX, Math.min(p.x, this.maxX));
    p.y = Math.max(this.minY, Math.min(p.y, this.maxY));

    this.p = p;
    this.p += this.aV * deltaT;

    this.v.multiplyScalar(1 - deltaT * this.velocityDecay);
    this.v.addSelf(a.multiplyScalar(deltaT));
    this.v.x = this.minX < p.x && p.x < this.maxX ? this.v.x : this.v.x / 1000;
    this.v.y = this.minY < p.y && p.y < this.maxY ? this.v.y : this.v.y / 1000;

    this.aV *= 1 - deltaT * this.angularDecay;
    this.aV += aA;
  }

  /**
   * Simulate physics for a number of milliseconds using 
   *  a smaller deltaT for continuous physics.
   * @param {Number} totalT
   * @param {Number} deltaT
   */
  simulateTime(totalT, deltaT) {
    let n = totalT / deltaT;
    for (let i = 0; i < n; i++) {
      this.applyPhysics(deltaT);
    }
  }
}
