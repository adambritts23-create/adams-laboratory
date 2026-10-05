shader_type spatial;
render_mode cull_disabled;
uniform sampler2D flag_image:source_color;
uniform bool crowns=false;
void vertex(){VERTEX.z+=UV.x*(.07*sin(UV.x*9.0-TIME*2.4)+.035*sin(UV.y*5.0+UV.x*17.0-TIME*3.1));}
void fragment(){bool cross_band=(UV.x>=.3125&&UV.x<=.4375)||(UV.y>=.4&&UV.y<=.6);ALBEDO=crowns?texture(flag_image,UV).rgb:(cross_band?vec3(.9,.61,.025):vec3(.008,.032,.12));ROUGHNESS=.9;}
