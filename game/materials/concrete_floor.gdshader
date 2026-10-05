shader_type spatial;
render_mode unshaded, cull_disabled;
uniform sampler2D albedo_map : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D normal_map : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D roughness_map : filter_linear_mipmap_anisotropic, repeat_enable;
void fragment(){ALBEDO=texture(albedo_map,UV).rgb*.55;}
