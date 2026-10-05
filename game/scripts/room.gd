extends "res://scripts/lab_props.gd"

var burette_contents: MeshInstance3D
var facility: Node3D
var lower_lab: Node3D
var actors: Array[Node3D] = []
var sample_vessel: Node3D
var sample_liquid: Node3D
var environment_dressing: Node3D
var sample_glow: OmniLight3D
var sludge: Node3D
var lamps: Array[OmniLight3D] = []
var pickups := {}
var bubbles: Array[MeshInstance3D] = []
var drops: Array[MeshInstance3D] = []
var valve: Node3D
const PRESENTATION_DURATION := 48.0
var titration_detail: Node3D
var presentation := false
var presentation_time := 0.0
var clock := 0.0
var indicators: Array[MeshInstance3D] = []
var npc_positions := {"adam":Vector3(-1.4,0,1.0),"axel":Vector3(1.5,0,-3.2)}

func lamp(pos: Vector3, color: Color, energy: float, radius: float) -> OmniLight3D:
	var light := OmniLight3D.new()
	light.position = pos
	light.light_color = color
	light.light_energy = energy
	light.omni_range = radius
	add_child(light)
	return light

func _ready() -> void:
	seed(773)
	init_materials()
	build_shell()
	build_services()
	build_benches()
	build_stations()
	titration_detail=preload("res://scripts/titration_detail.gd").new()
	add_child(titration_detail)
	titration_detail.build(self)
	build_gallery()
	build_storage()
	environment_dressing=preload("res://scripts/environment_dressing.gd").new()
	add_child(environment_dressing)
	environment_dressing.build(self)
	facility=preload("res://scripts/facility.gd").new()
	add_child(facility)
	facility.build(self)
	var furnishing:=preload("res://scripts/lab_furnishing.gd").new();add_child(furnishing);furnishing.upper()
	lower_lab=preload("res://scripts/lower_lab.gd").new();add_child(lower_lab);lower_lab.build(self)
	worker("adam",npc_positions.adam)
	worker("axel",npc_positions.axel)
	lamp(Vector3(3.8,2.1,11.2),Color(.85,.79,.66),1.4,4)
	pickup("sample","Process sample",Vector3(3.0,1.4,-5.5),green)
	pickup("beaker","Titration beaker",Vector3(3.0,1.4,0.5),glass)
	pickup("titrant","Titrant cartridge",Vector3(-3.0,1.4,-3.0),clear_liquid)
	var probe := ReflectionProbe.new()
	probe.position = Vector3(0,1.7,0)
	probe.size = Vector3(12,5,23)
	probe.interior = true
	probe.intensity = 0.65
	probe.max_distance = 27
	add_child(probe)
	call_deferred("batch_static")

