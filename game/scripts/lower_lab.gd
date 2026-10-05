extends "res://scripts/lab_furnishing.gd"
# Plan coordinates: drawing-right = world -Z; drawing-down = world +X.
# Descending +Z therefore puts the long ICP facade (+X) immediately on the LEFT.
const FLOOR: float=-4.55
const FLOOR_AREA: float=480.0
const STAIR_TOP:=Vector3(.6,0,-8.4)
const STAIR_FOOT:=Vector3(4.8,FLOOR,2.7)
const DESCENT_DIRECTION:=Vector3(0,0,1)
const ICP_GLASS_X: float=6.2
var room: Node3D
var gate: StaticBody3D
var unlocked:=false
var opened:=false
var door_status: Label3D
var icp_count:=0
var coulometer_count:=0
var hood_count:=0
var route_points: Array[Vector3]=[
	Vector3(3.8,0,-8.95),Vector3(.6,0,-9.15),Vector3(.6,0,-8.4),
	Vector3(.6,-2.275,-3.85),Vector3(.6,-2.275,-2.65),Vector3(4.8,-2.275,-2.65),Vector3(4.8,-2.275,-1.85),
	Vector3(4.8,FLOOR,2.7),Vector3(4.8,FLOOR,4),Vector3(3,FLOOR,3),Vector3(0,FLOOR,3.5),
	Vector3(-2,FLOOR,3.5),Vector3(0,FLOOR,3.5),Vector3(0,FLOOR,5.2),Vector3(0,FLOOR,8),Vector3(0,FLOOR,5.2),
	Vector3(3.7,FLOOR,5.2),Vector3(3.7,FLOOR,8),Vector3(3.7,FLOOR,5.2),Vector3(2.3,FLOOR,2),
	Vector3(2.3,FLOOR,-.8),Vector3(2.3,FLOOR,-3.2),Vector3(-1.6,FLOOR,-3.2),Vector3(-1.6,FLOOR,-3),Vector3(-3.9,FLOOR,-3),
	Vector3(-1.6,FLOOR,-3),Vector3(-1.6,FLOOR,-9),Vector3(3.8,FLOOR,-9),Vector3(4.3,FLOOR,-6),
	Vector3(3,FLOOR,-6),Vector3(3,FLOOR,-1),Vector3(3,FLOOR,2),Vector3(4.8,FLOOR,4),Vector3(4.8,FLOOR,2.7),
	Vector3(4.8,-2.275,-1.85),Vector3(4.8,-2.275,-2.65),Vector3(.6,-2.275,-2.65),Vector3(.6,-2.275,-3.85),
	Vector3(.6,0,-8.4),Vector3(.6,0,-9.15),Vector3(3.8,0,-8.95)]
func build(lab_room: Node3D) -> void:
	room=lab_room;setup();name="LowerLaboratory"
	shell();stair_link();analytical_rooms();furnish_main();build_icp()
	var details:=preload("res://scripts/lower_lab_dressing.gd").new();add_child(details);details.build()
	call_deferred("batch_static");call_deferred("isolate_local_lighting")
func isolate_local_lighting() -> void:
	for mesh in find_children("*","GeometryInstance3D",true,false):mesh.layers=2
	for light in find_children("*","Light3D",true,false):light.light_cull_mask=2
func shell() -> void:
	box(Vector3(4,FLOOR-.15,0),Vector3(20,.3,24),floor_surface,true)
	for x in [-6,14]:box(Vector3(x,FLOOR+2.15,0),Vector3(.18,4.3,24),concrete,true)
	for z in [-12,12]:box(Vector3(4,FLOOR+2.15,z),Vector3(20,4.3,.18),concrete,true)
	# Only the inward extension needs a separate ceiling; upstairs supplies the rest.
	var ceiling:=box(Vector3(10,-.15,0),Vector3(8,.3,24),concrete,true);ceiling.set_meta("review_roof",true);ceiling.set_meta("dynamic",true)
	for z in [-9,-3,3,9]:
		for x in [-3,3]:task_light(Vector3(x,-.65,z),Color(.70,.75,.70),1.85)
	for x in [-5.6,5.8]:
		for y in [-.55,-.8]:tube(Vector3(x,y,-11.5),Vector3(x,y,11.5),.06,metal)
	for z in [-9,-3,3,9]:box(Vector3(0,-.4,z),Vector3(11.6,.12,.18),worn)
