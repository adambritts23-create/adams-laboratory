shader_type spatial;
render_mode cull_disabled;
void fragment(){vec2 p=UV*30.0;float ripple=sin(p.x+TIME*2.2)*cos(p.y-TIME*1.4);ALBEDO=mix(vec3(.045,.22,.24),vec3(.28,.55,.57),.5+.15*ripple);ROUGHNESS=.18;METALLIC=.3;NORMAL_MAP=vec3(.5+.04*cos(p.x+TIME*2.2),.5+.04*sin(p.y-TIME*1.4),1.0);}
