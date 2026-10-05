shader_type spatial;
render_mode cull_disabled;
varying vec3 world_point;
void vertex(){ world_point=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz; }
void fragment(){
	vec2 p=world_point.xz;
	float ripple=sin(p.x*53.0+sin(p.y*11.0))*cos(p.y*41.0);
	float glancing=pow(1.0-clamp(dot(normalize(NORMAL),normalize(VIEW)),0.0,1.0),2.0);
	float streak=pow(max(0.0,cos(p.y*1.047)),12.0);
	float red_pool=exp(-pow((abs(p.x)-2.0)*1.8,2.0))*streak;
	float green_pool=exp(-pow((p.x-1.5)*2.0,2.0)-pow((p.y-5.8)*0.7,2.0));
	ALBEDO=vec3(0.13,0.135,0.12);
	ALPHA=smoothstep(0.0,.25,COLOR.a)*.62;
	ROUGHNESS=0.085+ripple*0.018;
	METALLIC=0.12;
	SPECULAR=0.8;
	// Restrained stylized wet-floor light streaks, not a full mirror render.
	EMISSION=(vec3(0.16,0.014,0.004)*red_pool+vec3(0.025,0.09,0.008)*green_pool)*(0.4+0.6*glancing)*(0.8+0.2*ripple);
}