func stair_link() -> void:
	var stairs:=preload("res://scripts/plant_access.gd").new();stairs.name="InteriorLabStairs";stairs.set_meta("dynamic",true);add_child(stairs);stairs.init_materials()
	stairs.stairs(STAIR_TOP,Vector3(.6,-2.275,-3.85),1.2)
	# Cross-landing below the upper floor; two distinct flights remain inside Lab B.
	stairs.landing(Vector3(2.7,-2.275,-2.85),Vector2(6,2.0))
	stairs.guard(Vector3(-.3,-2.275,-1.85),Vector3(3.9,-2.275,-1.85))
	stairs.guard(Vector3(1.2,-2.275,-3.85),Vector3(5.7,-2.275,-3.85))
	stairs.guard(Vector3(-.3,-2.275,-3.85),Vector3(-.3,-2.275,-1.85))
	stairs.guard(Vector3(5.7,-2.275,-3.85),Vector3(5.7,-2.275,-1.85))
	stairs.stairs(Vector3(4.8,-2.275,-1.85),STAIR_FOOT,1.8)
	# Full-height sides prevent jumping around the locked upper barrier.
	for x in [-.1,1.3]:
		box(Vector3(x,1.45,-6.05),Vector3(.08,2.9,4.7),glass,true)
		for z in [-8.4,-3.7]:box(Vector3(x,1.45,z),Vector3(.10,2.9,.10),metal,true)
	box(Vector3(.6,1.45,-3.7),Vector3(1.4,2.9,.08),glass,true)
	stairs.call_deferred("batch_static")
	gate=StaticBody3D.new();gate.name="InteriorStairGate";gate.position=STAIR_TOP;gate.set_meta("dynamic",true)
	gate.set_meta("interaction","lower_gate");gate.set_meta("title","Open lower laboratory door");add_child(gate)
	var shape:=CollisionShape3D.new();var slab:=BoxShape3D.new();slab.size=Vector3(1.32,2.9,.16);shape.shape=slab;shape.position.y=1.45;gate.add_child(shape)
	var first:=assembly_start()
	box(STAIR_TOP+Vector3(0,1.45,0),Vector3(1.32,2.9,.10),glass)
	for x in [-.01,1.21]:box(Vector3(x,1.45,-8.4),Vector3(.08,2.9,.15),metal)
	for y in [.08,1.15,2.85]:box(Vector3(.6,y,-8.4),Vector3(1.32,.07,.15),metal)
	plaque("LOWER LAB B\nSECURED STAIR ENTRANCE",Vector3(.6,1.85,-8.50),Vector2(1.18,.48),PI,true)
	for n in get_children().slice(first):n.reparent(gate)
	door_status=label_at("PRESS E / OPEN DOOR",Vector3(.6,3.07,-8.5),22,Color(.85,.39,.17),.002);door_status.rotation.y=PI
	task_light(Vector3(.6,3.3,-8.9));task_light(Vector3(3.2,-.65,-2.4))
	plaque("LOWER LAB B   /   ICP-MS  ←",Vector3(4.8,-1.7,5.2),Vector2(2.8,.35),PI,true)
func unlock() -> void:
	unlocked=true;gate.set_meta("title","Lower Lab B stairs · opening");door_status.text="LOWER LAB B / STAIRS OPEN";door_status.modulate=Color(.6,.85,.64)
func _process(delta: float) -> void:
	if room==null or room.get_parent().paused:return
	if unlocked and not opened:
		gate.position.y=move_toward(gate.position.y,3.25,delta*1.2);opened=gate.position.y>=3.25
		if opened:gate.set_meta("title","Lower Lab B stairs · open")
