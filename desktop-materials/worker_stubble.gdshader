shader_type spatial;
render_mode blend_mix,depth_prepass_alpha;
uniform sampler2D hair_texture: source_color,filter_linear_mipmap;
void fragment(){
 float grain=dot(texture(hair_texture,UV).rgb,vec3(.333));
 ALBEDO=vec3(.13,.105,.081)*(.80+grain*.30);
 ALPHA=COLOR.a*.80;
 ROUGHNESS=.93;SPECULAR=.15;
}
