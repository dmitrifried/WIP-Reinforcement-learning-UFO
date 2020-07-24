// import * as tf from '@tensorflow/tfjs-node';

// console.log(`TensorFlow version ${tf.version}`);

/**
 * @see https://www.tensorflow.org/agents/tutorials/1_dqn_tutorial
 */
class Agent {
  constructor(ship) {
    this.ship = ship;

    this.numIterations = 20000;
    this.collectStepsPerIteration = 1;
    this.replayBufferMaxLength = 100000;

    this.batchSize = 64;
    this.learningRate = 1e-3;
    this.logInterval = 200;

    this.numEvalEpisodes = 10;
    this.evalInterval = 1000;
  }
}
