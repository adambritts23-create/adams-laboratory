shader_type spatial;
render_mode unshaded, cull_disabled;
uniform sampler2D wood_image : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
void fragment(){ALBEDO=texture(wood_image,UV).rgb*vec3(.6,.22,.15);}
