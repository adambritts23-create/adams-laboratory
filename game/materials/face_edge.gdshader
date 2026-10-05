shader_type spatial;
render_mode unshaded, cull_disabled;
uniform sampler2D face_image: source_color, filter_linear_mipmap;
void fragment(){ALBEDO=texture(face_image,UV).rgb; ALPHA=texture(face_image,UV).a;}
