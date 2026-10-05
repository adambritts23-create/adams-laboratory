extends "res://scripts/lab_props.gd"
# Environmental composition only. No process graph, operating controls or recipes.
const DECK := -6.0
const RESPONSE_DURATION := 72.0
var access: Node3D
var feed_streams: Array[MeshInstance3D]=[]
var feed_roots: Array[Vector3]=[]
var feed_liquids: Array[Node3D]=[]
var vessel_positions: Array[Vector3]=[]
var liquid: Node3D
var deposit: Node3D
var glow: OmniLight3D
var response := 0.0
var agitator: Node3D
var focus := Vector3(-19,1,-6.7)
var settled := false
var room_ref: Node3D
var companion_liquids: Array[Node3D] = []
var process_lights: Array[OmniLight3D] = []
var rotors: Array[Node3D] = []
var district_audio: Array[AudioStreamPlayer3D] = []
var districts := {}
var steel: Material
var rust: Material
var safety: Material
var ivory: Material
var clock := 0.0
var event_clock := 9.0
var event_voice: AudioStreamPlayer3D
var static_instances := 0

func build(room: Node3D) -> void:
	init_materials()
	room_ref=room
	set_meta("dynamic",true)
	steel=pbr_surface("blue_metal_plate",Color(.72,.75,.69),.30,.57,.32)
	metal=material(Color(.46,.49,.47),.38,.36)
	rust=pbr_surface("rusty_metal_02",Color(.72,.57,.40),.5,.78,.48)
	safety=material(Color(.51,.34,.065),.5,.46)
	ivory=material(Color(.59,.61,.53),.22,.61)
	build_hall()
	build_lab_annex()
	districts["vessels"]=Vector3(-23,DECK,-4.6)
	build_vessel(Vector3(-23,DECK,-4.6),4.4,9.6,true)
	build_vessel(Vector3(-26,DECK,13.5),3.3,8.0,false)
	build_vessel(Vector3(-26,DECK,-23),2.8,11.0,false)
	shift_district("build_tanks",["tanks"],Vector3(12,0,-8))
	shift_district("build_filters",["filters"],Vector3(2,0,0))
	shift_district("build_furnaces",["furnaces"],Vector3(10,0,-3))
	shift_district("build_storage_district",["storage","restricted"],Vector3(0,0,0))
	build_pipe_racks()
	build_audio()
	var detail:=preload("res://scripts/plant_density.gd").new()
	add_child(detail);detail.build(self)
	access=preload("res://scripts/plant_access.gd").new()
	add_child(access);access.build(self)
	var geography:=preload("res://scripts/plant_geography.gd").new()
	add_child(geography);geography.build(self)
	var world: WorldEnvironment
	for child in room.get_parent().get_children():
		if child is WorldEnvironment:
			world=child
	if world:
		world.environment.fog_enabled=true
		world.environment.fog_density=.006
		world.environment.fog_light_color=Color(.065,.079,.085)
		world.environment.fog_light_energy=.35
	var probe:=ReflectionProbe.new()
	probe.position=Vector3(-28,1,-4)
	probe.size=Vector3(38,23,51)
	probe.interior=true;probe.box_projection=true;probe.intensity=.65;probe.max_distance=65
	add_child(probe)
	call_deferred("batch_facility")

func light_at(p: Vector3, tint: Color, power: float, reach: float) -> OmniLight3D:
	var l:=OmniLight3D.new()
	l.position=p;l.light_color=tint;l.light_energy=power;l.omni_range=reach
	add_child(l)
	return l

func fixture(p: Vector3, warm: bool=false, reach: float=13.0) -> void:
	box(p,Vector3(1.7,.18,.48),dark)
	box(p+Vector3(0,-.10,0),Vector3(1.45,.035,.31),material(Color(.95,.39,.12) if warm else Color(.64,.76,.81),0,.4,3.0))
	light_at(p+Vector3(0,-.4,0),Color(1,.25,.055) if warm else Color(.63,.76,.86),2.3 if warm else 3.5,reach)

func pipe_path(points: Array, radius: float, mat: Material) -> void:
	for i in range(points.size()-1):
		var a: Vector3=points[i]
		var b: Vector3=points[i+1]
		tube(a,b,radius,mat)
		var direction: Vector3=(b-a).normalized()
		for t in [.12,.83]:
			var flange:=ring(a.lerp(b,t),radius*1.27,radius*.14,metal)
			flange.quaternion=Quaternion(Vector3.UP,direction)
		if i>0: ellipsoid(a,Vector3.ONE*radius*1.025,mat)

