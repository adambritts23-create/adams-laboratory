shader_type spatial;
render_mode cull_disabled;
void fragment(){
 float edge=pow(1.0-abs(dot(normalize(NORMAL),normalize(VIEW))),2.7);
 ALBEDO=vec3(.93,.96,.98); ALPHA=.025+.34*edge;
 ROUGHNESS=.055; METALLIC=.015; SPECULAR=.9;
 EMISSION=vec3(.10,.11,.12)*edge;
}
