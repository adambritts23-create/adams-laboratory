shader_type spatial;
uniform sampler2D albedo_map : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D normal_map : hint_normal, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D roughness_map : filter_linear_mipmap_anisotropic, repeat_enable;
varying vec3 world_point;
void vertex(){world_point=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;}
void fragment(){
 vec2 uv=world_point.xz*.5;
 vec3 stone=texture(albedo_map,uv).rgb;
 ALBEDO=mix(vec3(.16,.165,.155),stone*.48,.50);
 NORMAL_MAP=texture(normal_map,uv).rgb;
 NORMAL_MAP_DEPTH=.16;
 ROUGHNESS=.68+texture(roughness_map,uv).r*.22;
 SPECULAR=.30;
}