func rail(a: Vector3, b: Vector3) -> void:
	for y in [.55,1.1]: tube(a+Vector3.UP*y,b+Vector3.UP*y,.035,safety)
	var count:=maxi(1,int(a.distance_to(b)/1.8))
	for i in count+1:
		var p:=a.lerp(b,float(i)/count)
		tube(p,p+Vector3.UP*1.13,.043,safety)
	box((a+b)*.5+Vector3.UP*.1,Vector3(.075,.18,a.distance_to(b)),steel).rotation.y=atan2(b.x-a.x,b.z-a.z)

func walkway(a: Vector3, b: Vector3, width: float=1.8) -> void:
	var along: Vector3=(b-a).normalized()
	var side:=along.cross(Vector3.UP)*width*.5
	var length:=a.distance_to(b)
	# Narrow center strip and open edge grating reveal machinery underneath.
	var deck:=box((a+b)*.5,Vector3(width,.14,length),dark,true)
	deck.rotation.y=atan2(along.x,along.z)
	for s in [-1,1]:
		tube(a+side*s,b+side*s,.09,steel)
		rail(a+side*s,b+side*s)
		var barrier:=collision_box((a+b)*.5+side*s+Vector3.UP*.58,Vector3(.085,1.16,length))
		barrier.rotation.y=atan2(along.x,along.z)
	for i in int(length/.28):
		var p:=a.lerp(b,float(i)/maxf(1,length/.28))
		tube(p-side,p+side,.025,metal)

func ladder(p: Vector3, height: float) -> void:
	for z in [-.36,.36]: tube(p+Vector3(0,0,z),p+Vector3(0,height,z),.045,metal)
	for i in int(height/.3): tube(p+Vector3(0,i*.3,-.36),p+Vector3(0,i*.3,.36),.026,metal)
	for i in range(2,int(height)):
		var hoop:=ring(p+Vector3(-.4,i,0),.62,.025,safety)
		hoop.scale.z=.75

