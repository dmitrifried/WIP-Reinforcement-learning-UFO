/**
 * @see https://www.tensorflow.org/js/tutorials/conversion/import_saved_model
 */

import * as tf from "@tensorflow/tfjs";

export default async function getModel() {
  const MODEL_URL = "/agent/model.json";

  const model = await tf.loadGraphModel(MODEL_URL);

  return model;
}
