shader_type spatial;
render_mode unshaded, cull_disabled;
uniform vec4 base_color : source_color = vec4(0.32,0.37,0.22,1.0);
void fragment(){ALBEDO=vec3(.32,.37,.22);}
