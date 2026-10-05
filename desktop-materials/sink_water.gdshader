shader_type spatial;
render_mode cull_disabled;
void fragment(){
 float d=length(UV-vec2(.5));
 float t=mod(TIME,3.2);
 float wave=sin(d*130.0-t*14.0)*exp(-d*8.0)*exp(-t*1.2);
 ALBEDO=vec3(.08,.12,.115);ALPHA=.55;ROUGHNESS=.09;SPECULAR=.85;
 NORMAL=normalize(NORMAL+vec3(wave*.12,0.0,wave*.08));
}
