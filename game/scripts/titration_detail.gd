extends "res://scripts/lab_props.gd"
var room: Node3D
var stream: MeshInstance3D
var stirrer: MeshInstance3D
var curve: Control
var viewport: SubViewport
var feed_active:=false
var progress:=0.0
func build(lab_room: Node3D) -> void:
	room=lab_room;init_materials();set_meta("dynamic",true)
	stream=cylinder(Vector3(-3.8,1.5,5.45),.005,.25,material(Color(.48,.62,.37,.65),0,.12,.12))
	stream.hide()
	stirrer=box(Vector3(-3.8,1.22,5.45),Vector3(.11,.015,.024),paper)
	# Probe tip sits below even the initial partial fill; only the cable is above.
	tube(Vector3(-3.68,1.21,5.39),Vector3(-3.68,1.58,5.39),.011,metal)
	cylinder(Vector3(-3.68,1.235,5.39),.014,.055,glass)
	cable([Vector3(-3.68,1.58,5.39),Vector3(-3.66,1.76,5.39),Vector3(-4.35,1.90,5.5)],rubber,.009)
	box(Vector3(-3.82,1.28,7.28),Vector3(.5,.20,.85),dark)
	box(Vector3(-3.82,1.70,7.28),Vector3(.11,.62,.97),painted)
	viewport=SubViewport.new();viewport.size=Vector2i(640,400)
	viewport.transparent_bg=false;viewport.render_target_update_mode=SubViewport.UPDATE_ALWAYS
	add_child(viewport)
	curve=preload("res://scripts/titration_curve.gd").new();curve.size=Vector2(640,400);viewport.add_child(curve)
	var screen:=MeshInstance3D.new();var quad:=QuadMesh.new();quad.size=Vector2(.89,.55)
	screen.mesh=quad;screen.position=Vector3(-3.758,1.70,7.28);screen.rotation.y=PI/2
	var mat:=StandardMaterial3D.new();mat.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_texture=viewport.get_texture();screen.material_override=mat;add_child(screen)
	label_at("pH PROBE",Vector3(-3.64,1.64,5.39),18,Color(.74,.78,.65),.0015).rotation.y=PI/2

func set_progress(t: float, running: bool) -> void:
	progress=clampf(t,0,1);feed_active=running and t<.60
	stream.visible=feed_active
	var surface_y: float=room.sample_liquid.position.y+room.sample_liquid.height*room.sample_liquid.fill_level
	stream.position.y=(1.64+surface_y)*.5
	stream.scale.y=maxf(.01,1.64-surface_y)
	stirrer.rotation.y=room.sample_liquid.motion_phase*4.0
	curve.set_progress(t,running)
