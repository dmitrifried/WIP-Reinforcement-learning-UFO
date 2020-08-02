import tensorflow as tf
import os

policy_dir = os.getenv("POLICY_DIR") or os.path.join(os.path.dirname(os.path.realpath(__file__)), "policy.tf")
if not os.path.isdir(policy_dir):
  raise Exception("Could not find directory for loading policy.")
policy = tf.compat.v2.saved_model.load()