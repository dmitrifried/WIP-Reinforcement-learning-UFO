from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import abc
import tensorflow as tf
import numpy as np

from tf_agents.environments import py_environment
from tf_agents.environments import tf_environment
from tf_agents.environments import tf_py_environment
from tf_agents.environments import utils
from tf_agents.specs import array_spec
from tf_agents.environments import wrappers
from tf_agents.environments import suite_gym
from tf_agents.trajectories import time_step as ts

from ship import Ship

tf.compat.v1.enable_v2_behavior()

class ShipEnv(py_environment.PyEnvironment):
  def __init__(self, x=100, y=100, goalX=200, goalY=200):
    self._baseX, self.baseY = x, y
    self._ship = Ship(x, y)

    self._action_spec = array_spec.BoundedArraySpec(shape = (2,), dtype=np.int32, minimum=0, maximum=1, name='action')
    self._observation_spec = array_spec.BoundedArraySpec(shape=(6,), dtype=np.float, name='observation')
    self._state = self._ship.state()
    self._episode_ended = False

    self._time_elapsed = 0
    self._time_cap = 30 # 30 seconds
    self._time_step = 1.0 / 60.0 # 60 fps

    self._reward = 0
    self._goalX = goalX
    self._goalY = goalY

  def action_spec(self):
    return self._action_spec

  def observation_spec(self):
    return self._observation_spec

  def _reset(self):
    self._ship = Ship(self.baseX, self.baseY)
    self._state = self._ship.state()
    self._episode_ended = False
    return ts.restart(np.array([self._state], dtype=np.int32))

  def _step(self, action):
    if self._episode_ended:
      # The last action ended the episode. Ignore the current action and start
      # a new episode.
      return self.reset()

    # Make sure episodes don't go on forever.
    if self._time_elapsed > self._time_cap:
      return ts.termination(np.array([self._state], dtype=np.float), self._reward)
    
    reward = - (self._goalX - self._ship.p.x)**2 - (self._goalY - self._ship.p.y)**2
    self._ship.le, self._ship.re = action
    self._ship.applyPhysics(self._time_step)

    return ts.transition(np.array([self._state], dtype=np.int32), reward=reward, discount=1.0)