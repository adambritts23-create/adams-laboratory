shader_type sky;
uniform sampler2D cloud_panorama : filter_linear_mipmap;
uniform float daylight = 1.0;
uniform float sun_height = .12;
uniform float day_mode = 0.0;
uniform float moon_strength = 0.0;
uniform sampler2D moon_albedo : source_color, filter_linear_mipmap;
void sky(){
 vec3 sun_dir=normalize(vec3(.45,sun_height,-.88));
 float h=max(EYEDIR.y,0.0);
 vec3 dusk=mix(vec3(.95,.54,.25),vec3(.18,.29,.46),pow(h,.28));
 vec3 day=mix(vec3(.68,.83,.97),vec3(.10,.36,.72),pow(h,.38));
 vec3 sky_color=mix(dusk,day,day_mode);
 vec3 cloud=texture(cloud_panorama,SKY_COORDS).rgb;
 float cloud_mask=smoothstep(.48,1.25,dot(cloud,vec3(.2126,.7152,.0722)));
 float glow=pow(max(dot(EYEDIR,sun_dir),0.0),18.0);
 sky_color+=mix(vec3(.55,.21,.035),vec3(.20,.18,.11),day_mode)*glow;
 sky_color*=mix(.88,1.2,cloud_mask);
 sky_color+=mix(vec3(.10,.075,.05)*cloud_mask*.5,vec3(.43)*cloud_mask,day_mode);
 float disk=smoothstep(cos(.012),cos(.010),dot(EYEDIR,sun_dir));
 sky_color+=mix(vec3(3.8,2.1,.42),vec3(4.0,3.8,3.3),day_mode)*disk;
 sky_color=mix(vec3(.008,.016,.042)+sky_color*.025,sky_color,daylight);
 // Oversized moon with soft limb and mottled maria; part of the sky, with no extra light pass.
 vec3 moon_dir=normalize(vec3(-.45,.48,-.75));
 float alignment=dot(EYEDIR,moon_dir);
 // Keep the old disc in the lighting cubemap: larger visible moon adds no illumination.
 float radius=AT_CUBEMAP_PASS ? .061 : .122;
 float moon=smoothstep(cos(radius+.001),cos(radius-.001),alignment);
 vec3 right=normalize(cross(moon_dir,vec3(0,1,0)));
 vec3 up=cross(right,moon_dir);
 vec2 uv=vec2(dot(EYEDIR,right),dot(EYEDIR,up))/sin(radius);
 float maria=.5+.18*sin(uv.x*5.0+sin(uv.y*7.0))+.12*sin(uv.y*11.0-uv.x*3.0);
 float relief=mix(.55,1.0,maria)*sqrt(max(0.0,1.0-dot(uv,uv)*.75));
 float z=sqrt(max(0.0,1.0-min(dot(uv,uv),1.0)));
 vec2 map_uv=vec2(.5+atan(uv.x,max(z,.0001))/6.2831853,.5-asin(clamp(uv.y,-1.0,1.0))/3.14159265);
 vec3 surface=pow(texture(moon_albedo,map_uv).rgb,vec3(.454545));
 vec3 disc=AT_CUBEMAP_PASS ? vec3(1.5,1.57,1.65)*relief : surface*1.15*mix(.82,1.0,z);
 sky_color+=moon_strength*(vec3(.22,.30,.49)*pow(max(alignment,0.0),170.0)*(1.0-.85*moon)+disc*moon);
 if(EYEDIR.y<0.0)sky_color=mix(sky_color,mix(vec3(.012,.018,.025),vec3(.085,.075,.07),daylight),smoothstep(0.0,.16,-EYEDIR.y));
 COLOR=sky_color;
}
