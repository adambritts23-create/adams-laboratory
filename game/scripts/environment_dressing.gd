extends "res://scripts/lab_props.gd"
var sink_drop: MeshInstance3D
var drip_clock:=0.0
var hoods: Array[Node3D]=[]
func build(room: Node3D) -> void:
	init_materials()
	for z in [6.0,0.0,-6.0]:
		for side in [-1,1]:
			if side==1 and z==0: continue
			build_hood(Vector3(side*4.55,1.17,z),-side*PI/2,room)
	# Imported close-view instruments, with clearance around mission snap points.
	imported_prop("machine_hot_plate",Vector3(-4.75,1.18,7.35),1.0)
	imported_prop("machine_electronic_scale",Vector3(3.65,1.17,-4.25),1.25)
	imported_prop("machine_microscope",Vector3(4.05,1.17,-.55),1.0)
	imported_prop("heating_equipment_bunsen_burner",Vector3(-3.8,1.17,1.45),1.0,metal)
	imported_prop("bottle_glassware_filtering_flask_large",Vector3(3.65,1.17,-7.65),.9,glass)
	imported_prop("bottle_glassware_volumetric_flask_large",Vector3(-3.7,1.17,7.55),.75,glass)
	vessel("flask",Vector3(4.35,1.17,.65),1.0,wine)
	# The conversion hall now owns all exterior structural dressing.
	build_sink()
	call_deferred("batch_static")

func build_hood(pos: Vector3, angle: float, room: Node3D) -> void:
	var root:=Node3D.new()
	root.name="FumeHood"+str(hoods.size())
	add_child(root)
	var before:=get_child_count()
	# Local +Z faces the aisle. A partial raised sash keeps apparatus readable.
	box(Vector3(0,.65,-.64),Vector3(2.30,1.30,.08),painted)
	for x in [-1.12,1.12]:
		box(Vector3(x,.89,0),Vector3(.075,1.78,1.34),painted)
		box(Vector3(x,.81,.66),Vector3(.095,1.62,.075),metal)
	box(Vector3(0,1.76,0),Vector3(2.38,.28,1.45),worn)
	box(Vector3(0,1.40,.65),Vector3(2.12,.45,.018),glass)
	tube(Vector3(-1.03,1.18,.68),Vector3(1.03,1.18,.68),.022,metal)
	box(Vector3(0,1.59,-.02),Vector3(1.65,.025,.22),material(Color(.8,.82,.70),0,.45,1.2))
	for i in 7: box(Vector3(0,.22+i*.11,-.59),Vector3(1.80,.018,.025),rubber)
	# Flanged duct physically meets the overhead utility height.
	box(Vector3(0,1.80,-.22),Vector3(.53,.45,.53),metal)
	box(Vector3(0,2.18,-.22),Vector3(.46,.32,.46),painted)
	for h in [1.62,1.94,2.34]: box(Vector3(0,h,-.22),Vector3(.57,.045,.57),metal)
	box(Vector3(.85,1.77,.75),Vector3(.30,.18,.04),rubber)
	box(Vector3(.85,1.80,.78),Vector3(.21,.035,.005),material(Color(.20,.70,.16),0,.3,.5))
	label_at("AIRFLOW",Vector3(.85,1.74,.78),18,Color(.72,.76,.65),.001)
	var fan:=imported_prop("Prop_Fan_Small",Vector3(-.65,1.40,-.10),.36,dark)
	fan.rotation.x=PI/2
	for child in get_children().slice(before): child.reparent(root)
	root.position=pos
	root.rotation.y=angle
	hoods.append(root)
	var light:=SpotLight3D.new()
	root.add_child(light)
	light.position=Vector3(0,1.56,.25)
	light.rotation_degrees.x=-90
	light.light_color=Color(.85,.88,.78)
	light.light_energy=2.6
	light.spot_range=2.5
	light.spot_angle=68
	room.lamp(pos+Vector3(-signf(pos.x)*.6,.6,0),Color(.68,.74,.78),.30,3.0)

func build_sink() -> void:
	# A shallow stainless sink sits on the spare right-middle bench.
	var p:=Vector3(4.15,1.18,1.45)
	box(p,Vector3(.75,.025,.52),metal)
	box(p+Vector3(0,.018,0),Vector3(.62,.012,.40),rubber)
	for x in [-.36,.36]: box(p+Vector3(x,.04,0),Vector3(.025,.09,.50),metal)
	for z in [-.25,.25]: box(p+Vector3(0,.04,z),Vector3(.75,.09,.025),metal)
	cable([p+Vector3(0,0,-.28),p+Vector3(0,.40,-.28),p+Vector3(0,.46,-.1),p+Vector3(0,.35,0)],metal,.018)
	var water:=ShaderMaterial.new();water.shader=preload("res://materials/sink_water.gdshader")
	box(p+Vector3(0,.024,0),Vector3(.61,.003,.39),water)
	sink_drop=ellipsoid(p+Vector3(0,.25,0),Vector3(.005,.012,.005),glass)
	sink_drop.set_meta("dynamic",true)
	for i in 8:
		var a:=TAU*i/8
		box(p+Vector3(cos(a)*.035,.029,sin(a)*.035),Vector3(.008,.006,.008),metal)
func _process(delta: float) -> void:
	drip_clock=fmod(drip_clock+delta,3.2)
	if sink_drop:
		sink_drop.visible=drip_clock<.5
		sink_drop.position.y=1.53-drip_clock*.64
