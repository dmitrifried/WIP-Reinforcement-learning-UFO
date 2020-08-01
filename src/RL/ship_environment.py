from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import numpy as np
import math
import random

from tf_agents.environments import py_environment
from tf_agents.specs import array_spec
from tf_agents.trajectories import time_step as ts

from ship import Ship

class ShipEnv(py_environment.PyEnvironment):
  def __init__(self, goalX=500.0, goalY=400.0):
    x, y = goalX + random.randint(-100, 100), goalY + random.randint(-100, 100)
    self._ship = Ship(x, y)
    print(f"Ship initialized: {x:03}, {y:03}")

    self._action_spec = array_spec.BoundedArraySpec(shape = (), dtype=np.int32, minimum=0, maximum=3, name='action')
    self._observation_spec = array_spec.ArraySpec(shape=(6,), dtype=np.float32, name='observation')
    self._state = self._ship.state()
    self._episode_ended = False

    self._time_elapsed = 0
    self._time_cap = 300 # seconds
    self._time_interval = 1.0 / 5.0 # fps

    self.reward = 0
    self._goalX = goalX
    self._goalY = goalY
    self._terminal_distance = 500

  def action_spec(self):
    return self._action_spec

  def observation_spec(self):
    return self._observation_spec

  def _reset(self):
    x, y = self._goalX + random.randint(-100, 100), self._goalY + random.randint(-100, 100)
    self._ship = Ship(x, y)
    self._state = self._ship.state()
    self._episode_ended = False
    self._time_elapsed = 0
    self.reward = 0
    return ts.restart(np.array(self._state, dtype=np.float32))

  def _step(self, action):
    if self._episode_ended:
      # The last action ended the episode. Ignore the current action and start
      # a new episode.
      return self.reset()

    # Make sure episodes don't go on forever.
    if self._time_elapsed > self._time_cap:
      self._episode_ended = True
      return ts.termination(np.array(self._state, dtype=np.float32), self.reward)
    
    self._time_elapsed += self._time_interval

    # velocity, magnitude of velocity
    v = [self._state[3], self._state[4]]
    mv = math.sqrt(v[0]**2 + v[1]**2)

    # reset if we've gone far
    if mv > self._terminal_distance:
      self._episode_ended = True
      return ts.termination(np.array(self._state, dtype=np.float32), self.reward)

    # delta to goal, magnitude of delta
    dp = [self._goalX - self._state[0], self._goalY - self._state[1]]
    mdp = math.sqrt(dp[0]**2 + dp[1]**2)

    # unitary dot product to measure alignment of v to dp
    dot = (v[0]*dp[0] + v[1]*dp[1])
    dot = dot and dot / (mv * mdp)

    # with perfect alignment, award 1 point per second
    reward = dot * self._time_interval
    self.reward += reward
    self._ship.le, self._ship.re = action // 2, action % 2 # 0, 1, 2, 3 -> 00, 01, 10, 11
    self._ship.applyPhysics(self._time_interval)
    self._state = self._ship.state()

    return ts.transition(observation=self._state, reward=reward)