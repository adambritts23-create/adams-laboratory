extends "res://scripts/lab_props.gd"
var hall: Node3D
var moving_drum: Node3D
var clock:=0.0
var vacuum_paths:=0
var utility_paths:=0
var small_tanks:=0
var connected_feeds:=0
func build(facility: Node3D) -> void:
	hall=facility;init_materials();set_meta("dynamic",true)
	metal=hall.metal;worn=hall.steel;brass=hall.safety
	build_utilities()
	build_vacuum_header()
	build_skids()
	build_packaging()
	build_details()
	call_deferred("batch_static")

func line(points: Array, radius: float, mat: Material) -> void:
	hall.pipe_path(points,radius,mat)
	utility_paths+=1

func build_utilities() -> void:
	# Shared racks visibly link districts. They deliberately carry no real process logic.
	for i in 5:
		var y: float=14.3+i*.38
		line([Vector3(-7,y,-13),Vector3(-52,y,-13),Vector3(-52,y,22),Vector3(-60,y,22),Vector3(-60,y,32)],.15+i*.035,metal if i%2 else hall.rust)
	for x in [-12,-23,-34,-45,-52]:
		box(Vector3(x,14,-13),Vector3(.24,.24,4.5),worn)
		for z in [-15,-11]: tube(Vector3(x,14,z),Vector3(x,19,z),.045,metal)
	for i in hall.vessel_positions.size():
		var p: Vector3=hall.vessel_positions[i]
		var r: float=[4.4,3.3,2.8][i]
		var h: float=[9.6,8,11][i]
		line([Vector3(p.x-r-2,14.3,-13),Vector3(p.x-r-2,14.3,p.z),p+Vector3(-r-2,h+3,0)],.16,metal)
		connected_feeds+=1
		# Lower service pipes wrap around, meet a pump skid, then rise to the shared rack.
		line([p+Vector3(r,.8,0),p+Vector3(r+1.3,.8,0),p+Vector3(r+1.3,.8,-3),p+Vector3(r+1.3,4,-3),Vector3(p.x+r+1.3,14.3,-13)],.18,hall.rust)
	for x in [-46,-56]:
		line([Vector3(x,14.68,-13),Vector3(x,14.68,-37),Vector3(x,5.7,-37)],.22,metal)
	# Cable trays share a continuous path but remain separate from the pipe silhouettes.
	for seg in [[Vector3(-9,6.4,6),Vector3(-35,6.4,6)],[Vector3(-35,6.4,6),Vector3(-35,6.4,-26)],[Vector3(-35,6.4,6),Vector3(-56,6.4,6)]]:
		var a: Vector3=seg[0];var b: Vector3=seg[1];var dir: Vector3=(b-a).normalized();var side:=dir.cross(Vector3.UP)*.4
		for s in [-1,1]: tube(a+side*s,b+side*s,.07,worn)
		for i in int(a.distance_to(b)/.35):
			var p:=a.lerp(b,i*.35/a.distance_to(b))
			tube(p-side,p+side,.026,metal)
		for s in [-.25,0,.25]: tube(a+side*s,b+side*s,.035,rubber)

func build_vacuum_header() -> void:
	for x in [-39,-47]:
		for z in [-9,0,9]:
			var p:=Vector3(x,-2.65,z)
			cylinder(p,2.85,.75,worn,.68)
			ring(p-Vector3.UP*.37,2.86,.06,metal)
			line([p+Vector3.UP*.4,Vector3(x,7.2,z),Vector3(-42,7.2,z)],.55,worn)
			vacuum_paths+=1
	line([Vector3(-42,7.2,-10),Vector3(-42,7.2,22),Vector3(-60,7.2,22)],.78,hall.rust)
	for x in [-38,-48,-58]:
		line([Vector3(x,7.2,22),Vector3(x,5.6,22)],.63,worn)
		vacuum_paths+=1
	for z in [-8,0,8,20]:
		for x in [-43,-41]: tube(Vector3(x,6.7,z),Vector3(x,12,z),.055,metal)
		box(Vector3(-42,6.4,z),Vector3(2.4,.23,.3),worn)
	for x in [-40,-48,-56]:
		box(Vector3(x,6.25,22),Vector3(.35,.25,2.6),worn)
		tube(Vector3(x,6.25,20.8),Vector3(x,12,20.8),.055,metal)
	plaque("VACUUM / EXHAUST HEADER",Vector3(-41.15,6.9,5),Vector2(4,.6),PI/2)
	var source:=AudioStreamPlayer3D.new();source.stream=hall.district_audio[2].stream
	source.position=Vector3(-42,7.2,1);source.volume_db=-16;source.unit_size=4;source.max_distance=23
	source.pitch_scale=1.17;source.bus="LabEnvironment";add_child(source);source.play()

func build_skids() -> void:
	for p in [Vector3(-22,-6,4.5),Vector3(-20,-6,-15),Vector3(-32,-6,-23),Vector3(-45,-6,3),Vector3(-43,-6,25)]:
		box(p+Vector3.UP*.18,Vector3(3.2,.36,2.8),hall.rust,true)
		cylinder(p+Vector3(0,2,0),.95,3.2,worn)
		ellipsoid(p+Vector3(0,3.65,0),Vector3(.95,.25,.95),metal)
		for y in [.6,3.4]: ring(p+Vector3.UP*y,.98,.055,metal)
		hall.collision_cylinder(p+Vector3.UP*2,.99,3.8)
		line([p+Vector3(0,3.9,0),p+Vector3(0,7.8,0),Vector3(p.x,1.8,-13)],.115,metal)
		pump(p+Vector3(1.2,.4,.8))
		gauge(p+Vector3(.55,2.8,.85),.16)
		hall.valve_wheel(p+Vector3(1.2,1.5,.8),.3)
		small_tanks+=1

