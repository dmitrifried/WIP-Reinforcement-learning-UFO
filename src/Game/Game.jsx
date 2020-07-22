import React, { useState, useEffect, useRef } from "react";
import Two from "two.js";
import Ship from "./ship.js";

const two = new Two({ height: 500, width: 800, autostart: true });
two.makeCircle(40, 40, 10);
two.makeCircle(40, 800, 10);
two.makeCircle(1000, 0, 10);
const ship = new Ship({ two: two, x: 100, y: 100 });
document.addEventListener("keydown", (e) => {
  switch (e.keyCode) {
    case 37: // left
      e.preventDefault();
      ship.le = !ship.le;
      break;
    case 39: // right
      e.preventDefault();
      ship.re = !ship.re;
      break;
    default:
      return;
  }
});

two.bind("update", (frameCount, deltaT) => {
  ship.applyPhysics(deltaT);
});

export default function Game(props) {
  const ref = useRef(null);

  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    console.log(ship);
    if (two) {
      two.appendTo(ref.current);
      two.play();
    }
  }, []);

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          ship.reset(100, 100);
          if (stopped) {
            two.bind("update", (frameCount, deltaT) => {
              ship.applyPhysics(deltaT);
            });
            setStopped(false);
          }
        }}
      >
        Reset
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          if (stopped) {
            two.bind("update", (frameCount, deltaT) => {
              ship.applyPhysics(deltaT);
            });
            setStopped(false)
          } else {
            two.unbind("update");
            setStopped(true);
          }
        }}
      >
        {stopped ? "Start" : "Stop"}
      </button>
      <div ref={ref} />
    </>
  );
}