func build_hall() -> void:
	name="ConversionHall"
	for z in [-27,27]: box(Vector3(-6,8,z),Vector3(.5,28,30),concrete,true)
	box(Vector3(-6,13,0),Vector3(.5,18,24),concrete,true)
	var floor_mat:=ShaderMaterial.new()
	floor_mat.shader=preload("res://materials/concrete_floor.gdshader")
	for map in ["albedo","normal","roughness"]:
		var suffix: String={"albedo":"diff","normal":"nor_gl","roughness":"rough"}[map]
		floor_mat.set_shader_parameter(map+"_map",load("res://art/environment/concrete_floor_02_"+suffix+"_1k.jpg"))
	for x in 6:
		for z in 7: box(Vector3(-77.5+x*13,DECK-.25,-36+z*12),Vector3(13,.5,12),floor_mat,true)
	box(Vector3(-84,8,0),Vector3(.7,28,84),concrete,true)
	box(Vector3(-45,22,0),Vector3(79,.6,84),dark)
	for z in [-42,42]: box(Vector3(-45,8,z),Vector3(79,28,.7),concrete,true)
	for z in range(-36,43,12):
		box(Vector3(-83.55,-3,z),Vector3(.12,5.5,11.7),painted)
		box(Vector3(-83.50,8,z-5.9),Vector3(.18,28,.12),dark)
		plaque("BAY %02d"%int((z+48)/12),Vector3(-83.3,7,z),Vector2(6,1.6),PI/2)
	for z in range(-36,43,12):
		for x in [-9,-39,-79]:
			box(Vector3(x,8,z),Vector3(.7,28,.9),steel)
			for y in [-3,4,11,18]:
				var col:=imported_prop("Column_MetalSupport",Vector3(x,y,z),1.18,rust)
				col.scale.x=.6;col.scale.z=.6
		box(Vector3(-44,19,z),Vector3(72,.55,.5),steel)
		box(Vector3(-44,16.5,z),Vector3(72,.25,.24),steel)
		for x in range(-78,-9,6): tube(Vector3(x,16.5,z),Vector3(x+6,19,z),.11,steel)
		if z%24==0:
			fixture(Vector3(-34,13,z),false,20)
			fixture(Vector3(-75,7,z),true,13)
	for x in [-12,-37,-70]:
		box(Vector3(x,DECK+.012,0),Vector3(.65,.025,80),rubber)
		for z in range(-40,40): box(Vector3(x,DECK+.035,z),Vector3(.64,.035,.055),metal)
	for i in 33:
		var x: float=-11-fmod(i*13.73,69)
		var z: float=-37+fmod(i*17.1,74)
		room_ref.puddle(Vector3(x,DECK+.045,z),Vector2(1.1+fmod(i*.8,2),1.5+fmod(i*.73,3)))
	for z in [-9,-2,6]: room_ref.puddle(Vector3(-17,DECK+.047,z),Vector2(2,3))
	for y in [1.0,9.0]:
		var near_level: float=-2.0 if y==1.0 else y
		walkway(Vector3(-11,near_level,-36),Vector3(-11,near_level,36))
		walkway(Vector3(-73,y,-36),Vector3(-73,y,36))
		walkway(Vector3(-73,y,30),Vector3(-11,y,30),2.0)
	for p in [Vector3(-12,DECK,27),Vector3(-73,DECK,-30)]: ladder(p,16)
	for x in [-12,-72]:
		for y in [-6,-3.2,1,3.8,6.6]:
			var stairs:=imported_prop("Platform_Stairs_4",Vector3(x,y,22+y),1.0,steel)
			stairs.rotation.y=PI/2
	for z in [-31,32]: box(Vector3(-44,18,z),Vector3(72,.7,.65),rust)
	box(Vector3(-31,17.5,0),Vector3(2.3,1.3,64),safety)
	box(Vector3(-31,16.6,-9),Vector3(3.3,1.5,3.2),rust)
	for z in [-9.2,-8.8]: tube(Vector3(-31,16,z),Vector3(-31,9,z),.035,metal)
	ring(Vector3(-31,8.7,-9),.4,.09,metal).rotation.x=PI/2
	for z in [-40,40]:
		box(Vector3(-58,1,z),Vector3(8,14,.6),rubber)
		imported_prop("Door_DarkMetal",Vector3(-58,DECK,z*.995),2.7,rust)
		plaque("SERVICE TUNNEL / RESTRICTED",Vector3(-58,8,z*.98),Vector2(7,.9),PI if z>0 else 0,true)
		fixture(Vector3(-58,7,z*.92),true,12)

func build_lab_annex() -> void:
	# Lower powder room establishes the two-storey annex, beyond playable Lab B.
	box(Vector3(0,-4.7,0),Vector3(12,.3,24),concrete)
	box(Vector3(0,-2.3,-12),Vector3(12,4.6,.2),concrete)
	box(Vector3(-6,-2.5,0),Vector3(.1,3.8,24),glass)
	for z in range(-12,13,3): box(Vector3(-6.1,-2.3,z),Vector3(.24,4.6,.2),steel)
	# Functional lower-floor furnishings are owned by lower_lab.gd.
	box(Vector3(-5.9,-.65,0),Vector3(.4,.8,24),concrete)
	plaque("LAB B / WET CHEMISTRY",Vector3(-6.3,3.0,-4.5),Vector2(6,.7),-PI/2)
	plaque("POWDER LAB / LOWER LEVEL",Vector3(-6.3,-1.4,-4.5),Vector2(6,.6),-PI/2)

