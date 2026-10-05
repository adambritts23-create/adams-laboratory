shader_type spatial;
render_mode unshaded, cull_disabled;
uniform sampler2D portrait : source_color, filter_linear_mipmap;
uniform sampler2D neutral_portrait : source_color, filter_linear_mipmap;
uniform bool adam = true;
uniform bool diagnostic = false;
uniform vec4 skin_color : source_color = vec4(.59,.40,.30,1.0);
void fragment(){ALBEDO=vec3(.65,.47,.36);}
