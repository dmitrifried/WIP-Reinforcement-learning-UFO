export default class Ship {
    constructor({two, x, y}) {
        const radius = 15;

        let base = two.makeEllipse(x, y, 30, 10);
        base.fill = '#AAAAAA'
        let cockpit = two.makeArcSegment(x, y, 0, radius, -Math.PI, 0);
        cockpit.fill = '#DDDDDD'
        two.update();
    }
};