func build_vessel(p: Vector3, r: float, h: float, principal: bool) -> void:
	vessel_positions.append(p)
	collision_cylinder(p+Vector3.UP*(h*.5+1.0),r+.1,h+2.0)
	cylinder(p+Vector3.UP*.95,r+.13,1.0,rust)
	cylinder(p+Vector3.UP*1.445,r-.18,.055,metal)
	cylinder(p+Vector3.UP*(h*.5+1.2),r,h,glass)
	cylinder(p+Vector3.UP*(h+.95),r+.15,.5,steel)
	cylinder(p+Vector3.UP*(h+.25),r+.025,.95,steel)
	ellipsoid(p+Vector3.UP*(h+1.25),Vector3(r,.55,r),steel)
	for y in [1.25,h*.48,h+.7]: ring(p+Vector3.UP*y,r+.08,.12,metal)
	for i in 16:
		var a:=i*TAU/16
		var off:=Vector3(cos(a)*r,0,sin(a)*r)
		tube(p+off+Vector3.UP*1.25,p+off+Vector3.UP*(h+.8),.095,steel)
		if i%2==0:
			box(p+off*.85+Vector3.UP*.5,Vector3(.55,1,.6),steel)
			box(p+off*.85+Vector3.UP*.07,Vector3(.9,.12,.9),rust)
	var v:=liquid_visual(p+Vector3.UP*1.46,r-.2,h-.6,Color(.16,.43,.012,.47),.8)
	v.fill_level=.58;v.apply_visuals()
	var feed_tip:=p+Vector3(r*.32,h+.35,0)
	pipe_path([p+Vector3(-r-2,h+3,0),p+Vector3(r*.32,h+3,0),feed_tip],.16,metal)
	var stream:=cylinder(feed_tip,.055,1,material(Color(.43,.60,.21,.65),0,.16,.25))
	stream.set_meta("dynamic",true);stream.hide()
	feed_streams.append(stream);feed_roots.append(feed_tip);feed_liquids.append(v)
	var l:=light_at(p+Vector3(r*.7,h*.62,0),Color(.53,.86,.06),3.6,r*2.7)
	process_lights.append(l)
	light_at(p+Vector3(-r*.3,h+2,0),Color(.55,.68,.75),2.5,r*2.0)
	# White inspection illumination keeps sediment legible after fluorescence ends.
	light_at(p+Vector3(r+1.8,4.2,2.8),Color(.82,.84,.70),3.2,r*2.2)
	box(p+Vector3(r+1.8,4.5,2.8),Vector3(.7,.12,.32),metal)
	box(p+Vector3(r+1.8,4.42,2.8),Vector3(.6,.025,.24),material(Color(.76,.8,.67),0,.5,2))
	var motor:=Node3D.new()
	add_child(motor);motor.position=p;motor.set_meta("dynamic",true)
	var before:=get_child_count()
	tube(p+Vector3.UP*1.6,p+Vector3.UP*(h+3.4),.13,metal)
	for j in 4:
		var a:=j*TAU/4
		tube(p+Vector3.UP*(h*.5),p+Vector3(cos(a)*r*.68,h*.5,sin(a)*r*.68),.10,metal)
	for n in get_children().slice(before): n.reparent(motor)
	cylinder(p+Vector3.UP*(h+2.3),.85,1.4,dark)
	for i in 10: ring(p+Vector3.UP*(h+1.68+i*.13),.85,.025,metal)
	box(p+Vector3.UP*(h+1.35),Vector3(2.7,.23,2.0),steel)
	for side in [-1,1]:
		var sp:=p+Vector3(side*(r+1.1),h+.8,-r-1.1)
		walkway(sp,sp+Vector3(0,0,2*r+2.2),1.6)
		pipe_path([p+Vector3(side*r,.9,0),p+Vector3(side*(r+1.7),.9,0),p+Vector3(side*(r+1.7),h+5,0),p+Vector3(side*(r+1.7),h+5,-r-4)],.28,steel if side>0 else rust)
	ladder(p+Vector3(r+1.9,0,r*.6),h+1)
	for z in [-r*.55,r*.55]:
		var q:=p+Vector3(r+1.1,1.3,z)
		box(q,Vector3(1.7,.25,1.1),steel)
		var pump:=cylinder(q+Vector3.UP*.4,.36,1.3,painted)
		pump.rotation.z=PI/2
		for k in 6: ring(q+Vector3(-.5+k*.18,.4,0),.37,.025,metal).rotation.z=PI/2
		gauge(q+Vector3(0,1.3,.3),.18)
		valve_wheel(q+Vector3(.8,1.0,0),.34)
	plaque("VESSEL B / URANIUM SOLUTION" if principal else "SOLUTION / SERVICE VESSEL",p+Vector3(r+.3,h*.75,0),Vector2(r*1.4,.75),PI/2)
	if principal:
		liquid=v;deposit=v.sediment;glow=l;agitator=motor
	else:
		companion_liquids.append(v);rotors.append(motor)
	room_ref.mist(p+Vector3(-r,h+2,0),1.3)

func valve_wheel(p: Vector3, r: float) -> void:
	ring(p,r,.035,safety).rotation.z=PI/2
	tube(p-Vector3.RIGHT*.24,p+Vector3.RIGHT*.24,.075,metal)
	for i in 4:
		var a:=i*TAU/4
		tube(p,p+Vector3(0,cos(a)*r,sin(a)*r),.024,safety)

