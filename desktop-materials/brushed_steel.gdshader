shader_type spatial;
varying vec3 world_point;
void vertex(){world_point=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;}
void fragment(){
 float phase=world_point.x*450.0+sin(world_point.z*3.0);
 float brushing=sin(phase)*.5*(1.0-smoothstep(.2,2.0,fwidth(phase)))+.5;
 ALBEDO=vec3(.32,.35,.34)*( .995+.005*brushing);
 METALLIC=.48;ROUGHNESS=.56+brushing*.012;SPECULAR=.35;
}
