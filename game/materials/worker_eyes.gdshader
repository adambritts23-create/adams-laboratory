shader_type spatial;
render_mode unshaded, cull_disabled;
uniform sampler2D eye_texture: source_color, filter_linear_mipmap;
uniform vec4 iris_color: source_color = vec4(.16,.19,.20,1);
void fragment(){ALBEDO=vec3(.65,.66,.58);}
