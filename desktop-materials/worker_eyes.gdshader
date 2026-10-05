shader_type spatial;
uniform sampler2D eye_texture: source_color, filter_linear_mipmap;
uniform vec4 iris_color: source_color = vec4(.16,.19,.20,1);
void fragment(){
 vec3 tex=texture(eye_texture,UV).rgb;
 float r=length(UV-vec2(.5));
 float iris=1.0-smoothstep(.092,.106,r);
 float pupil=1.0-smoothstep(.035,.043,r);
 vec3 sclera=mix(vec3(.54,.49,.45),vec3(.66,.64,.59),smoothstep(.17,.65,dot(tex,vec3(.333))));
 vec3 eye=mix(sclera,iris_color.rgb*(.75+dot(tex,vec3(.333))),iris);
 ALBEDO=mix(eye,vec3(.007,.008,.009),pupil);
 ROUGHNESS=.48;SPECULAR=.22;
}
