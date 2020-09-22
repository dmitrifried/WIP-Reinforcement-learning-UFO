This project was bootstrapped with **[Create React App](https://github.com/facebook/create-react-app)**, and uses **Tensorflow** and **TF-Agents** for reinforcement learning.

View the demo at https://dmitrifried.github.io/WIP-Reinforcement-learning-UFO/ .

## IMPORTANT NOTE:

The build currently fails due to a bug in babel described [here](https://github.com/tensorflow/tfjs/issues/3384#issuecomment-676511180). Until that issue is resolved, the build will fail without temporary workarounds.
___

## Training

The agent was taught by reinforcement learning, where it was 'dropped' somewhere near the goal. It went through various attempts at rewards, but the rewards used last were:

- 1 point per second for not crashing
- 1 point per second if it is near the goal
- -1 point per second if it is spinning very fast

___

## Progress

#### Bad rewards

![Bad UFO](https://github.com/dmitrifried/WIP-Reinforcement-learning-UFO/blob/master/UFO_Bad.gif)