func build_shell() -> void:
	var floor_mat:=ShaderMaterial.new()
	floor_mat.shader=preload("res://materials/concrete_floor.gdshader")
	floor_mat.set_shader_parameter("albedo_map",preload("res://art/environment/concrete_floor_02_diff_1k.jpg"))
	floor_mat.set_shader_parameter("normal_map",preload("res://art/environment/concrete_floor_02_nor_gl_1k.jpg"))
	floor_mat.set_shader_parameter("roughness_map",preload("res://art/environment/concrete_floor_02_rough_1k.jpg"))
	# Interior stair opening beside the washing area, bounded by secured glazing.
	box(Vector3(-3.25,-.15,0),Vector3(5.5,.3,24),floor_mat,true)
	box(Vector3(3.85,-.15,0),Vector3(4.3,.3,24),floor_mat,true)
	box(Vector3(.6,-.15,-10.2),Vector3(2.2,.3,3.6),floor_mat,true)
	box(Vector3(.6,-.15,4.15),Vector3(2.2,.3,15.7),floor_mat,true)
	# Reclaim the former stair margins as real walkable upper-floor strips.
	box(Vector3(-.3,-.15,-6.05),Vector3(.4,.3,4.7),floor_mat,true)
	box(Vector3(1.5,-.15,-6.05),Vector3(.4,.3,4.7),floor_mat,true)
	box(Vector3(0,4.15,0),Vector3(12,0.3,24),concrete,true)
	box(Vector3(6,2,0),Vector3(.3,4.1,24),concrete,true)
	# A real opening in the existing west glazing, guarded by the mission gate.
	for spec in [[4.1,8.2],[11.4,1.2]]:
		box(Vector3(-6,2,spec[0]),Vector3(.07,4.1,spec[1]),glass,true)
		box(Vector3(-6,.48,spec[0]),Vector3(.3,.96,spec[1]),concrete)
	box(Vector3(-6,3.53,9.5),Vector3(.3,1.04,2.6),concrete,true)
	box(Vector3(-6,2,-10.5),Vector3(0.3,4.1,3),concrete,true)
	box(Vector3(-6,2,-4.5),Vector3(0.07,3.9,9),glass,true)
	box(Vector3(0,2,12),Vector3(12,4.1,.2),concrete,true)
	# Staff exit opening through the rear wall.
	for x in [-3.5,3.5]:box(Vector3(x,2,-12),Vector3(5,4.1,.2),concrete,true)
	box(Vector3(0,3.45,-12),Vector3(2,1.2,.2),concrete,true)
	for side in [-1,1]:
		for z in range(-11,12,2):
			if side==1 or z < -9: box(Vector3(side*5.79,1.0,z),Vector3(0.1,1.8,1.92),worn)
			if side==1 or z not in [-3,3,9]: box(Vector3(side*5.70,2,z),Vector3(0.18,4,0.12),metal)
			if side==1 or (z>0 and z!=9):
				box(Vector3(side*5.6,2.7,z),Vector3(0.25,0.48,0.55),dark)
				for j in 4: box(Vector3(side*5.45,2.57+j*0.075,z),Vector3(0.02,0.018,0.4),metal)
	# Channel drain with slats down the aisle.
	box(Vector3(0,.012,-10.0),Vector3(.36,.02,3.2),rubber)
	box(Vector3(0,.012,3.9),Vector3(.36,.02,15.2),rubber)
	for z in range(-115,116,2):
		if z> -37 or z< -84:box(Vector3(0,.025,z*.1),Vector3(.34,.025,.035),metal)
	for i in 22:
		var puddle_pos:=Vector3(randf_range(-2.8,2.8),0.03,randf_range(-11,11))
		var puddle_size:=Vector2(randf_range(0.3,1.0),randf_range(0.4,1.5))
		if not (puddle_pos.x+puddle_size.x> -.5 and puddle_pos.x-puddle_size.x<1.7 and puddle_pos.z+puddle_size.y> -8.4 and puddle_pos.z-puddle_size.y< -3.7):puddle(puddle_pos,puddle_size)
	for z in range(-10,12,2):
		if z in [-8,-6,-4]:
			box(Vector3(-3.25,.006,z),Vector3(5.3,.007,.015),dark)
			box(Vector3(3.85,.006,z),Vector3(4.1,.007,.015),dark)
		else:box(Vector3(0,0.006,z),Vector3(11.8,0.007,0.015),dark)
	# Rear service door and entry frame are real physical barriers.
	# Sliding staff-exit door is owned by staff_exit.gd.
	for x in [-0.89,0.89]: box(Vector3(x,1.55,-11.65),Vector3(0.13,3.1,0.15),metal)
	box(Vector3(0,3.07,-11.65),Vector3(1.9,0.15,0.15),metal)



func puddle(pos: Vector3, scale_value: Vector2) -> void:
	var mesh := SurfaceTool.new()
	mesh.begin(Mesh.PRIMITIVE_TRIANGLES)
	var points: Array[Vector3] = []
	for j in 22:
		var angle := TAU*j/22.0
		var r := randf_range(0.72,1)
		points.append(Vector3(cos(angle)*scale_value.x*r,0,sin(angle)*scale_value.y*r))
	for j in 22:
		for point in [Vector3.ZERO,points[j],points[(j+1)%22]]:
			mesh.set_color(Color(1,1,1,1 if point==Vector3.ZERO else 0))
			mesh.set_normal(Vector3.UP)
			mesh.add_vertex(point)
	var wet := ShaderMaterial.new()
	wet.shader=preload("res://materials/wet_floor.gdshader")
	mesh_node(mesh.commit(),pos,Vector3.ONE,wet)

