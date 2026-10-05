shader_type spatial;
render_mode unshaded, cull_disabled;
uniform vec4 paint : source_color=vec4(.6,.2,.12,1);
uniform int kind=0;
void fragment(){ALBEDO=vec3(.5,.45,.35);}
