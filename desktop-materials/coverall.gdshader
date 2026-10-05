shader_type spatial;
render_mode diffuse_burley;
varying vec3 cloth_position;
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise3(vec3 p){vec3 i=floor(p);vec3 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
void vertex(){cloth_position=VERTEX;}
void fragment(){
 float grime=noise3(cloth_position*25.0)*.6+noise3(cloth_position*73.0)*.4;
 float weave=sin(cloth_position.y*2200.0)*sin((cloth_position.x+cloth_position.z)*1800.0);
 float antialias=1.0-clamp(length(fwidth(cloth_position))*170.0,0.0,1.0);
 ALBEDO=vec3(.69,.675,.60)*(0.82+grime*.20+weave*.018*antialias);
 ROUGHNESS=.94;
 SPECULAR=.22;
}
