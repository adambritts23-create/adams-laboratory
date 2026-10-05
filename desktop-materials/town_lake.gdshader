shader_type spatial;
render_mode cull_disabled;
uniform sampler2D reflection_image : source_color, filter_linear;
uniform mat4 reflection_matrix;
uniform bool reflection_ready=false;
varying vec3 world;
varying float shore_depth;
void vertex(){
 world=(MODEL_MATRIX*vec4(VERTEX,1)).xyz;
 shore_depth=COLOR.r;
 float fade=smoothstep(0.0,.8,shore_depth);
 VERTEX.y+=fade*(sin(world.x*.48+world.z*.32+TIME*.72)*.023+sin(world.x*.91-world.z*.63+TIME*1.13)*.010);
 world=(MODEL_MATRIX*vec4(VERTEX,1)).xyz;
}
void fragment(){
 vec2 p=world.xz;
 float t=TIME;
 float distance_fade=1.0-smoothstep(25.0,150.0,length(VERTEX));
 float warp=sin(p.x*.13-p.y*.17)*.7;
 vec2 slope=vec2(0);
 slope+=vec2(.48,.32)*cos(p.x*.48+p.y*.32+t*.72+warp)*.012;
 slope+=vec2(.91,-.63)*cos(p.x*.91-p.y*.63+t*1.13-warp)*.006;
 slope+=vec2(5.8,3.2)*cos(p.x*5.8+p.y*3.2+t*1.7+warp)*.0015*distance_fade;
 slope+=vec2(-3.1,7.3)*cos(-p.x*3.1+p.y*7.3+t*2.1-warp)*.001*distance_fade;
 vec3 world_normal=normalize(vec3(-slope.x,1,-slope.y));
 NORMAL=normalize((VIEW_MATRIX*vec4(world_normal,0)).xyz);
 float facing=clamp(dot(NORMAL,VIEW),0.0,1.0);
 float fresnel=.035+.965*pow(1.0-facing,5.0);
 vec3 water=mix(vec3(.19,.235,.14),vec3(.019,.071,.069),1.0-exp(-shore_depth*.9));
 vec4 rp=reflection_matrix*vec4(world,1);
 vec2 uv=rp.xy/max(rp.w,.001)*.5+.5;uv.y=1.0-uv.y;
 uv+=slope*.075;
 float valid=smoothstep(.005,.035,uv.x)*smoothstep(.005,.035,1.0-uv.x)*smoothstep(.005,.035,uv.y)*smoothstep(.005,.035,1.0-uv.y)*step(.001,rp.w);
 vec3 reflected=texture(reflection_image,clamp(uv,vec2(.003),vec2(.997))).rgb;
 // The sky reflection remains available when the planar capture is out of view.
 ALBEDO=water;
 if(reflection_ready){
  float reflect_amount=(.12+.80*fresnel)*valid;
  ALBEDO=water*(1.0-reflect_amount);
  EMISSION=reflected*reflect_amount;
 }
 float wavelets=sin(p.x*5.1+p.y*2.3+t*1.2)*sin(p.y*3.8-p.x*1.9-t*.8);
 float lapping=(1.0-smoothstep(.02,.20,shore_depth))*smoothstep(.015,.04,shore_depth);
 ALBEDO=mix(ALBEDO,vec3(.28,.31,.26),lapping*.16*max(0.0,wavelets));
 METALLIC=.0;SPECULAR=.5;ROUGHNESS=.18;
}
