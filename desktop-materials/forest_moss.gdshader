shader_type spatial;
varying vec3 p;
void vertex(){p=(MODEL_MATRIX*vec4(VERTEX,1.)).xyz;}
float hash(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 q){vec2 i=floor(q);vec2 f=fract(q);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void fragment(){float clump=noise(p.xz*8.);float fibre=noise(p.xz*95.);ALBEDO=mix(vec3(.045,.13,.015),vec3(.29,.40,.055),clump)*(.75+.4*fibre);ROUGHNESS=1.;}
