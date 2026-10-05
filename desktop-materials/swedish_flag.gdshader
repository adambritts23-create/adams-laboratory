shader_type spatial;
render_mode cull_disabled;
void vertex(){
 float free_edge=UV.x;
 VERTEX.z+=free_edge*(.15*sin(UV.x*9.0-TIME*2.4)+.07*sin(UV.x*18.0+UV.y*5.0-TIME*3.7));
 VERTEX.y-=.11*free_edge*free_edge;
}
void fragment(){
 bool cross_band=(UV.x>=.3125 && UV.x<=.4375)||(UV.y>=.4 && UV.y<=.6);
 ALBEDO=cross_band?vec3(.78,.48,.018):vec3(.008,.032,.12);
 ROUGHNESS=.92;
}