func build_tanks() -> void:
	districts["tanks"]=Vector3(-64,DECK,-22)
	for row in 2:
		for col in 3:
			var p:=Vector3(-58-row*10,DECK,-29+col*8)
			var h: float=10.5+col*1.3-row*2
			var r: float=2.5-row*.35
			collision_cylinder(p+Vector3.UP*(h*.5+.5),r+.1,h+1)
			cylinder(p+Vector3.UP*(h*.5+.7),r,h,steel if col%2==0 else rust)
			ellipsoid(p+Vector3.UP*(h+.7),Vector3(r,.7,r),metal)
			for y in [1.0,h*.45,h*.9]: ring(p+Vector3.UP*y,r+.08,.08,metal)
			for z in [-1.5,1.5]: box(p+Vector3(0,.5,z),Vector3(1,1,.5),steel)
			pipe_path([p+Vector3(0,h+1,0),p+Vector3(0,h+3,0),p+Vector3(4,h+3,0),p+Vector3(4,1,0)],.22,metal)
			ladder(p+Vector3(r+.3,0,0),h+1)
			valve_wheel(p+Vector3(r+.5,1.4,1),.32)
			plaque("TANK %02d"%(row*3+col+1),p+Vector3(r+.05,h*.65,0),Vector2(2,.55),PI/2)
			fixture(p+Vector3(4,6,3),false,11)
	for z in [-33,-8]: walkway(Vector3(-73,4,z),Vector3(-53,4,z))
	box(Vector3(-61,-5.5,0),Vector3(14,.7,8),dark)
	for x in [-68,-54]: box(Vector3(x,-4,0),Vector3(.45,3,8),concrete)
	box(Vector3(-61,-4,-4),Vector3(14,3,.5),concrete)
	for x in [-64,-60,-56]: pipe_path([Vector3(x,-5,0),Vector3(x,8,0),Vector3(x,8,-13)],.18,steel)
	plaque("02 / TANK HALL",Vector3(-56,10,-5),Vector2(8,1.2),PI/2)

func build_filters() -> void:
	districts["filters"]=Vector3(-44,DECK,0)
	for row in 3:
		for col in 2:
			var p:=Vector3(-41-col*8,DECK,-9+row*9)
			collision_cylinder(p+Vector3.UP*.95,3.05,1.9)
			cylinder(p+Vector3.UP*.8,3.0,1.1,steel)
			cylinder(p+Vector3.UP*1.39,2.87,.1,material(Color(.52,.39,.10),.15,.9))
			ring(p+Vector3.UP*1.5,3.02,.09,metal)
			var rotor:=Node3D.new();add_child(rotor);rotor.position=p;rotor.set_meta("dynamic",true)
			var before:=get_child_count()
			for k in 8:
				var a:=k*TAU/8
				tube(p+Vector3.UP*1.57,p+Vector3(cos(a)*2.85,1.57,sin(a)*2.85),.045,metal)
			for n in get_children().slice(before): n.reparent(rotor)
			rotors.append(rotor)
			cylinder(p+Vector3.UP*1.9,.35,.8,dark)
			for z in [-2,2]: box(p+Vector3(0,.25,z),Vector3(2,.5,.55),rust)
			pipe_path([p+Vector3(3,.6,0),p+Vector3(3.7,.6,0),p+Vector3(3.7,-.1,3)],.16,metal)
			fixture(p+Vector3(0,4.5,-2),false,8)
			valve_wheel(p+Vector3(3.2,1.2,0),.26)
	walkway(Vector3(-36,-3,-14),Vector3(-36,-3,16),1.6)
	plaque("03 / ROTARY FILTERS",Vector3(-38,2,14),Vector2(7,1),PI/2)