func analytical_rooms() -> void:
	# Drawing upper-left: gamma; immediately alongside it, weighing.
	box(Vector3(2,FLOOR+2,9),Vector3(.14,4,6),painted,true)
	for span in [[-3.4,5.2],[1.6,.8]]:box(Vector3(span[0],FLOOR+2,6),Vector3(span[1],4,.14),painted,true)
	plaque("GAMMA SPECTROSCOPY",Vector3(0,-1.55,5.9),Vector2(2.6,.35),PI,true)
	bench(Vector3(-5.3,FLOOR,9),4.1,PI/2)
	for z in [8,10]:
		cylinder(Vector3(-5.25,FLOOR+1.55,z),.48,.9,worn);cylinder(Vector3(-5.25,FLOOR+2.06,z),.37,.14,metal)
		box(Vector3(-4.65,FLOOR+1.27,z),Vector3(.30,.25,.6),rubber)
	cabinet(Vector3(-2.6,FLOOR,11.4),2.3,false,PI)
	box(Vector3(-3.5,FLOOR+2,.5),Vector3(5,4,.14),painted,true)
	for span in [[1.5,2.0],[5.35,1.3]]:box(Vector3(-1,FLOOR+2,span[0]),Vector3(.14,4,span[1]),painted,true)
	plaque("WEIGHING ROOM",Vector3(-.9,-1.55,3.6),Vector2(2.3,.35),PI/2,true)
	bench(Vector3(-5.3,FLOOR,3.4),3.7,PI/2)
	for z in [2.5,4.3]:instrument(Vector3(-5.2,FLOOR+1.14,z))
	cabinet(Vector3(-2.5,FLOOR,5.5),1.7,true,PI)
	# Gowning occupies the drawing's left-hand connector between gamma and ICP.
	for span in [[2.55,.7],[5.45,1.5]]:box(Vector3(span[0],FLOOR+1.2,6.3),Vector3(span[1],2.4,.12),painted,true)
	bench(Vector3(2.7,FLOOR,10.7),1.8,PI/2)
	box(Vector3(4.4,FLOOR+.28,10.4),Vector3(.45,.56,2.2),painted,true)
	for z in [8.2,8.9,9.6]:
		box(Vector3(2.15,FLOOR+2,z),Vector3(.07,.94,.44),cream)
		tube(Vector3(2.15,FLOOR+2.4,z-.23),Vector3(2.15,FLOOR+2.4,z+.23),.025,metal)
	plaque("CLEAN ROOM ENTRY / GOWNING",Vector3(4.2,-1.55,6.2),Vector2(3.7,.32),PI,true)
	for data in [["geiger_tick",Vector3(-4,-3,9),-32.0],["hvac",Vector3(10,-1,0),-20.0]]:
		var audio:=AudioStreamPlayer3D.new();audio.stream=load("res://art/audio/phase6/"+data[0]+".wav").duplicate()
		audio.stream.loop_mode=AudioStreamWAV.LOOP_FORWARD;audio.stream.loop_end=int(audio.stream.get_length()*audio.stream.mix_rate)
		audio.position=data[1];audio.volume_db=data[2];audio.unit_size=2;audio.max_distance=7;audio.bus="LabEnvironment";add_child(audio);audio.play()
func furnish_main() -> void:
	# Sample table above the stairs in the supplied drawing.
	var first:=assembly_start()
	bench(Vector3.ZERO,3.0);bottle_row(Vector3(0,1.14,0),7,.30)
	for x in [-.7,0,.7]:
		box(Vector3(x,1.15,.35),Vector3(.38,.035,.25),metal)
		for i in 6:cylinder(Vector3(x-.14+i*.052,1.19,.35),.022,.025,amber)
	plaque("SAMPLE TABLE / POWDER & PELLETS",Vector3(0,1.85,.35),Vector2(2.7,.23),0,true)
	place(first,Vector3(.2,FLOOR,-1),PI/2)
	# Workbench strip directly outside the long glazed analytical room.
	for z in [-8.3,-5.2]:
		bench(Vector3(5.55,FLOOR,z),2.8,-PI/2);instrument(Vector3(5.4,FLOOR+1.14,z),"COULOMETER");coulometer_count+=1
	plaque("KARL FISCHER / COULOMETRY",Vector3(6.05,-1.55,-6.8),Vector2(5,.36),-PI/2,true)
	var hoods:=preload("res://scripts/environment_dressing.gd").new();add_child(hoods);hoods.init_materials();hoods.set_meta("dynamic",true)
	for x in [-1,2]:
		bench(Vector3(x,FLOOR,-11.15),2.45)
		hoods.build_hood(Vector3(x,FLOOR+1.14,-11.15),0,room);hood_count+=1
	hoods.call_deferred("batch_static")
	# Additional area is occupied by preparation bays, not an oversized empty centre.
	bench(Vector3(-5.25,FLOOR,-3.3),4.3,PI/2);bottle_row(Vector3(-5.1,FLOOR+1.14,-3.3),4,.25)
	cabinet(Vector3(-5.45,FLOOR,-8.4),3.1,true,PI/2)
	box(Vector3(-2.8,FLOOR+.65,-7),Vector3(.14,1.3,4.0),painted,true)
	plaque("POWDER / SAMPLE PREPARATION",Vector3(-2.7,-2.35,-7),Vector2(3.3,.3),PI/2,true)
	cart(Vector3(-3.8,FLOOR,-5.8));cabinet(Vector3(-3.5,FLOOR,-.1),2.1,false)
