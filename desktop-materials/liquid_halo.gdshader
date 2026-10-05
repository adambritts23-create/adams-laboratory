shader_type spatial;
render_mode unshaded, blend_add, depth_draw_never, cull_disabled;
uniform float strength=.03;
void vertex(){MODELVIEW_MATRIX=VIEW_MATRIX*mat4(INV_VIEW_MATRIX[0],INV_VIEW_MATRIX[1],INV_VIEW_MATRIX[2],MODEL_MATRIX[3]);}
void fragment(){
 float d=length((UV-vec2(.5))*2.0);
 float falloff=pow(max(0.0,1.0-d),3.0);
 ALBEDO=vec3(.38,.72,.02);ALPHA=falloff*strength;
}