func pump(p: Vector3) -> void:
	box(p,Vector3(1.1,.2,.8),worn,true)
	cylinder(p+Vector3.UP*.4,.29,1,painted).rotation.z=PI/2
	for i in 7: ring(p+Vector3(-.43+i*.14,.4,0),.3,.024,metal).rotation.z=PI/2
	line([p+Vector3(-.6,.4,0),p+Vector3(-.8,.4,0),p+Vector3(-.8,1.2,0)],.12,metal)
	hall.collision_box(p+Vector3.UP*.45,Vector3(1.4,.9,1))

func build_packaging() -> void:
	var first:=get_child_count()
	var center:=Vector3(-24,-6,25.8)
	box(center+Vector3.UP*.9,Vector3(10,.15,1.5),worn,true)
	for x in [-28,-24,-20]:
		for z in [-.6,.6]: box(Vector3(x,-5.55,25.8+z),Vector3(.16,.9,.16),metal,true)
	for i in 28: cylinder(center+Vector3(-4.7+i*.35,1.03,0),.075,1.38,metal).rotation.x=PI/2
	for z in [-.85,.85]: tube(center+Vector3(-5,1.1,z),center+Vector3(5,1.1,z),.055,brass)
	box(Vector3(-26,-3.3,25.8),Vector3(2.1,.28,2.0),worn)
	for z in [24.85,26.75]: box(Vector3(-26,-4.4,z),Vector3(.2,2.6,.2),brass,true)
	imported_prop("Prop_Computer",Vector3(-27,-4.9,24.6),1.2,painted)
	moving_drum=imported_prop("Prop_Barrel_Large",Vector3(-23,-4.92,25.8),.75,metal)
	moving_drum.set_meta("dynamic",true)
	for x in [-21,-28]: imported_prop("Prop_Barrel_Large",Vector3(x,-4.92,25.8),.75,painted)
	plaque("☢  URANIUM PRODUCT / DRUM LINE\nNIGHT SHIFT · SEALED UNITS",Vector3(-24,-2.3,26),Vector2(7,1.1),PI,true)
	# A pallet jack built around authored cargo; no operational handling guidance.
	box(Vector3(-18.7,-5.8,27.5),Vector3(.85,.18,.6),hall.rust,true)
	for x in [-19,-18.45]: box(Vector3(x,-5.8,28.3),Vector3(.18,.12,1.6),brass,true)
	tube(Vector3(-18.7,-5.6,27.4),Vector3(-18.7,-4.5,27.1),.06,metal)
	tube(Vector3(-19,-4.5,27.1),Vector3(-18.4,-4.5,27.1),.06,rubber)
	hall.fixture(Vector3(-51,-.5,25.5),false,11)

	for n in get_children().slice(first):
		if n is Node3D: n.position+=Vector3(-27,0,.7)

func build_details() -> void:
	for p in [Vector3(-18,-6,-10),Vector3(-19,-6,5),Vector3(-29,-6,-18),Vector3(-43,-6,12),Vector3(-53,-6,12),Vector3(-40,-6,-26)]:
		box(p+Vector3.UP*.9,Vector3(.75,1.8,.38),painted,true)
		box(p+Vector3(0,1.22,.20),Vector3(.5,.4,.03),dark)
		for x in [-.16,0,.16]: cylinder(p+Vector3(x,1.35,.24),.035,.04,green if x==0 else red).rotation.x=PI/2
		gauge(p+Vector3(.05,.92,.23),.10)
		for x in [-.26,.26]: tube(p+Vector3(x,1.85,0),p+Vector3(x,6.4,0),.022,metal)
		ring(p+Vector3(.65,.9,0),.36,.07,rubber).rotation.z=PI/2
		for i in 4: ring(p+Vector3(.56+i*.06,.9,0),.34,.025,rubber).rotation.z=PI/2
		line([p+Vector3(.65,.7,0),p+Vector3(.65,.1,1),p+Vector3(.65,.1,2)],.038,rubber)
		plaque("LOCAL / SERVICE",p+Vector3(0,1.68,.22),Vector2(.65,.17),0)
		if int(p.x)%2==0: hall.room_ref.mist(p+Vector3(1,2.2,-1),.35)
	# Smaller branch runs along equipment faces, plus tee-like utility drops.
	for z in [-18,4,22]:
		for i in 3:
			line([Vector3(-29,-3.5+i*.3,z),Vector3(-44,-3.5+i*.3,z),Vector3(-44,8.5,z)],.075,metal)
	for z in [-16,2,20]:
		for x in [-18,-42]:
			box(Vector3(x,-5.98,z),Vector3(2,.04,.55),dark)
			for i in 12: box(Vector3(x-.9+i*.16,-5.95,z),Vector3(.04,.025,.52),metal)
	# Close-view fixtures on the accessible route, rather than uniform hall fill.
	for p in [Vector3(-13,3,9.5),Vector3(-30,7,-16),Vector3(-37,7,12),Vector3(-16,-1.7,20)]: hall.fixture(p,false,7)

func _process(delta: float) -> void:
	if hall.room_ref.get_parent().paused: return
	clock+=delta
	moving_drum.position.x=-50.5+sin(clock*.18)*1.0