func build_services() -> void:
	for z in [-9,-3,3,9]:
		box(Vector3(0,3.75,z),Vector3(12,0.22,0.22),dark)
		box(Vector3(0,3.52,z),Vector3(1.65,0.14,0.42),worn)
		for end in [-1,1]:
			box(Vector3(end*.81,3.43,z),Vector3(.065,.13,.48),metal)
			tube(Vector3(end*.65,3.62,z),Vector3(end*.65,4.0,z),.016,metal)
		for offset in [-.22,.22]: box(Vector3(0,3.44,z+offset),Vector3(1.7,.13,.04),metal)
		box(Vector3(0,3.39,z),Vector3(1.53,.025,.34),material(Color(.65,.67,.60,.7),0,.5,.3))
		for rib in 9: box(Vector3(-.72+rib*.18,3.37,z),Vector3(.018,.04,.43),metal)
		for x in [-0.45,0,0.45]:
			var lamp_mesh := cylinder(Vector3(x,3.43,z),0.035,1.1,material(Color(0.82,0.79,0.63),0,0.45,1.5))
			lamp_mesh.rotation.z = PI/2
		var light := SpotLight3D.new()
		light.position = Vector3(0,3.4,z)
		light.rotation_degrees.x = -90
		light.light_color = Color(0.90,0.83,0.66)
		light.light_energy = 3.0
		light.spot_range = 7
		light.spot_angle = 65
		light.shadow_enabled = false
		light.light_cull_mask = 1
		add_child(light)
		for side in [-1,1]:
			var p := Vector3(side*5.25,3.0,z)
			cylinder(p,0.105,0.30,red)
			ring(p+Vector3(0,0.19,0),0.15,0.019,dark)
			ring(p-Vector3(0,0.19,0),0.15,0.019,dark)
			for a in 6:
				var off := Vector3(cos(TAU*a/6)*0.14,0,sin(TAU*a/6)*0.14)
				tube(p+off-Vector3(0,0.19,0),p+off+Vector3(0,0.19,0),0.012,metal)
			lamps.append(lamp(p,Color(1,0.055,0.009),.50,3.2))
	for x in [-4.8,-4.5,4.6]:
		tube(Vector3(x,3.8,-11.8),Vector3(x,3.8,11.8),0.11,metal)
		for z in range(-11,12,2): ring(Vector3(x,3.8,z),0.135,0.016,brass).rotation.x = PI/2
	# Ribbed ventilation duct and fume hoods.
	box(Vector3(3.6,3.65,0),Vector3(0.55,0.45,23),worn)
	for z in range(-115,116,5): box(Vector3(3.6,3.65,z*0.1),Vector3(0.58,0.48,0.025),metal)
	# Overhead cable tray, bundled cables and hanging conduits.
	for z in range(-11,12):
		box(Vector3(1.3,3.9,z),Vector3(0.7,0.06,0.10),metal)
	for x in [1.05,1.3,1.55]: tube(Vector3(x,3.96,-11),Vector3(x,3.96,11),0.035,rubber)
	for side in [-1,1]:
		for h in [2.1,2.3]:
			if side==1: tube(Vector3(side*5.62,h,-11.5),Vector3(side*5.62,h,11.5),.028,brass)
			else:
				cable([Vector3(-5.62,h,-11.5),Vector3(-5.62,h,8),Vector3(-5.62,h+1.1,8),Vector3(-5.62,h+1.1,11),Vector3(-5.62,h,11),Vector3(-5.62,h,11.5)],brass,.028)

