shader_type spatial;
render_mode diffuse_burley;
uniform vec4 base_color : source_color = vec4(0.32,0.37,0.22,1.0);
float hash(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
float noise3(vec3 p){
 vec3 i=floor(p);vec3 f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
varying vec3 local_pos;
void vertex(){local_pos=VERTEX;}
void fragment(){
 float mottling=noise3(local_pos*19.0)*0.7+noise3(local_pos*43.0)*0.3;
 float grain=noise3(local_pos*180.0);
 ALBEDO=mix(base_color.rgb*0.38,base_color.rgb*1.18,smoothstep(0.24,0.74,mottling))*(0.88+grain*0.2);
 ROUGHNESS=0.98;
}
