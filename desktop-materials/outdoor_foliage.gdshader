shader_type spatial;
render_mode cull_disabled;
uniform bool grass=false;
varying float shade;
void vertex(){
 vec3 p=(MODEL_MATRIX*vec4(VERTEX,1)).xyz;
 float flexibility=grass?UV.y:clamp(VERTEX.y/7.0,0.0,1.0);
 VERTEX.x+=sin(TIME*1.45+p.x*.55+p.z*.43)*(.085*flexibility);
 VERTEX.z+=sin(TIME*1.08+p.z*.32)*(.04*flexibility);
 shade=grass?mix(.5,1.0,UV.y):mix(.68,1.0,clamp(VERTEX.y/7.0,0.0,1.0));
}
void fragment(){ALBEDO=COLOR.rgb*shade;ROUGHNESS=.92;SPECULAR=.13;}