func build_furnaces() -> void:
	districts["furnaces"]=Vector3(-58,DECK,23)
	for i in 3:
		var p:=Vector3(-48-i*10,DECK,25)
		collision_cylinder(p+Vector3.UP*5.8,2.16,11.6)
		cylinder(p+Vector3.UP*2,1.8,3.2,rust)
		cylinder(p+Vector3.UP*7,2.0,8.0,steel)
		cylinder(p+Vector3.UP*11.3,2.15,.6,rust)
		for y in [3,6,9]: ring(p+Vector3.UP*y,2.09,.11,rust)
		for x in [-2.8,2.8]:
			box(p+Vector3(x,6,0),Vector3(.32,12,.45),steel)
			pipe_path([p+Vector3(x,1,0),p+Vector3(x,14,0),p+Vector3(x,14,17)],.46,rust)
		walkway(p+Vector3(-3,5,-3),p+Vector3(3,5,-3),1.4)
		ladder(p+Vector3(3,0,-2),10)
		for y in [1.2,1.6]: box(p+Vector3(0,y,-1.8),Vector3(1.3,.1,.08),red)
		imported_prop("Prop_Vent_Big",p+Vector3(0,9,-2.2),1.2,rust).rotation.x=PI/2
		fixture(p+Vector3(0,7,-4),true,13)
		plaque("FURNACE %02d"%(i+1),p+Vector3(0,4,-2.2),Vector2(2.9,.6),PI)
		room_ref.mist(p+Vector3(0,12,1),1.5)
	plaque("04 / HIGH BAY",Vector3(-41,9,28),Vector2(8,1.4),PI/2)

func build_storage_district() -> void:
	var storage_start:=get_child_count()
	districts["storage"]=Vector3(-54,DECK,33)
	for row in 3:
		for col in 4:
			var p:=Vector3(-18-col*3.1,DECK,29+row*4)
			collision_box(p+Vector3.UP*.8,Vector3(2.2,1.6,1.7))
			box(p+Vector3.UP*.12,Vector3(2.2,.24,1.7),rust)
			if col%2==0:
				for k in 2: imported_prop("Prop_Barrel_Large",p+Vector3(k*.9-.45,.25,0),1.0,ivory if row==0 else steel)
			else: imported_prop("Prop_Crate3" if row%2==0 else "Prop_Crate4",p+Vector3.UP*.25,.85,painted)
	for z in [30,35,40]:
		for x in [-32,-16]: box(Vector3(x,-2.5,z),Vector3(.16,7,.16),safety)
		box(Vector3(-24,-.7,z),Vector3(16,.16,2.3),steel)
		for x in [-29,-25,-21]: imported_prop("Prop_Crate3",Vector3(x,-.6,z),.8,ivory)
	fixture(Vector3(-22,3,32),false,16)
	plaque("05 / UO2 POWDER STORAGE\nSEALED CONTAINERS / RESTRICTED",Vector3(-15,1,34),Vector2(8,1.4),PI/2,true)
	for n in get_children().slice(storage_start):
		if n is Node3D: n.position.x-=27
	districts["restricted"]=Vector3(-24,DECK,-35)
	box(Vector3(-25,-1,-38),Vector3(22,10,1.4),concrete,true)
	imported_prop("Door_DarkMetal",Vector3(-24,DECK,-37.1),1.6,rust)
	for x in [-33,-16]:
		box(Vector3(x,-2,-34),Vector3(2,8,7),concrete,true)
		fixture(Vector3(x,3,-31),true,9)
	plaque("☢  RESTRICTED / SHIELDED STORAGE\nNO UNAUTHORIZED ACCESS",Vector3(-24,2,-36.9),Vector2(8,1.6),0,true)

func build_pipe_racks() -> void:
	for i in 9:
		var z: float=-17+i*1.1
		var y: float=12.0+(i%3)*.75
		pipe_path([Vector3(-7,y,z),Vector3(-64,y,z)],.30 if i%3 else .55,rust if i%3==0 else metal)
		for x in [-15,-35,-55]: tube(Vector3(x,y+.5,z),Vector3(x,19,z),.045,steel)

func build_audio() -> void:
	for data in [["motor",Vector3(-20,0,-4),-17.0,1.0,32.0],["motor",Vector3(-42,-4,0),-10.0,1.21,27.0],["hvac",Vector3(-48,3,22),-10.0,.68,38.0],["transformer",Vector3(-48,1,-32),-16.0,.83,30.0],["drain",Vector3(-16,-5,14),-21.0,.9,15.0]]:
		var source:=AudioStreamPlayer3D.new()
		source.name="District_"+data[0]+str(district_audio.size())
		var wav:=load("res://art/audio/phase6/"+data[0]+".wav").duplicate() as AudioStreamWAV
		# Imported WAVs can be QOA-compressed; loop endpoints are PCM frames, not bytes.
		wav.loop_mode=AudioStreamWAV.LOOP_FORWARD;wav.loop_end=roundi(wav.get_length()*wav.mix_rate)
		source.stream=wav;source.position=data[1];source.volume_db=data[2];source.pitch_scale=data[3]
		source.max_distance=data[4];source.unit_size=7;source.bus="LabEnvironment"
		source.attenuation_filter_cutoff_hz=3400
		add_child(source);source.play(fmod(district_audio.size()*.31,wav.get_length()));district_audio.append(source)
	event_voice=AudioStreamPlayer3D.new()
	event_voice.bus="LabEnvironment";event_voice.unit_size=7;event_voice.max_distance=60;event_voice.volume_db=-15
	add_child(event_voice)

