shader_type spatial;
render_mode unshaded, cull_disabled;
uniform sampler2D timber_image : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
void fragment(){ALBEDO=vec3(.55,.52,.44);}
