shader_type spatial;
render_mode cull_disabled;
uniform sampler2D ground_albedo : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D ground_normal : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
varying vec3 world;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}
void vertex(){world=(MODEL_MATRIX*vec4(VERTEX,1)).xyz;}
void fragment(){
 if(CAMERA_POSITION_WORLD.y < -49.05 && world.y < -49.02){discard;}
 float macro=noise(world.xz*.045)*.6+noise(world.xz*.13)*.4;
 vec3 texture_color=texture(ground_albedo,world.xz*.28).rgb;
 vec3 meadow=mix(vec3(.075,.105,.035),vec3(.22,.255,.10),macro);
 // Ground near the water receives mineral and wet soil colours.
 vec2 q=(world.xz-vec2(133,-810))/vec2(59,125);
 float a=atan(q.y,q.x);float r=length(q)/(1.0+.06*sin(3.0*a)+.025*cos(5.0*a));
 float shore=(1.0-smoothstep(1.02,1.16,r))*smoothstep(.72,.94,r);
 vec3 earth=mix(vec3(.14,.13,.095),vec3(.32,.29,.205),macro);
 ALBEDO=mix(texture_color*mix(vec3(.42,.69,.32),vec3(.64,.92,.46),macro),earth*(.6+texture_color),shore);
 vec2 bump=(texture(ground_normal,world.xz*.28).rg*2.0-1.0)*.3;NORMAL=normalize(NORMAL+(VIEW_MATRIX*vec4(bump.x,0.0,bump.y,0.0)).xyz);
 ROUGHNESS=mix(.94,.64,shore);SPECULAR=.24;
}
