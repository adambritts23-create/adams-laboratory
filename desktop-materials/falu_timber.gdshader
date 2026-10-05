shader_type spatial;
uniform sampler2D wood_image : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
varying vec3 local;
void vertex(){local=VERTEX;}
void fragment(){
 vec3 wood=texture(wood_image,UV*vec2(2.0,1.0)).rgb;
 ALBEDO=vec3(.43,.041,.023)*(.78+wood.r*.8);
 ROUGHNESS=.94;SPECULAR=.12;
}
