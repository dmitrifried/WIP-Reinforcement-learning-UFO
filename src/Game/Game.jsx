import React, { useState, useEffect, useRef } from "react";
import Two from "two.js";
import Ship from "./ship.js";

export default function Game(props) {
  // const [state, setstate] = useState(initialState)
  const ref = useRef(null);

  const [two, setTwo] = useState(new Two({ height: 800, width: 1000, autostart: true }));
  const [ship, setShip] = useState(new Ship({ two: two, x: 100, y: 100 }));
  const [keydownListener, setKeydownListener] = useState((e) => {});

  useEffect(() => {
    two.appendTo(ref.current);
    two.update();
  }, [two]);

  useEffect(() => {
    document.removeEventListener("keydown", keydownListener);
    let newListener = (e) => {
      switch (e?.keyCode) {
        case 37: // left
          ship.le = !ship.le;
          ship.applyPhysics(0.005);
          break;
        case 39: // right
          ship.re = !ship.re;
          ship.applyPhysics(0.005);
          break;
        default:
          return;
      }
    };
    setKeydownListener(newListener);

    document.addEventListener("keydown", newListener);
  }, [ship]);

  return (
    <>
      <button
        onClick={(e) => {
          console.log("arr")
          e.preventDefault();
          console.log(ship.group);
          two.remove(ship.group);
          let newShip = new Ship({ two: two, x: 100, y: 100 });
          setShip(newShip);
        }}
      >
        Reset
      </button>
      <div ref={ref} />
    </>
  );
}
