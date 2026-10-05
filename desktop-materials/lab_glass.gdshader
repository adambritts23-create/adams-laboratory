shader_type spatial;
render_mode cull_disabled;
void fragment(){
 float edge=pow(1.0-abs(dot(normalize(NORMAL),normalize(VIEW))),3.0);
 ALBEDO=vec3(.72,.81,.83);
 ALPHA=.035+.25*edge;
 ROUGHNESS=.085; METALLIC=.025; SPECULAR=.8;
}
