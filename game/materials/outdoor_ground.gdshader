shader_type spatial;
render_mode unshaded, cull_disabled;
uniform sampler2D ground_albedo : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D ground_normal : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
void fragment(){ALBEDO=texture(ground_albedo,UV).rgb*.7;}
