shader_type spatial;
render_mode cull_disabled;
uniform vec4 liquid_color : source_color = vec4(.12,.39,.008,.48);
uniform vec4 sediment_color : source_color = vec4(.65,.32,.045,1.0);
uniform float emission_strength = .65;
uniform float cloudiness : hint_range(0,1) = 0.0;
uniform float surface_motion = .15;
uniform float sediment_amount : hint_range(0,1) = 0.0;
uniform bool surface = false;
varying vec3 local_position;
void vertex(){
 local_position=VERTEX;
 if(surface){VERTEX.y+=sin(VERTEX.x*35.0+TIME*2.0)*cos(VERTEX.z*29.0-TIME)*.003*surface_motion;}
}
void fragment(){
 float fresnel=pow(1.0-abs(dot(normalize(NORMAL),normalize(VIEW))),3.0);
 float swirl=sin(local_position.x*31.0+sin(local_position.z*22.0+TIME*.35)+TIME*.24)*sin(local_position.y*29.0+TIME*.18);
 float fine=sin(local_position.x*171.0+local_position.y*123.0)*sin(local_position.z*137.0-local_position.y*81.0);
 float floc=(.34+smoothstep(.38,.90,swirl)*.44+smoothstep(.64,.98,fine)*.22)*cloudiness;
 vec3 bulk=mix(liquid_color.rgb,sediment_color.rgb,floc*.90);
 ALBEDO=bulk*(surface ? .78 : .62)+vec3(.08,.10,.025)*fresnel;
 ALPHA=clamp(liquid_color.a+floc*.44+fresnel*.10,0.0,.85);
 ROUGHNESS=surface ? .13 : .24;
 SPECULAR=.7;
 vec3 luminous=mix(bulk,vec3(.62,.77,.035),.32+fresnel*.3);
 EMISSION=luminous*emission_strength*(.48+fresnel*.60+(surface ? .24 : 0.0));
}
