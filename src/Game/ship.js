import Two from "two.js";

export default class Ship {
  constructor({ two, x, y }) {
    [this.baseX, this.baseY] = [0, 0];
    this.two = two;

    const cockpitRadius = 15;
    const shipRadius = 30;

    // left flame and right flame *basepoint* locations
    const lf = { x: this.baseX - cockpitRadius, y: this.baseY + 8 };
    const rf = { x: this.baseX + cockpitRadius, y: this.baseY + 8 };

    // each Two object is rendered in order of first -> front, last -> back.

    let base = new Two.Ellipse(this.baseX, this.baseY, shipRadius, shipRadius / 3.0);
    base.fill = "#AAAAAA";

    let cockpit = new Two.ArcSegment(this.baseX, this.baseY, 0, cockpitRadius, -Math.PI, 0);
    cockpit.fill = "#DDDDDD";

    this.leftFlameTip = new Two.Anchor(lf.x, lf.y + 15);
    let leftFlameAnchors = [
      new Two.Anchor(lf.x - 5, lf.y),
      this.leftFlameTip,
      new Two.Anchor(lf.x + 5, lf.y),
    ];
    let lFlame = new Two.Path(leftFlameAnchors, false, false);
    lFlame.fill = "Red";

    let rFlame = lFlame.clone();
    this.rightFlameTip = rFlame.vertices[1];
    rFlame.vertices.forEach((v) => {
      v.x += rf.x - lf.x;
    });

    this.group = two.makeGroup(lFlame, rFlame, base, cockpit); // flameGroup, bodyGroup);

    two.add(this.group);

    this.group.translation.set(x, y);
    this.leftEngine = true;
    this.rightEngine = true;
    this.v = new Two.Vector(0, 0);
    this.aV = 0.1;
  }

  /**
   * Set the ship back to (x, y) position with no velocity or rotation, with engines on.
   * @param {Number} x
   * @param {Number} y
   */
  reset(x, y) {
    this.group.translation.set(x, y);
    this.group.rotation = 0;
    this.v.set(0, 0);
    this.aV = 0;
    this.leftEngine = true;
    this.rightEngine = true;
  }

  get theta() {
    return this.group.rotation - Math.PI / 2.0;
  }

  get state() {
    return {
      pos: this.group.translation,
      theta: this.group.rotation,
      v: this.v,
      aV: this.aV,
    };
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
    return 0.5;
  }

  get maxY() {
    return this.two.height - 20;
  }

  get maxX() {
    return this.two.width - 20;
  }

  get minY() {
    return 20;
  }

  get minX() {
    return 20;
  }

  /** @returns {Two.Vector} (ax, ay) */
  get acceleration() {
    let theta = this.theta;
    let [le, re] = [this.le, this.re];
    let engineMult = ((le ? 1 : 0) + (re ? 1 : 0)) * this.engineForce;
    let ay = this.gravity + engineMult * Math.sin(theta);
    let ax = engineMult * Math.cos(theta);
    return new Two.Vector(ax, ay);
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

  get le() {
    return this.leftEngine;
  }

  get re() {
    return this.rightEngine;
  }

  /**
   * @param {Boolean} leftEngine set to on/off
   */
  set le(leftEngine) {
    this.leftEngine = leftEngine;
    this.leftFlameTip.y = leftEngine ? this.baseY + 23 : this.baseY;
  }

  /**
   * @param {Boolean} leftEngine set to on/off
   */
  set re(rightEngine) {
    this.rightEngine = rightEngine;
    this.rightFlameTip.y = rightEngine ? this.baseY + 23 : this.baseY;
  }

  /**
   * Apply movement physics to the Ship. deltaT may *not* be larger than 1000ms.
   * @param {Number} deltaT timespan in milliseconds
   */
  applyPhysics(deltaT) {
    deltaT = deltaT / 1000.0;
    if (deltaT > 1) {
      return;
    }

    // y is inverted
    let a = this.acceleration;
    let aA = this.angularAcceleration;

    this.group.translation.addSelf(this.v.clone().multiplyScalar(deltaT));
    let p = this.group.translation.clone();
    p.x = Math.max(this.minX, Math.min(p.x, this.maxX));
    p.y = Math.max(this.minY, Math.min(p.y, this.maxY));

    this.group.translation = p;
    this.group.rotation += this.aV * deltaT;

    this.v.multiplyScalar(1 - deltaT * this.velocityDecay);
    this.v.addSelf(a.multiplyScalar(deltaT));
    this.v.x = this.minX < p.x && p.x < this.maxX ? this.v.x : this.v.x / 1000;
    this.v.y = this.minY < p.y && p.y < this.maxY ? this.v.y : this.v.y / 1000;

    this.aV *= 1 - deltaT * this.angularDecay;
    this.aV += aA;
  }
}