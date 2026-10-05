shader_type spatial;
varying vec3 p;
varying vec3 n;
void vertex(){p=VERTEX;n=NORMAL;}
void fragment(){
 vec2 uv=abs(n.x)>0.5?p.zy:p.xy;
 // Box primitives carry their dimensions in MODEL_MATRIX.
 vec3 scale=vec3(length(MODEL_MATRIX[0].xyz),length(MODEL_MATRIX[1].xyz),length(MODEL_MATRIX[2].xyz));
 uv*=abs(n.x)>0.5?scale.zy:scale.xy;
 float row=floor(uv.y/.14);uv.x+=mod(row,2.)*.17;
 vec2 cell=uv/vec2(.34,.14);vec2 f=fract(cell);
 float mortar=max(step(.955,f.x),step(.92,f.y));
 float tone=fract(sin(dot(floor(cell),vec2(12.9898,78.233)))*43758.5453);
 ALBEDO=mix(mix(vec3(.27,.095,.035),vec3(.53,.235,.105),tone),vec3(.38,.32,.235),mortar);
 ROUGHNESS=.94;
}
