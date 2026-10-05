shader_type spatial;
render_mode unshaded, cull_disabled;
uniform sampler2D outside_view : filter_linear;
void fragment(){ALBEDO=texture(outside_view,UV).rgb;}
