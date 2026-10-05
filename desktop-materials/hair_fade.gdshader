shader_type spatial;
uniform float bald=0.0;
void fragment(){
 float fade=smoothstep(.42,.62,UV.y);
 float grain=fract(sin(dot(UV*1800.0,vec2(12.9898,78.233)))*43758.5453);
 ALBEDO=mix(vec3(.16,.115,.076)*(0.8+.3*grain),vec3(.46,.295,.20),fade);
 ROUGHNESS=.95; SPECULAR=.2;
}
