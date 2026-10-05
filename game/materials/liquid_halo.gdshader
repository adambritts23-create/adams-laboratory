shader_type spatial;
render_mode unshaded, cull_disabled;
uniform float strength=.03;
void fragment(){ALBEDO=vec3(.5,.7,.2); ALPHA=strength;}
