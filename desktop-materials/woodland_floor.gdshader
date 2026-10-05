shader_type spatial;
uniform sampler2D litter : source_color, filter_linear_mipmap, repeat_enable;
uniform sampler2D normal_tex : hint_normal, filter_linear_mipmap, repeat_enable;
uniform bool trail=false;
varying vec3 world_pos;
void vertex(){world_pos=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;}
void fragment(){
 vec2 uv=world_pos.xz*.32;
 float patches=.5+.5*sin(world_pos.x*.65+sin(world_pos.z*.8))*sin(world_pos.z*.43);
 vec3 base=texture(litter,uv).rgb;
 float detail=dot(base,vec3(.333));
 ALBEDO=mix(vec3(.055,.16,.018),vec3(.29,.39,.065),patches)*(.6+detail);
 if(trail){ALBEDO=base*vec3(.70,.59,.40);}
 NORMAL_MAP=texture(normal_tex,uv).rgb;NORMAL_MAP_DEPTH=.5;ROUGHNESS=.97;
}
