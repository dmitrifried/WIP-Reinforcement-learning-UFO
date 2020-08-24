from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import numpy as np
import math
import os
import matplotlib.pyplot as plt
from timeit import default_timer as timer

import tensorflow as tf
tf.compat.v1.enable_v2_behavior()
tf.keras.backend.set_floatx('float32')

from tf_agents.agents.dqn import dqn_agent
from tf_agents.networks import q_network
from tf_agents.environments import utils
from tf_agents.utils import common
from tf_agents.policies import random_tf_policy, tf_policy, policy_saver
from tf_agents.eval import metric_utils
from tf_agents.replay_buffers import tf_uniform_replay_buffer
from tf_agents.trajectories import trajectory
from tf_agents.environments import tf_py_environment

from ship_environment import ShipEnv
import ship_environment

policy_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), "..", "..", "agent", "policy.tf")
if not os.path.isdir(policy_dir):
  raise Exception("Could not find directory for saving policy.")

### Hyperparameters ###
num_iterations = 200000 # @param {type:"integer"}

initial_collect_steps = 30000  # @param {type:"integer"} 
collect_steps_per_iteration = 32  # @param {type:"integer"}
replay_buffer_max_length = 500000  # @param {type:"integer"}

batch_size = 64  # @param {type:"integer"}
learning_rate = 1e-4 # @param {type:"number"}
log_interval = 200  # @param {type:"integer"}

num_eval_episodes = 20  # @param {type:"integer"}
eval_interval = 2000  # @param {type:"integer"}

fc_layer_params = (64,8)

### Environment ###

train_env = tf_py_environment.TFPyEnvironment(ShipEnv())
eval_env = tf_py_environment.TFPyEnvironment(ShipEnv())

q_net = q_network.QNetwork(
  train_env.observation_spec(),
  train_env.action_spec(),
  fc_layer_params=fc_layer_params,
)

optimizer = tf.compat.v1.train.AdamOptimizer(learning_rate=learning_rate)
train_step_counter = tf.Variable(0)

### Agent ###

agent = dqn_agent.DqnAgent(
  train_env.time_step_spec(),
  train_env.action_spec(),
  q_network=q_net,
  optimizer=optimizer,
  td_errors_loss_fn=common.element_wise_squared_loss,
  train_step_counter=train_step_counter
)

agent.initialize()

eval_policy = agent.policy
collect_policy = agent.collect_policy
random_policy = random_tf_policy.RandomTFPolicy(train_env.time_step_spec(), train_env.action_spec())

### Metrics ###

def compute_avg_return(env: tf_py_environment.TFPyEnvironment, policy, num_episodes):
  total_return = 0.0
  for _ in range(num_episodes):
    time_step = env.reset()
    episode_return = 0.0 
    while not time_step.is_last():
      action_step = policy.action(time_step)
      time_step = env.step(action_step.action)
      episode_return += time_step.reward
    total_return += episode_return
  
  avg_return = total_return / num_episodes
  return avg_return.numpy()[0]

### Data Collection ###

replay_buffer = tf_uniform_replay_buffer.TFUniformReplayBuffer(
  data_spec=agent.collect_data_spec,
  batch_size=train_env.batch_size,
  max_length=replay_buffer_max_length
)

def collect_step(env: tf_py_environment.TFPyEnvironment, policy, buffer):
  time_step = env.current_time_step()
  action_step = policy.action(time_step)
  next_time_step = env.step(action_step.action)
  traj = trajectory.from_transition(time_step, action_step, next_time_step)

  # Add trajectory to the replay buffer
  buffer.add_batch(traj)

def collect_data(env, policy, buffer, steps):
  for _ in range(steps):
    collect_step(env, policy, buffer)

print(f"[+] Collecting {initial_collect_steps} initial steps of data")
collect_data(train_env, random_policy, replay_buffer, steps=initial_collect_steps)

dataset = replay_buffer.as_dataset(
  num_parallel_calls=3,
  sample_batch_size=batch_size,
  num_steps=2).prefetch(3)

iterator = iter(dataset)

### Training ###

# (Optional) Optimize by wrapping some of the code in a graph using TF function.
agent.train = common.function(agent.train)

# Reset the train step
agent.train_step_counter.assign(0)

# Evaluate the agent's policy once before training.
avg_return = compute_avg_return(eval_env, agent.policy, num_eval_episodes)
returns = [avg_return]

print("[+] Starting simulation.")
start = timer()
for _ in range(num_iterations):

  # Collect a few steps using collect_policy and save to the replay buffer.
  for _ in range(collect_steps_per_iteration):
    collect_step(train_env, agent.collect_policy, replay_buffer)

  # Sample a batch of data from the buffer and update the agent's network.
  experience, unused_info = next(iterator)
  train_loss = agent.train(experience).loss

  step = agent.train_step_counter.numpy()

  if step % log_interval == 0:
    print('step = {0}: loss = {1}'.format(step, train_loss))

  if step % eval_interval == 1:
    avg_return = compute_avg_return(eval_env, agent.policy, num_eval_episodes)
    print('step = {0}: Average Return = {1}'.format(step, avg_return))
    returns.append(avg_return)

end = timer()
d, m = divmod(end - start, 60)

print(f"[+] Total processing time: {d} minutes and {m} seconds")

### Saving policy ###

saver = policy_saver.PolicySaver(
  agent.policy, batch_size=1
)

saver.save(policy_dir)

print(f"[+] Model saved to {policy_dir}.")

### Visualization ###

plt.ioff()
iterations = range(0, num_iterations + 1, eval_interval)
plt.plot(iterations, returns)
plt.ylabel('Average Return')
plt.xlabel(f'Iterations (Total time: {d} minutes and {m} seconds)')
plt.show()