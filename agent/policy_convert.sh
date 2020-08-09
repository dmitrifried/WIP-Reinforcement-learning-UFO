BASEDIR=$(dirname "$0")

if tensorflowjs_converter.exe \
  --input_format=tf_saved_model \
  --saved_model_tags=serve \
  --signature_name=action \
  --output_node_names='UFO/Action' \
  --skip_op_check \
  ${BASEDIR}/policy.tf ${BASEDIR}/policy.output ; \
then cp ${BASEDIR}/policy.output/* ${BASEDIR}/../public/agent/
fi