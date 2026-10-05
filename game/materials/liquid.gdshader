shader_type spatial;
render_mode unshaded, cull_disabled;
uniform vec4 liquid_color : source_color = vec4(.12,.39,.008,.48);
uniform vec4 sediment_color : source_color = vec4(.65,.32,.045,1.0);
uniform float emission_strength = .65;
uniform float cloudiness : hint_range(0,1) = 0.0;
uniform float surface_motion = .15;
uniform float sediment_amount : hint_range(0,1) = 0.0;
uniform bool surface = false;
void fragment(){ALBEDO=liquid_color.rgb; ALPHA=liquid_color.a;}
