shader_type spatial;
render_mode unshaded, cull_disabled;
uniform sampler2D flag_image:source_color;
uniform bool crowns=false;
void fragment(){ALBEDO=vec3(.55,.52,.44);}