func build_benches() -> void:
	for side in [-1,1]:
		for z in [-6,0,6]:
			var x: float = side*4.35
			box(Vector3(x,0.51,z),Vector3(2.5,1.02,4.4),dark,true)
			box(Vector3(x,1.09,z),Vector3(2.65,0.13,4.5),worktop,true)
			box(Vector3(x-side*1.32,1.12,z),Vector3(0.035,0.06,4.5),metal)
			for dz in [-1.65,-0.55,0.55,1.65]:
				var px: float = x-side*1.258
				box(Vector3(px,0.59,z+dz),Vector3(0.02,0.76,1.0),painted)
				box(Vector3(px-side*0.03,0.80,z+dz),Vector3(0.03,0.02,0.23),metal)
				for yy in [0.27,0.32,0.37]: box(Vector3(px-side*0.015,yy,z+dz),Vector3(0.01,0.01,0.65),rubber)
			# Slim white task light, focused on the work surface.
			box(Vector3(x,2.85,z),Vector3(.12,.04,3.8),material(Color(.94,.97,1),0,.4,1.3))
			var task=SpotLight3D.new();task.name="StationTaskLight_%s_%s" % [side,z];task.position=Vector3(x,2.75,z)
			task.rotation_degrees.x=-90;task.light_color=Color(.95,.97,1);task.light_energy=3.8
			task.spot_range=3.4;task.spot_angle=72;task.spot_attenuation=.5;task.shadow_enabled=false
			task.light_cull_mask=1;add_child(task)
			# Back shelves with bottles of varied silhouettes and fill colors.
			for h in [1.78,2.35]:
				if side==-1 and z==-6: continue
				box(Vector3(side*5.23,h,z),Vector3(0.9,0.07,4.2),metal)
				for i in 9:
					var kind: String = ["bottle","flask","bottle","volumetric"][i%4]
					var liquid: Material = [amber,wine,clear_liquid,green,clear_liquid][i%5]
					vessel(kind,Vector3(side*5.19,h+0.04,z-1.8+i*0.43),randf_range(0.55,0.8),liquid,"B-%02d"%i)
			# Loose reagent glassware stays on the rear shelves; instruments keep clear worktops.
			# Safety lip, notebook and sample tray.
			box(Vector3(x-side*0.9,1.18,z-1.2),Vector3(0.45,0.035,0.55),paper).rotation.y = 0.13
			for k in 5: box(Vector3(x-side*0.9,1.201,z-1.38+k*0.07),Vector3(0.28,0.005,0.009),dark)
			box(Vector3(x-side*0.8,1.19,z+1.3),Vector3(0.65,0.04,0.45),metal)
			if z==0: test_rack(Vector3(x-side*0.7,1.18,z-0.6))
	# Selected solutions illuminate their own benches, not the whole room.
	for p in [Vector3(-3.8,1.6,6.1),Vector3(3.45,1.5,5.8),Vector3(4.3,1.8,-6)]:
		var glow:=lamp(p,Color(0.39,0.85,0.02),0.55,2.2)
		if p.x<0: sample_glow=glow

func test_rack(pos: Vector3) -> void:
	box(pos+Vector3(0,0.035,0),Vector3(0.7,0.05,0.2),worn)
	box(pos+Vector3(0,0.25,0),Vector3(0.7,0.035,0.2),metal)
	for x in [-0.3,0.3]: tube(pos+Vector3(x,0.02,0),pos+Vector3(x,0.3,0),0.016,metal)
	for i in 6: vessel("tube",pos+Vector3(-0.26+i*0.10,0.06,0),0.8,green if i%3==0 else wine)

func station(id: String, title: String, pos: Vector3, angle: float) -> void:
	# Bench-apron plates leave apparatus sightlines unobstructed.
	var body := box(pos,Vector3(1.45,0.48,0.08),rubber,true,id,title.replace("\n"," "))
	body.rotation.y=angle
	var normal:=Vector3(sin(angle),0,cos(angle))
	label_at(title,pos+normal*0.05,32,Color(0.85,0.8,0.66),0.0025).rotation.y=angle
	for dx in [-0.66,0.66]:
		for dy in [-0.18,0.18]: ellipsoid(pos+Vector3(dx,dy,0.055).rotated(Vector3.UP,angle),Vector3.ONE*0.009,metal)

func burette(pos: Vector3, tint: Material) -> Node3D:
	box(pos+Vector3(0,0.025,0.50),Vector3(0.5,0.05,0.42),dark)
	tube(pos+Vector3(0,0.04,0.50),pos+Vector3(0,1.7,0.50),0.025,metal)
	tube(pos+Vector3(0,1.37,0.50),pos+Vector3(0,1.37,0),0.018,metal)
	imported_prop("clamp_titration_clamp_dual",pos+Vector3(0,1.31,.17),1.0,metal)
	cylinder(pos+Vector3(0,1.12,0),0.043,0.97,glass)
	var contents:=cylinder(pos+Vector3(0,1.03,0),0.030,0.70,tint)
	if pos.distance_to(Vector3(-3.8,1.17,5.45))<.01:
		burette_contents=contents
		contents.set_meta("dynamic",true)
	for k in 16: box(pos+Vector3(0.018,0.72+k*0.048,0.041),Vector3(0.025 if k%4==0 else 0.015,0.004,0.004),paper)
	tube(pos+Vector3(0,0.63,0),pos+Vector3(0,0.47,0),0.012,glass)
	var handle := box(pos+Vector3(0,0.62,0),Vector3(0.17,0.025,0.035),brass)
	handle.set_meta("dynamic",true)
	return handle

