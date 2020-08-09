import React, { useState, useEffect, useRef } from "react";
import Two from "two.js";
import Ship from "./ship.js";
import getAgent from "./agent";
import * as tf from '@tensorflow/tfjs';

tf.registerOp("BroadcastArgs")

export default function Game(props) {
  const ref = useRef(null);

  const [stopped, setStopped] = useState(false);
  const [ship, setShip] = useState(null);
  const [two, setTwo] = useState(null);
  const [agent, setAgent] = useState(null);

  /**
   * Asynchronously create an instance of the 'two.js' canvas, a Ship object, and the agent.
   */
  async function initializeGame() {
    const [gameHeight, gameWidth] = [600, 800];
    const two = new Two({ height: gameHeight, width: gameWidth, autostart: true });

    // constructing simple background
    let leftWall = two.makePath(0, 0, 0, gameHeight, 15, gameHeight - 20, 15, 0, true);
    leftWall.fill = "#e5e5e5";
    let floor = two.makePath(
      15,
      gameHeight - 20,
      gameWidth,
      gameHeight - 20,
      gameWidth,
      gameHeight,
      0,
      gameHeight
    );
    floor.fill = "#ccddcc";

    // put 'X' target in center of canvas
    two.makeLine(490, 390, 510, 410);
    two.makeLine(510, 390, 490, 410);

    const ship = new Ship({ two: two, x: 300, y: 300 });

    const agent = await getAgent();

    // Toggle left and right engines with left and right arrows.
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
      let state = ship.state;
      let outputs = agent.predict(
        { 
          'discount': tf.tensor([1.0]),
          'reward': tf.tensor([0.0]),
          // 'step_type': tf.tensor([[0]], "int32"),
          'observation': tf.tensor(
          [[state.pos.x, state.pos.y, state.theta, state.v.x, state.v.y, state.aV]]
        )},
        {batchSize: 1}
      )
      let output = outputs.arraySync()[0]
      ship.le = Math.floor(output / 2);
      ship.re = output % 2;
    });

    setShip(ship);
    setAgent(agent);
    setTwo(two);
  }
  // end initializeGame //

  useEffect(() => {initializeGame()}, []);

  useEffect(() => {
    if (two) {
      two.appendTo(ref.current);
      two.play();
    }
  }, [two]);

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          if (ship) {
            ship.reset(100, 100);
          }
          if (stopped && two) {
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
          if (two) {
            if (stopped) {
              two.bind("update", (frameCount, deltaT) => {
                ship.applyPhysics(deltaT);
              });
              setStopped(false);
            } else {
              two.unbind("update");
              setStopped(true);
            }
          }
        }}
      >
        {stopped ? "Start" : "Stop"}
      </button>
      <p>Use ← and → to turn on the left and right engines. Aim for the X.</p>
      <br />
      <div ref={ref} style={{ border: "solid", display: "inline-block" }} />
    </>
  );
}
