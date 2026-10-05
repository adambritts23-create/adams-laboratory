shader_type spatial;
render_mode diffuse_burley;
uniform sampler2D portrait : source_color, filter_linear_mipmap;
uniform sampler2D neutral_portrait : source_color, filter_linear_mipmap;
uniform bool adam = true;
uniform bool diagnostic = false;
uniform vec4 skin_color : source_color = vec4(.59,.40,.30,1.0);
void fragment(){
 vec2 p=vec2(UV2.x,1.0-UV2.y);
 vec2 registered=p;
 if(adam){
  registered.y=p.y*.951;
  if(p.y>.494){registered.y=mix(.470,.760,(p.y-.494)/(.815-.494));}
  if(p.y>.815){registered.y=mix(.760,.985,(p.y-.815)/(.950-.815));}
 }
 vec2 photo_uv=adam?mix(vec2(.359,.076),vec2(.601,.288),registered):p;
 vec3 face=texture(portrait,photo_uv).rgb;
 vec3 base=skin_color.rgb;
 base=mix(base,vec3(.11,.080,.060),COLOR.g*.80);
 base=mix(base,vec3(.095,.074,.056),COLOR.b*.72);
 if(adam){
  vec2 mouth_uv=vec2(.554-abs(p.x-.5)*.19,.223+(p.y-.815)*.23);
  vec3 neutral=texture(neutral_portrait,mouth_uv).rgb;
  // The neutral photographic mouth replaces the smiling mouth only, with a broad blend.
  float mouth=smoothstep(.72,.77,p.y)*(1.0-smoothstep(.86,.92,p.y));
  mouth*=1.0-smoothstep(.12,.26,abs(p.x-.5));
  face=mix(face,neutral,mouth);
 }
 float visible=smoothstep(0.0,.08,p.y)*(1.0-smoothstep(.93,1.02,p.y));
 ALBEDO=mix(base,face,COLOR.r*visible*(adam?.88:.70));
 if(adam){
  float x=(p.x-.5)*.18;
  float depth=(UV.x-.495-x*.80*1.52)/(.60*1.52);
  vec2 cheek_uv=vec2(clamp(.495+(-abs(x)*.80+depth*.60)*1.52,.462,.550),UV.y);
  vec3 cheek=texture(neutral_portrait,cheek_uv).rgb;
  float side=smoothstep(.036,.074,abs(x))*smoothstep(.006,.035,depth);
  side*=smoothstep(.47,.60,p.y)*(1.0-smoothstep(.91,.99,p.y));
  ALBEDO=mix(ALBEDO,cheek,side*.65);
  float side_boundary=.84-.22*smoothstep(.06,.34,abs(p.x-.5));
  float beard=smoothstep(side_boundary,side_boundary+.07,p.y)*(1.0-smoothstep(.96,1.04,p.y));
  float lip_clear=1.0-(1.0-smoothstep(.09,.16,abs(p.x-.5)))*(1.0-smoothstep(.014,.045,abs(p.y-.815)));
  ALBEDO*=1.0-.43*beard*lip_clear;
 }
 if(diagnostic){ALBEDO=vec3(.55,.40,.30);}
 ROUGHNESS=.85;SPECULAR=.18;
}
