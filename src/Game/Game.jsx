import React, { useState, useEffect, useRef } from "react";
import Two from "two.js";
import Ship from "./ship.js";

const two = new Two({ height: 500, width: 800, autostart: true });
let leftWall = two.makePath(0, 0, 0, 500, 15, 480, 15, 0, true);
leftWall.fill = "#e5e5e5"
let floor = two.makePath(15, 480, 800, 480, 800, 500, 0, 500);
floor.fill = "#ccddcc"
two.makeLine(390, 240, 410, 260);
two.makeLine(410, 240, 390, 260);
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
            setStopped(false);
          } else {
            two.unbind("update");
            setStopped(true);
          }
        }}
      >
        {stopped ? "Start" : "Stop"}
      </button>
      <p>Use ← and → to turn on the left and right engines. Aim for the X.</p>
      <br/>
      <div ref={ref} style={{ border: "solid", display: "inline-block" }} />
    </>
  );
}
