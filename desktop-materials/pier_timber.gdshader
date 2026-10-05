shader_type spatial;
uniform sampler2D timber_image : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
varying vec3 world;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void vertex(){world=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;}
void fragment(){
 float board=floor((world.x-68.5)*4.0);
 float warp=sin(world.z*2.1+board)*.35+sin(world.z*8.0+board*3.0)*.09;
 float grain=sin(world.x*720.0+warp*8.0)+.4*sin(world.x*1370.0+warp*11.0);
 float aa=1.0-smoothstep(.7,2.0,fwidth(world.x*720.0));
 vec3 wood=mix(vec3(.23,.18,.125),vec3(.40,.335,.24),hash(vec2(board,4.0)));
 vec2 uv=vec2((world.x-68.5)*.8,world.z*.65);
 ALBEDO=texture(timber_image,uv).rgb*vec3(.82,.72,.59)*(1.0+.08*grain*aa);
 ROUGHNESS=.82;SPECULAR=.2;
 // Fine grain is analytic and remains sharp without magnifying a low-resolution bitmap.
 NORMAL=normalize(NORMAL+vec3(grain*.045*aa,0.0,0.0));
}
