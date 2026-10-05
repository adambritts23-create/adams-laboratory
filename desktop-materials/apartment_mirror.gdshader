shader_type spatial;
render_mode unshaded, cull_disabled, fog_disabled;
uniform sampler2D reflection_view : source_color;
void fragment(){ ALBEDO=texture(reflection_view,vec2(1.0-SCREEN_UV.x,SCREEN_UV.y)).rgb * 0.94; }