func build_stations() -> void:
	station("acid","ACID-BASE\nTITRATIONS",Vector3(-3.055,0.73,6.1),PI/2)
	station("redox","REDOX\nTITRATIONS",Vector3(-3.055,0.73,0.1),PI/2)
	station("electro","KF COULOMETRY",Vector3(3.055,0.73,6.1),-PI/2)
	station("prep","CHEMICAL\nPREPARATION",Vector3(3.055,0.73,-5.8),-PI/2)
	valve = burette(Vector3(-3.8,1.17,5.45),clear_liquid)
	sample_vessel=vessel("beaker",Vector3(-3.8,1.17,5.45),1.3)
	sample_vessel.set_meta("dynamic",true)
	sample_liquid=liquid_visual(Vector3(-3.8,1.185,5.45),.211,.27,Color(.12,.39,.008,.48),.65)
	sample_liquid.usable_vessel_depth=.48
	sample_liquid.visible=false
	sludge=sample_liquid.sediment
	for i in 5:
		var d := ellipsoid(Vector3(-3.8,1.7,5.45),Vector3(0.014,0.025,0.014),material(Color(0.5,0.69,0.52,0.8),0.1,0.12))
		d.set_meta("dynamic",true)
		d.hide()
		drops.append(d)
	instrument(Vector3(-4.65,1.18,4.75),"PH / SAMPLE",false)
	burette(Vector3(-3.85,1.17,-0.55),wine)
	vessel("flask",Vector3(-3.85,1.17,-0.55),1.1,wine)
	instrument(Vector3(-4.4,1.18,-1.3),"mV",false)
	var kf := preload("res://scripts/kf_upstairs.gd").new()
	kf.position = Vector3(3.8,1.17,6.1)
	kf.rotation.y = -PI/2
	add_child(kf)
	# Preparation tools: balance, funnel, waste bin and pipette stand.
	box(Vector3(3.85,1.23,-6),Vector3(0.58,0.13,0.46),cream)
	cylinder(Vector3(3.85,1.34,-6),0.19,0.02,metal)
	gauge(Vector3(3.85,1.23,-5.76),0.055)
	vessel("volumetric",Vector3(4.3,1.17,-7.2),1.2,clear_liquid)
	cylinder(Vector3(4.3,1.95,-7.2),0.035,0.25,glass,0.15)
	test_rack(Vector3(3.9,1.17,-6.8))
	for i in 4: tube(Vector3(4.7+i*0.08,1.2,-5.9),Vector3(4.68+i*0.08,1.8,-5.85),0.007,glass)
	cylinder(Vector3(4.1,0.36,-8.6),0.34,0.7,worn)
	plaque("WASTE",Vector3(4.1,0.5,-8.25),Vector2(0.35,0.2),0,true)

func instrument(pos: Vector3, title: String, supply: bool) -> void:
	box(pos+Vector3(0,0.23,0),Vector3(0.86,0.46,0.55),plastic)
	box(pos+Vector3(0,0.30,0.281),Vector3(0.59,0.16,0.015),rubber)
	label_at("0.50    0.00" if supply else "READY",pos+Vector3(0,0.31,0.296),24,Color(1,0.14,0.055) if supply else Color(0.45,0.8,0.3),0.0019)
	label_at(title,pos+Vector3(0,0.43,0.285),20,Color(0.06,0.055,0.04),0.0015)
	for x in [-0.29,0.29]:
		var knob := cylinder(pos+Vector3(x,0.13,0.3),0.06,0.075,rubber)
		knob.rotation.x = PI/2
		var jack := cylinder(pos+Vector3(x*0.45,0.095,0.3),0.03,0.08,red if x<0 else rubber)
		jack.rotation.x = PI/2
	for z in [-0.2,-0.1,0,0.1]: box(pos+Vector3(0.435,0.25,z),Vector3(0.005,0.16,0.018),rubber)

