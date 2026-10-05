shader_type spatial;
uniform int species=0;
varying vec3 p;
void vertex(){p=VERTEX;}
float hash(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 q){vec2 i=floor(q);vec2 f=fract(q);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void fragment(){
 float grain=noise(vec2(atan(p.z,p.x)*14.,p.y*9.));
 if(species==0){
  float angle=atan(p.z,p.x);
  float scar=noise(vec2(angle*3.,p.y*15.+noise(vec2(angle*2.,p.y))*2.));
  float mark=smoothstep(.64,.84,scar)*.72;
  float weather=.5+.5*sin(p.y*1.7+sin(p.x*12.)+p.z*9.);
  vec3 silver=mix(vec3(.43,.45,.41),vec3(.61,.60,.53),weather);
  float root=(1.-smoothstep(.15,2.1,p.y))*(.4+.25*grain);
  silver=mix(silver,vec3(.22,.25,.19),root);
  ALBEDO=mix(silver,vec3(.10,.12,.11),mark);
  ALBEDO*=.88+.12*grain;
 }else if(species==2){ALBEDO=mix(vec3(.24,.16,.10),vec3(.59,.29,.12),smoothstep(3.,7.,p.y))*(.65+.35*grain);}
 else{ALBEDO=vec3(.25,.20,.15)*(.68+.32*grain);}
 ROUGHNESS=.96;
}
