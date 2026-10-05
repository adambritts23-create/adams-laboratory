shader_type spatial;
render_mode unshaded,cull_disabled;
varying vec3 world_point;
void vertex(){world_point=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void fragment(){
 vec2 p=vec2(world_point.x+world_point.z,world_point.y)*.65+vec2(TIME*.035,-TIME*.045);
 float clouds=noise(p)*.6+noise(p*2.1+5.0)*.28+noise(p*4.3)*.12;
 ALBEDO=mix(vec3(.24,.14,.065),vec3(.65,.58,.43),smoothstep(.15,.85,clouds));
}
