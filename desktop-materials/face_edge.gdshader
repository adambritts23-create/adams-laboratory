shader_type spatial;
uniform sampler2D face_image: source_color, filter_linear_mipmap;
void fragment(){
 vec3 portrait=texture(face_image,UV).rgb;
 float edge=smoothstep(.31,.49,abs(UV.x-.5));
 vec3 skin=vec3(.46,.295,.20);
 float hairline=1.0-smoothstep(.17,.26,UV.y);
 float beard=smoothstep(.66,.82,UV.y);
 vec3 blend=mix(skin,vec3(.09,.065,.042),max(hairline,beard)*.8);
 ALBEDO=mix(portrait,blend,edge*.93);
 ROUGHNESS=.94; SPECULAR=.22;
}
