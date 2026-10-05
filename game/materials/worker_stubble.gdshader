shader_type spatial;
render_mode unshaded, cull_disabled;
uniform sampler2D hair_texture: source_color,filter_linear_mipmap;
void fragment(){ALBEDO=vec3(.22,.16,.12);}
