shader_type spatial;
render_mode unshaded, cull_disabled;
uniform sampler2D litter : source_color, filter_linear_mipmap, repeat_enable;
uniform sampler2D normal_tex : hint_normal, filter_linear_mipmap, repeat_enable;
uniform bool trail=false;
void fragment(){ALBEDO=vec3(.55,.52,.44);}