func build_gallery() -> void:
	box(Vector3(-2.7,2.0,-8.6),Vector3(5.8,3.8,0.06),glass,true)
	for x in [-5.6,-3.7,-1.8,0.2]: box(Vector3(x,2,-8.52),Vector3(0.11,3.9,0.14),dark)
	for h in [0.3,3.9]: box(Vector3(-2.7,h,-8.52),Vector3(5.8,0.13,0.14),metal)
	for z in [-8.5,-6,-3.5,-1]:
		box(Vector3(-5.94,2,z),Vector3(0.13,4,0.12),metal)
	# The former shallow gallery backing is replaced by the full conversion hall.
	for p in [Vector3(-4.7,0,-10.5),Vector3(-2.5,0,-10.5)]:
		cylinder(p+Vector3(0,1.45,0),0.65,2.2,worn)
		ellipsoid(p+Vector3(0,2.56,0),Vector3(0.65,0.2,0.65),metal)
		for y in [0.4,1.5,2.5]: ring(p+Vector3(0,y,0),0.68,0.028,brass)
		for x in [-0.42,0.42]: tube(p+Vector3(x,0,0),p+Vector3(x,0.55,0),0.065,metal)
		tube(p+Vector3(0,2.6,0),p+Vector3(0,3.8,0),0.13,metal)
		gauge(p+Vector3(0.28,2.1,0.66),0.12)
		var wheel := ring(p+Vector3(-0.33,1.55,0.8),0.17,0.016,red)
		wheel.rotation.x = PI/2
		tube(p+Vector3(-0.33,1.55,0.5),p+Vector3(-0.33,1.55,0.8),0.04,brass)
		box(p+Vector3(0.75,0.28,0.3),Vector3(0.45,0.4,0.4),metal)
		mist(p+Vector3(0.1,2.7,0),0.25)
	for z in [-1,-4,-7]:
		lamp(Vector3(-7.5,2.7,z),Color(0.95,0.07,0.025),0.8,3.5)
		cable([Vector3(-9,3.6,z),Vector3(-7.7,3.6,z),Vector3(-7.7,1.3,z)],metal,0.065)
	plaque("PROCESS GALLERY\nACCESS RESTRICTED",Vector3(-2.6,3.3,-8.4),Vector2(1.9,0.5))
	plaque("PROCESS\nGALLERY",Vector3(-4.5,2.9,-10.9),Vector2(1.4,0.7),0,true)
	# Exterior walkways belong to the expanded hall.

func build_storage() -> void:
	box(Vector3(2.8,1.45,-10.7),Vector3(2.4,2.9,1),dark,true,"cabinet","Radioactive storage · locked")
	for x in [2.24,3.36]:
		box(Vector3(x,1.47,-10.17),Vector3(1.08,2.7,0.10),worn)
		for y in [0.38,2.55]: box(Vector3(x-0.45, y,-10.08),Vector3(0.12,0.16,0.12),metal)
		tube(Vector3(x+0.32,1.15,-10.03),Vector3(x+0.32,1.65,-10.03),0.027,metal)
	plaque("☢\nRADIOACTIVE\nMATERIALS",Vector3(2.8,2.0,-10.09),Vector2(1.2,0.75),0,true)
	plaque("Pu  /  Cs-137\nLOCKED",Vector3(2.8,0.9,-10.08),Vector2(0.85,0.4))
	box(Vector3(2.8,1.38,-9.98),Vector3(0.11,0.18,0.07),brass)
	cylinder(Vector3(2.8,3.02,-10.5),0.09,0.18,green)
	lamp(Vector3(2.8,2.6,-9.9),Color(0.32,0.7,0.06),0.5,2.7)
	instrument(Vector3(4.45,1.8,-10.3),"MONITOR",false)

func mist(pos: Vector3, width: float) -> void:
	var particles := CPUParticles3D.new()
	particles.position = pos
	particles.amount = 10
	particles.lifetime = 3.5
	particles.preprocess = 3
	particles.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	particles.emission_sphere_radius = width
	particles.direction = Vector3.UP
	particles.gravity = Vector3(0,0.015,0)
	particles.initial_velocity_min = 0.04
	particles.initial_velocity_max = 0.1
	particles.scale_amount_min = 0.2
	particles.scale_amount_max = 0.7
	var quad := QuadMesh.new()
	quad.size = Vector2(0.65,0.65)
	var m := material(Color(0.45,0.52,0.46,0.045),0,1).duplicate() as StandardMaterial3D
	m.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	var tex := GradientTexture2D.new()
	tex.fill = GradientTexture2D.FILL_RADIAL
	tex.fill_from = Vector2(0.5,0.5)
	tex.fill_to = Vector2(1,0.5)
	tex.gradient = Gradient.new()
	tex.gradient.colors = PackedColorArray([Color.WHITE,Color(1,1,1,0)])
	m.albedo_texture = tex
	quad.material = m
	particles.mesh = quad
	add_child(particles)

