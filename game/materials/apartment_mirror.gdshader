shader_type spatial;
render_mode unshaded, cull_disabled;
uniform sampler2D reflection_view : source_color;
void fragment(){ALBEDO=texture(reflection_view,UV).rgb;}
