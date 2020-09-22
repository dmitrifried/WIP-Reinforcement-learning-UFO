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
  """
  Description:
    A ship starts upright at an arbitrary point in the x-y plane. The ship is powered by
    two engines on the left and right, which provide force and torque to the ship. The goal
    is to keep the ship hovering as close to a goal point in the plane as possible by turning
    the engines on and off.

  Observation:
    Num   Observation             Min           Max
    0     x displacement to goal  -1200         1200
    1     y displacement to goal  -1200         1200
    2     rotation of ship        0             2pi
    3     sin of rotation         -1            1
    4     x velocity              -Inf          Inf
    5     y velocity              -Inf          Inf
    6     rotational velocity     -Inf          Inf
    
  Actions:
    Num   Action
    0     Both engines off
    1     Right engine on
    2     Left engine on
    3     Both engines on
  """
  def __init__(self, goalX=0.0, goalY=0.0):
    x, y = goalX + random.randint(-100, 100), goalY + random.randint(-100, 100)
    self._ship = Ship(x, y)

    self._action_spec = array_spec.BoundedArraySpec(shape = (), dtype=np.int32, minimum=0, maximum=3, name='action')
    self._observation_spec = array_spec.ArraySpec(shape=(7,), dtype=np.float32, name='observation')
    self._state = self._ship.state()
    self._episode_ended = False

    self._time_elapsed = 0
    self._time_cap = 15 # seconds
    self._time_interval = 1.0 / 5.0 # fps
    self._physics_interval = 1.0 / 60.0

    self._goalX = goalX
    self._goalY = goalY
    self._terminal_distance = 1200

    self._random_range = 400

  def action_spec(self):
    return self._action_spec

  def observation_spec(self):
    return self._observation_spec

  def _reset(self):
    x, y = self._goalX + random.randint(-self._random_range, self._random_range), self._goalY + random.randint(-self._random_range, self._random_range / 2.0)
    vx, vy = random.randint(-5, 5), self._goalY + random.randint(-5, 20)
    aV = (random.random() - 0.5) * 0.05
    self._ship = Ship(x, y, vx, vy, aV)
    self._ship.theta = (-math.pi / 2.0) + 0.15 * random.random()
    self._state = self._ship.state()
    self._state = np.insert(self._state, 3, math.cos(self._state[2]))
    # self._state[2] = math.sin(self._state[2])
    self._state[0] = self._goalX - self._state[0]
    self._state[1] = self._goalY - self._state[1]
    self._episode_ended = False
    self._time_elapsed = 0
    
    return ts.restart(self._state)

  def _step(self, action):
    if self._episode_ended:
      # The last action ended the episode. Ignore the current action and start
      # a new episode.
      return self.reset()

    # the agent survived the full episode
    if self._time_elapsed > self._time_cap:
      self._episode_ended = True
      return ts.termination(np.array(self._state, dtype=np.float32), 500)
    
    self._time_elapsed += self._time_interval
    self._ship.le, self._ship.re = action // 2, action % 2 # 0, 1, 2, 3 -> 00, 01, 10, 11
    self._ship.applyPhysicsContinuous(self._time_interval, self._physics_interval)
    
    ### STATE ###
    '''
    State looks like:
    0: xToGoal
    1: yToGoal
    2: theta
    3: sin(theta)
    4: vX
    5: vY
    6: vTheta
    '''
    ship_state = self._ship.state()
    ship_state = np.insert(ship_state, 3, math.sin(ship_state[2]))
    # ship_state[2] = math.sin(ship_state[2])

    # set state x,y to 'distance from goal'
    ship_state[0] = self._goalX - ship_state[0]
    ship_state[1] = self._goalY - ship_state[1]
    self._state = ship_state

    # velocity, magnitude of velocity
    v = [self._state[4], self._state[5]]
    mv = math.sqrt(v[0]**2 + v[1]**2)

    # delta to goal, magnitude of delta
    dp = [self._state[0], self._state[1]]
    mdp = math.sqrt(dp[0]**2 + dp[1]**2)
    
    # reset if we've gone far, and punish the agent
    if mdp > self._terminal_distance:
      self._episode_ended = True
      return ts.termination(np.array(self._state, dtype=np.float32), -5)

    # unitary dot product to measure alignment of v to dp
    dot = (v[0]*dp[0] + v[1]*dp[1])
    dot = mv and mdp and dot / (mv * mdp)

    ### REWARDS ###
    reward = 0

    # points per step for being within range of goal
    if mdp < 150:
      reward += 5
    elif mdp < 300:
      reward += 2
    elif mdp > 600:
      reward += 0.5

    # points per step for moving towards goal
    reward += max(0, 2 + 2 * dot)

    reward *= self._time_elapsed

    # dock points per step for spinning fast
    if math.fabs(self._state[6]) < math.pi/2:
      reward += 1
    
    reward *= self._time_interval
    return ts.transition(observation=self._state, reward=reward)