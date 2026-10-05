shader_type spatial;
render_mode cull_back;
void fragment(){
 vec2 p=UV*5.0;float row=floor(p.y);p.x+=mod(row,2.0)*.5;
 vec2 cell=floor(p);vec2 f=fract(p);float edge=min(min(f.x,1.-f.x),min(f.y,1.-f.y));
 float variation=fract(sin(dot(cell,vec2(12.9898,78.233)))*43758.5453);
 ALBEDO=mix(vec3(.16,.17,.16),mix(vec3(.37,.39,.40),vec3(.64,.61,.56),variation),smoothstep(.025,.075,edge));ROUGHNESS=.95;
}