func build_icp() -> void:
	# Clean suite forms the full lower edge of the drawing, on arrival LEFT (+X).
	var clean:=material(Color(.76,.80,.81),.08,.44)
	var clean_floor:=material(Color(.40,.50,.52),.05,.70)
	var clean_frame:=material(Color(.70,.75,.77),.6,.28)
	box(Vector3(10.1,FLOOR+.012,0),Vector3(7.8,.024,23.8),clean_floor)
	box(Vector3(13.88,FLOOR+2.1,0),Vector3(.035,4.2,23.8),clean)
	for z in [-11.88,11.88]:box(Vector3(10.1,FLOOR+2.1,z),Vector3(7.8,4.2,.035),clean)
	var roof:=box(Vector3(10.1,-.35,0),Vector3(7.8,.08,23.8),clean);roof.set_meta("review_roof",true);roof.set_meta("dynamic",true)
	var viewing_glass:=material(Color(.74,.85,.89,.075),.08,.13)
	box(Vector3(6.2,FLOOR+.28,0),Vector3(.12,.56,24),clean,true)
	box(Vector3(6.2,FLOOR+2.38,0),Vector3(.035,3.6,24),viewing_glass,true)
	for z in [-12,-8,-4,0,4,8,12]:box(Vector3(6.2,FLOOR+2.1,z),Vector3(.10,4.2,.07),clean_frame)
	box(Vector3(6.2,-.35,0),Vector3(.18,.18,24),clean_frame)
	box(Vector3(6.17,FLOOR+1.5,9.5),Vector3(.055,3,1.5),glass,true)
	plaque("ICP-MS / CLEAN ANALYTICAL SUITE",Vector3(6.08,-.85,1.8),Vector2(5.5,.4),-PI/2,true)
	plaque("CONTROLLED ENTRY / LOCKED",Vector3(6.05,-2.1,9.5),Vector2(1.9,.3),-PI/2,true)
	var saved_painted:=painted;var saved_worn:=worn;var saved_plastic:=plastic;var saved_metal:=metal
	painted=clean;worn=material(Color(.62,.69,.71),.2,.48);plastic=material(Color(.86,.88,.85),0,.4);metal=clean_frame
	for z in [9,3,-3,-9]:
		var first:=assembly_start();var p:=Vector3.ZERO;icp_count+=1
		bench(p+Vector3(0,0,1.5),3.2)
		box(p+Vector3(0,1.15,0),Vector3(2.6,2.3,1.5),painted,true)
		# Service panels, sample interface and status display define an analytical instrument.
		box(p+Vector3(-.48,.65,-.77),Vector3(1.42,.9,.045),plastic)
		for side in [-1,1]:
			box(p+Vector3(-.48+side*.57,.65,-.81),Vector3(.025,.72,.025),metal)
			for y in [.3,1.0]:cylinder(p+Vector3(-.48+side*.61,y,-.805),.018,.025,metal)
		box(p+Vector3(-.48,.68,-.83),Vector3(.48,.045,.045),rubber)
		box(p+Vector3(1.09,1.3,-.82),Vector3(.34,.37,.15),plastic)
		box(p+Vector3(1.09,1.32,-.91),Vector3(.24,.20,.02),dark)
		box(p+Vector3(1.75,.79,-.40),Vector3(.76,.10,.86),metal)
		for a in range(8):
			var q:=p+Vector3(1.75+cos(a*TAU/8)*.24,.88,-.40+sin(a*TAU/8)*.24)
			cylinder(q,.033,.16,glass)
		cable([p+Vector3(1.1,1.15,-.95),p+Vector3(1.5,1.05,-1),p+Vector3(1.75,.95,-.40)],rubber,.015)

		box(p+Vector3(-.55,1.75,-.77),Vector3(1.3,.85,.04),dark)
		box(p+Vector3(-.55,1.75,-.80),Vector3(1.12,.62,.03),material(Color(.07,.22,.27),.35,.3,.3))
		for row in range(4):box(p+Vector3(-.7,1.56+row*.10,-.825),Vector3(.57-row*.09,.025,.006),material(Color(.3,.7,.68),0,.8,.3))
		for i in 6:box(p+Vector3(.85,.5+i*.14,-.78),Vector3(.55,.04,.03),rubber)
		cylinder(p+Vector3(.72,2.42,0),.26,.35,metal)
		tube(p+Vector3(.72,2.5,0),p+Vector3(.72,4.1,0),.16,metal)
		box(p+Vector3(-1.50,.9,-.3),Vector3(.38,1.8,.8),worn)
		imported_prop("Prop_Computer",p+Vector3(-.5,1.13,1.5),1.0,painted)
		bottle_row(p+Vector3(.70,1.14,1.5),4,.22)
		plaque("ICP-MS / "+str(icp_count),p+Vector3(0,2.1,-.81),Vector2(1.1,.22),PI,true)
		task_light(p+Vector3(0,3.7,-1),Color(.95,.97,1.0),5.5)
		var assembly:=place(first,Vector3(10.3,FLOOR,z),PI/2);assembly.name="ICPInstrument"+str(icp_count)
	painted=saved_painted;worn=saved_worn;plastic=saved_plastic;metal=saved_metal
