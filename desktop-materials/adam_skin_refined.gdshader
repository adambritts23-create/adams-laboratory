shader_type spatial;
render_mode diffuse_burley;
uniform sampler2D portrait : source_color, filter_linear_mipmap;
uniform sampler2D neutral_portrait : source_color, filter_linear_mipmap;
uniform bool adam = true;
uniform bool diagnostic = false;
uniform vec4 skin_color : source_color = vec4(.72,.53,.42,1.0);
void fragment(){
 vec2 p=vec2(UV2.x,1.0-UV2.y);
 float x=(p.x-.5)*.18;
 float depth=(UV.x-.495-x*.80*1.52)/(.60*1.52);
 vec2 registered=p;
 registered.y=p.y*.951;
 if(p.y>.494){registered.y=mix(.470,.760,(p.y-.494)/(.815-.494));}
 if(p.y>.815){registered.y=mix(.760,.985,(p.y-.815)/(.950-.815));}
 vec3 face=texture(portrait,mix(vec2(.359,.076),vec2(.601,.288),registered)).rgb;
 // Register the neutral lower face from the near half of the three-quarter photo.
 float mouth_x=.564-abs(p.x-.5)*.255;
 vec2 neutral_uv=vec2(mouth_x,.224+(p.y-.815)*.32+abs(p.x-.5)*.035);
 vec3 neutral=texture(neutral_portrait,neutral_uv).rgb;
 float lower=smoothstep(.74,.79,p.y)*(1.0-smoothstep(.88,.94,p.y));
 lower*=1.0-smoothstep(.18,.34,abs(p.x-.5));
 face=mix(face,neutral,lower);
 vec3 base=skin_color.rgb;
 // Restrict beard pigment to jaw, never paint it down the neck.
 float beard=COLOR.g*(1.0-smoothstep(.94,1.04,p.y));
 base=mix(base,vec3(.22,.17,.135),beard*.65);
 // Close-cropped side hair fades above the ear, underneath the authored swept top.
 float fade=(1.0-smoothstep(.30,.48,p.y))*(1.0-smoothstep(.01,.065,depth));
 base=mix(base,vec3(.22,.18,.15),fade*.65);
 float valid=smoothstep(.04,.13,p.y)*(1.0-smoothstep(.95,1.03,p.y));
 ALBEDO=mix(base,face,COLOR.r*valid*.97);
 vec2 cheek_uv=vec2(clamp(.495+(-abs(x)*.80+depth*.60)*1.52,.365,.550),UV.y);
 vec3 cheek=texture(neutral_portrait,cheek_uv).rgb;
 float side=smoothstep(.030,.065,abs(x))*smoothstep(-.008,.025,depth);
 side*=smoothstep(.34,.46,p.y)*(1.0-smoothstep(.96,1.04,p.y));
 ALBEDO=mix(ALBEDO,cheek,side*.90);
 // Cover the scalp beneath parted hair so no skin-colored strip reads as baldness.
 float scalp=1.0-smoothstep(.12,.19,p.y);
 ALBEDO=mix(ALBEDO,vec3(.16,.115,.08),scalp);
 if(diagnostic){ALBEDO=vec3(.55,.40,.30);}
 ROUGHNESS=.87;SPECULAR=.16;
}


