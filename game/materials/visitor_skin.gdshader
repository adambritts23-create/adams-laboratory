shader_type spatial;
render_mode unshaded, cull_disabled;
uniform sampler2D reference : source_color;
void fragment(){ALBEDO=vec3(.65,.47,.36);}
