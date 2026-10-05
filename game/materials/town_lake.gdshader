shader_type spatial;
render_mode unshaded, cull_disabled;
uniform sampler2D reflection_image : source_color, filter_linear;
uniform mat4 reflection_matrix;
uniform bool reflection_ready=false;
void fragment(){ALBEDO=vec3(.55,.52,.44);}
