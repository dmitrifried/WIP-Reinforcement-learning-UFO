import Two from "two.js";

export default class Ship {
  constructor({ two, x, y }) {
    const cockpitRadius = 15;
    const shipRadius = 30;
    const lf = { x: x - cockpitRadius, y: y + 8 };
    const rf = { x: x + cockpitRadius, y: y + 8 };
    [this.x, this.y, this.two] = [x, y, two];
    [this.baseX, this.baseY] = [100, 100];

    let base = two.makeEllipse(x, y, shipRadius, shipRadius / 3.0);
    base.fill = "#AAAAAA";

    let cockpit = two.makeArcSegment(x, y, 0, cockpitRadius, -Math.PI, 0);
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

    let flameGroup = two.makeGroup(lFlame, rFlame);
    let bodyGroup = two.makeGroup(base, cockpit);
    this.group = two.makeGroup(flameGroup, bodyGroup);
    this.group.translation.set(x, y)

    two.add(this.group);

    this.leftEngine = true;
    this.rightEngine = true;
    [this.vX, this.vY] = [0, 0];
    this.angularV = 0;
  }

  get theta() {
    return this.group.rotation - Math.PI / 2.0;
  }

  get state() {
    return [this.x, this.y, this.vX, this.vY, this.angularV];
  }

  get gravity() {
    return -3.0;
  }

  get mass() {
    return 100000;
  }

  get engineForce() {
    return 5.0;
  }

  /** @returns [ax, ay] */
  get acceleration() {
    let theta = this.theta;
    let [le, re] = [this.le, this.re];
    let engineMult = ((le ? 1 : 0) + (re ? 1 : 0)) * this.engineForce;
    let ay = this.mass * this.gravity + engineMult * Math.sin(theta);
    let ax = engineMult * Math.cos(theta);
    return [ax, ay];
  }

  get angularAcceleration() {
    const torqueMult = 200;
    let [le, re] = [this.leftEngine, this.rightEngine];
    if (le && !re) {
      return torqueMult * this.engineForce;
    } else if (!le && re) {
      return -torqueMult * this.engineForce;
    } else {
      return 0;
    }
  }

  get angularDecay() {
    return 0.8;
  }

  get le() {
    return this.leftEngine;
  }

  get re() {
    return this.rightEngine;
  }

  set le(leftEngine) {
    this.leftEngine = leftEngine;
    this.leftFlameTip.y = leftEngine ? this.baseY + 23 : this.baseY;
  }

  set re(rightEngine) {
    this.rightEngine = rightEngine;
    this.rightFlameTip.y = rightEngine ? this.baseY + 23 : this.baseY;
  }

  applyPhysics(timespan) {
    // y is inverted
    let [ax, ay] = this.acceleration;
    let angA = this.angularAcceleration;

    this.x += this.vX * timespan;
    this.y += this.vY * timespan;
    this.group.translation.set(this.x, this.y);
    this.group.rotation = this.theta + this.angularV * timespan + Math.PI / 2.0;

    this.vX += ax * timespan;
    this.vY -= ay * timespan;
    this.angularV *= 1 - this.angularDecay * timespan;
    this.angularV += angA * timespan;
  }
}
