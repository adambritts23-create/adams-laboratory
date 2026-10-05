shader_type spatial;
render_mode cull_back;
varying vec3 world;
varying vec3 world_normal;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void vertex(){world=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;world_normal=normalize((MODEL_NORMAL_MATRIX*NORMAL));}
void fragment(){
 vec3 n=abs(world_normal);
 vec2 uv=n.y>.65?world.xz/vec2(.43,.31):(n.x>n.z?world.zy:world.xy)/vec2(.55,.25);
 uv.x+=mod(floor(uv.y),2.0)*.5;
 vec2 cell=floor(uv);vec2 f=fract(uv);
 float edge=min(min(f.x,1.0-f.x),min(f.y,1.0-f.y));
 float stone=smoothstep(.025,.065,edge);
 float variation=hash(cell);
 vec3 color=mix(vec3(.26,.28,.27),vec3(.43,.42,.38),variation);
 ALBEDO=mix(vec3(.17,.19,.17),color,stone);
 ROUGHNESS=.96;
}