func pickup(id: String, title: String, pos: Vector3, mat: Material) -> void:
	var body := StaticBody3D.new()
	body.position = pos
	body.set_meta("interaction",id)
	body.set_meta("title",title)
	body.set_meta("dynamic",true)
	add_child(body)
	var c := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(0.36,0.45,0.36)
	c.shape = shape
	body.add_child(c)
	var prop := vessel("beaker" if id=="beaker" else "bottle",pos-Vector3(0,0.20,0),0.9,null if id=="beaker" else mat,"SAMPLE" if id=="sample" else "TITRANT")
	prop.reparent(body)
	pickups[id] = body

func worker(id: String, pos: Vector3) -> void:
	var actor:=preload("res://scripts/worker_rigged.gd").new()
	add_child(actor)
	actor.build(id,pos,self)
	actors.append(actor)
	lamp(pos+Vector3(0,2.5,1.0),Color(0.85,0.84,0.78),0.95,3.0)
	lamp(pos+Vector3(.8,2.35,-.7),Color(.70,.75,.80),.65,2.8)

func start_presentation() -> void:
	presentation=true
	presentation_time=0
	sample_glow.light_energy=.55
	sample_liquid.fill_level=.48
	sample_liquid.set_treatment(0)
	sample_liquid.show()
	titration_detail.set_progress(0,true)

func advance_presentation(delta: float) -> void:
	if not presentation: return
	presentation_time=minf(PRESENTATION_DURATION,presentation_time+delta)
	var t:=presentation_time/PRESENTATION_DURATION
	valve.rotation.y=PI/2 if t<.60 else 0.0
	var feed:=clampf(t/.60,0,1)
	sample_liquid.fill_level=lerpf(.48,.96,smoothstep(0,1,feed))
	sample_liquid.set_treatment(t)
	sample_liquid.animate_motion(delta)
	for i in drops.size():
		drops[i].visible=t<.60
		var surface_y: float=sample_liquid.position.y+sample_liquid.height*sample_liquid.fill_level
		drops[i].position.y=lerpf(1.64,surface_y,fmod(presentation_time*2.5+i*.19,1))
	titration_detail.set_progress(t,true)
	sample_glow.light_energy=.55*(1-t)+.04

func show_success() -> void:
	presentation=false
	for drop in drops: drop.hide()
	valve.rotation.y=0
	sample_liquid.fill_level=.96
	sample_liquid.set_treatment(1)
	titration_detail.set_progress(1,false)
	sample_glow.light_energy=.04

func _process(delta: float) -> void:
	clock += delta
	for b in bubbles:
		b.position.y += delta*0.09
		if b.position.y>1.37: b.position.y=1.21

func breitling(wrist: Vector3) -> void:
	# Silver chronograph case, black strap and three contrasting subdials from Adam's portrait.
	var strap := ring(wrist,0.068,0.006,rubber)
	strap.rotation.x=0.30
	var silver := material(Color(0.78,0.81,0.84),0.55,0.22,0.04)
	var dial_pos := wrist+Vector3(0,0,0.071)
	var case_mesh := cylinder(dial_pos,0.029,0.010,silver)
	case_mesh.rotation.x=PI/2
	var dial := cylinder(dial_pos+Vector3(0,0,0.006),0.024,0.001,rubber)
	dial.rotation.x=PI/2
	for xy in [Vector2(-0.009,0.005),Vector2(0.009,0.005),Vector2(0,-0.010)]:
		var sub := cylinder(dial_pos+Vector3(xy.x,xy.y,0.007),0.0055,0.001,silver)
		sub.rotation.x=PI/2
	for i in 12:
		var a := i*TAU/12
		tube(dial_pos+Vector3(sin(a)*0.019,cos(a)*0.019,0.008),dial_pos+Vector3(sin(a)*0.022,cos(a)*0.022,0.008),0.001,paper)
	tube(dial_pos+Vector3(0,0,0.009),dial_pos+Vector3(0.012,0.007,0.009),0.0012,paper)
	tube(dial_pos+Vector3(0,0,0.009),dial_pos+Vector3(-0.008,0.012,0.009),0.001,paper)
	for y in [-0.016,0,0.016]: cylinder(dial_pos+Vector3(0.030,y,0),0.003,0.005,silver).rotation.z=PI/2







