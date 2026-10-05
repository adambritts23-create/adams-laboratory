extends SubViewportContainer
var liquid: Node3D
var glass: Node3D
func _ready() -> void:
	stretch=true;custom_minimum_size=Vector2(220,190);size_flags_vertical=Control.SIZE_EXPAND_FILL
	var vp:=SubViewport.new();vp.size=Vector2i(280,360);vp.own_world_3d=true;vp.render_target_update_mode=SubViewport.UPDATE_ALWAYS;add_child(vp)
	var props:=preload("res://scripts/lab_props.gd").new();vp.add_child(props);props.init_materials()
	glass=props.vessel("beaker",Vector3.ZERO,1.2);glass.set_meta("protected_glass",true)
	liquid=props.liquid_visual(Vector3(0,.02,0),.19,.36,Color(.45,.66,.74,.35),0);liquid.fill_level=.65;liquid.sediment_color=Color(.78,.73,.61);liquid.apply_visuals()
	var environment:=WorldEnvironment.new();var env:=Environment.new();env.background_mode=Environment.BG_COLOR;env.background_color=Color("10232b");env.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;env.ambient_light_color=Color(.7,.8,.9);env.ambient_light_energy=.6;environment.environment=env;vp.add_child(environment)
	var light:=OmniLight3D.new();light.position=Vector3(.5,1,1);light.light_energy=2;light.omni_range=4;vp.add_child(light)
	var camera:=Camera3D.new();vp.add_child(camera);camera.position=Vector3(.65,.58,.9);camera.look_at(Vector3(0,.23,0));camera.fov=35;camera.current=true
func apply_result(state: Dictionary) -> void:
	if liquid==null:return
	liquid.fill_level=.65
	liquid.visible=state.get("accepted",false)
	liquid.sediment_amount=clampf(float(state.get("visual",{}).get("bedHeight",0))/56,0,1) if liquid.visible else 0
	liquid.settling_progress=liquid.sediment_amount;liquid.precipitation_progress=liquid.sediment_amount;liquid.apply_visuals()
