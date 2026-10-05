shader_type spatial;
uniform sampler2D reference : source_color;
void fragment(){
 vec3 photo=texture(reference,UV2).rgb;
 ALBEDO=mix(vec3(.62,.40,.29),photo,COLOR.r*.88);
 ROUGHNESS=.88;SPECULAR=.16;
}