func batch_facility() -> void:
	var groups: Dictionary={}
	for item in find_children("*","MeshInstance3D",true,false):
		var p: Node=item
		var dynamic:=false
		while p!=self:
			if p.has_meta("dynamic"): dynamic=true
			p=p.get_parent()
		if dynamic: continue
		var mat: Material=item.material_override
		if not mat is StandardMaterial3D or mat.transparency!=BaseMaterial3D.TRANSPARENCY_DISABLED: continue
		var cell:=Vector3i(floori(item.global_position.x/16),floori(item.global_position.y/10),floori(item.global_position.z/16))
		var key:=str([item.mesh.get_instance_id(),mat.get_instance_id(),cell])
		if not groups.has(key): groups[key]=[]
		groups[key].append(item)
	for nodes in groups.values():
		if nodes.size()<2: continue
		var multi:=MultiMesh.new()
		multi.transform_format=MultiMesh.TRANSFORM_3D;multi.mesh=nodes[0].mesh;multi.instance_count=nodes.size()
		var instance:=MultiMeshInstance3D.new()
		instance.multimesh=multi;instance.material_override=nodes[0].material_override
		add_child(instance)
		for i in nodes.size():
			multi.set_instance_transform(i,global_transform.affine_inverse()*nodes[i].global_transform)
			nodes[i].queue_free()
		static_instances+=nodes.size()

func animate(delta: float) -> void:
	clock+=delta
	access.animate(delta)
	for v in feed_liquids: v.animate_motion(delta)
	agitator.rotation.y+=delta*(.18 if response==0 else lerpf(.22,.015,response))
	for rotor in rotors: rotor.rotation.y+=delta*.055
	event_clock-=delta
	if event_clock<=0:
		event_voice.position=Vector3(-63,7,20) if int(clock)%2==0 else Vector3(-76,-2,-22)
		event_voice.stream=load("res://art/audio/phase6/"+("clang" if int(clock)%2==0 else "hiss")+".wav")
		event_voice.play();event_clock=31.0+fmod(clock,17)

func set_response(value: float) -> void:
	response=clampf(value,0,1)
	for i in feed_liquids.size():
		var v:=feed_liquids[i]
		v.fill_level=lerpf(.58,.96,smoothstep(0,.60,response))
		v.set_treatment(response)
		var tip:=feed_roots[i]
		var surface_y: float=v.position.y+v.height*v.fill_level
		feed_streams[i].visible=response>0 and response<.60
		feed_streams[i].position=Vector3(tip.x,(tip.y+surface_y)*.5,tip.z)
		feed_streams[i].scale.y=maxf(.02,tip.y-surface_y)
	for l in process_lights:
		l.light_energy=3.6*(1-response)+.18
		l.light_color=Color(.53,.86,.06).lerp(Color(.88,.45,.08),response)
	settled=response>=1

func shift_district(method: String, ids: Array, offset: Vector3) -> void:
	var first:=get_child_count()
	var room_first:=room_ref.get_child_count()
	call(method)
	for n in get_children().slice(first):
		if n is Node3D: n.position+=offset
	for n in room_ref.get_children().slice(room_first):
		if n is Node3D: n.position+=offset
	for id in ids: districts[id]+=offset

func collision_box(p: Vector3, size: Vector3) -> StaticBody3D:
	var body:=StaticBody3D.new();body.position=p;add_child(body)
	var shape:=CollisionShape3D.new();var box_shape:=BoxShape3D.new();box_shape.size=size
	shape.shape=box_shape;body.add_child(shape)
	return body

func collision_cylinder(p: Vector3, r: float, h: float) -> void:
	var body:=StaticBody3D.new();body.position=p;add_child(body)
	var shape:=CollisionShape3D.new();var cylinder_shape:=CylinderShape3D.new()
	cylinder_shape.radius=r;cylinder_shape.height=h;shape.shape=cylinder_shape;body.add_child(shape)
