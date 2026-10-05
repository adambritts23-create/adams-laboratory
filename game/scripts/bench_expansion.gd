extends "res://scripts/lab_props.gd"
# Room additions only: no changes to equilibrium computation or NPC rigs.
var lab: Node3D
var sample_away:=false
var carrying:=false
var filtering:=false
var filter_time:=0.0
var snapshot: Dictionary={}
var outputs: Dictionary={}
var filter_snapshot: Dictionary={}
var filtering_vessel: Node3D
var carried: Node3D
var output_solid: Node3D
var output_liquid: Node3D
var filter_liquid: Node3D
var pump: AudioStreamPlayer3D
var owns_rifle:=false
var equipped:=false
var chambered:=false
var rounds:=30
var cooldown:=0.0
var rack_time:=0.0
var rack_model: Node3D
var held_rifle: Node3D
var held_bolt: Node3D
var flash: MeshInstance3D
var shot: AudioStreamPlayer
var music: AudioStreamPlayer
var rifle_target: Area3D
var sample_target: Area3D
func build(world: Node3D) -> void:
	lab=world;init_materials();set_meta("dynamic",true)
	var light:=OmniLight3D.new();light.position=Vector3(-3.0,2.8,5.6);light.light_color=Color(.94,.97,1);light.light_energy=1.8;light.omni_range=3.4;add_child(light)
	box(Vector3(-4.0,2.98,5.45),Vector3(.12,.025,1.5),material(Color(.95,.97,1),0,.2,2.5))
	# White edge reflections local to the titration glass; preserve other room glass.
	var whiteglass:=ShaderMaterial.new();whiteglass.shader=preload("res://materials/bench_glass.gdshader")
	for n in lab.room.sample_vessel.find_children("*","MeshInstance3D",true,false):
		if n.material_override is ShaderMaterial:n.material_override=whiteglass
		if n.mesh is TorusMesh:n.hide()
	for n in lab.room.get_children():
		if n is MeshInstance3D and n.material_override is ShaderMaterial and n.position.distance_to(Vector3(-3.8,2.2,5.45))<.55:n.material_override=whiteglass
	sample_target=target(Vector3(-3.8,1.45,5.45),Vector3(.48,.55,.48),"carry_sample","Carry calculated sample to filtration")
	build_filter()
	build_weapon()
	music=AudioStreamPlayer.new();music.volume_db=-18;music.bus="LabEnvironment";add_child(music)
	var song:="res://art/audio/user/watch_theme.ogg"
	if not ResourceLoader.exists(song):song="res://art/audio/music/espionage.ogg"
	if ResourceLoader.exists(song):
		var stream:=load(song) as AudioStreamOggVorbis
		if stream!=null:stream.loop=true;music.stream=stream
func target(pos: Vector3,size: Vector3,id: String,title: String) -> Area3D:
	var a:=Area3D.new();a.position=pos;a.collision_layer=4;a.collision_mask=0;a.set_meta("interaction",id);a.set_meta("title",title);add_child(a)
	var c:=CollisionShape3D.new();var s:=BoxShape3D.new();s.size=size;c.shape=s;a.add_child(c);return a
func build_filter() -> void:
	box(Vector3(4.35,.53,3.0),Vector3(2.45,1.06,1.30),dark,true)
	box(Vector3(4.35,1.11,3.0),Vector3(2.52,.10,1.36),worktop,true)
	box(Vector3(3.10,.77,3.0),Vector3(.025,.42,1.16),rubber)
	label_at("SUCTION\nFILTRATION",Vector3(3.078,.77,3),29,Color(.91,.92,.86),.0023).rotation.y=-PI/2
	target(Vector3(3.11,.78,3),Vector3(.15,.4,1.3),"filtration","Place carried beaker / suction filtration")
	var apparatus:=vessel("flask",Vector3(4.3,1.17,3),.85)
	apparatus.set_meta("fixed_apparatus",true);apparatus.name="FixedFiltrationFlask";apparatus.set_meta("protected_glass",true)
	cylinder(Vector3(4.3,1.78,3),.17,.20,material(Color(.86,.87,.84),0,.24))
	cylinder(Vector3(4.3,1.884,3),.144,.01,paper)
	for i in 7:cylinder(Vector3(4.3+sin(i)*.08,1.891,3+cos(i)*.08),.009,.003,rubber)
	cable([Vector3(4.43,1.55,3),Vector3(4.65,1.5,3),Vector3(4.72,1.27,3.25)],rubber,.019)
	box(Vector3(4.9,1.31,3.25),Vector3(.40,.28,.38),painted)
	gauge(Vector3(4.9,1.37,3.45),.075)
	filter_liquid=liquid_visual(Vector3(4.3,1.19,3),.12,.16,Color(.48,.63,.68,.3));filter_liquid.hide()
	output_solid=vessel("beaker",Vector3(3.65,1.17,2.67),.85)
	output_liquid=vessel("beaker",Vector3(3.65,1.17,3.37),.85)
	label_at("PRECIPITATE",Vector3(3.38,1.18,2.67),20,Color.WHITE,.0015).rotation.y=-PI/2
	label_at("FILTRATE",Vector3(3.38,1.18,3.37),20,Color.WHITE,.0015).rotation.y=-PI/2
	pump=AudioStreamPlayer3D.new();pump.stream=lab.sound.recording("motor");pump.position=Vector3(4.9,1.4,3);pump.volume_db=-19;pump.unit_size=1.5;pump.max_distance=8;pump.bus="LabEnvironment";add_child(pump)
	var light:=OmniLight3D.new();light.position=Vector3(3.8,2.4,3);light.light_energy=.85;light.omni_range=2.4;add_child(light)
func take_sample() -> bool:
	if lab.glassware!=null and lab.glassware.held!=null:lab.say("Put the glassware down first (G).");return false
	if lab.polish!=null and lab.polish.carried_output!=null:lab.say("Place the output beaker first.");return false
	if carrying or filtering:lab.say("Put the carried beaker down or wait for filtration.");return false
	var w=lab.workbench
	if w.busy or w.points.is_empty() or w.points[w.chosen].y==null:lab.say("Prepare and select an accepted calculated sample first.");return false
	snapshot=w.points[w.chosen].duplicate(true);sample_away=true;carrying=true;set_equipped(false)
	carried=vessel("beaker",Vector3.ZERO,.8);carried.set_meta("protected_glass",true);carried.set_meta("titration_record",{"setup":w.setup.duplicate(true),"points":w.points.duplicate(true),"diagrams":w.diagrams.duplicate(true),"chosen":w.chosen});carried.set_meta("transport_record",snapshot.duplicate(true))
	var fluid:=liquid_visual(Vector3(0,.015,0),.13,.22,Color(.4,.65,.72,.32));fluid.reparent(carried)
	fluid.sediment_amount=clampf(float(snapshot.get("visual",{}).get("bedHeight",0))/56,0,1);fluid.settling_progress=fluid.sediment_amount;fluid.apply_visuals()
	carried.reparent(lab.player.camera);carried.position=Vector3(.32,-.46,-.82);carried.rotation=Vector3.ZERO
	lab.room.sample_vessel.show();sample_target.collision_layer=4;w.invalidate()
	lab.accounting.annotate(carried,snapshot.get("inventory",{}))
	w.close();lab.say("Carry the beaker to Suction Filtration. E places it; E at Acid–Base returns it.");return true
func return_sample() -> void:
	if not carrying:return
	lab.glassware.return_to_station("acid")

func use_filter() -> void:
	if filtering:return
	if not carrying and lab.glassware.held!=null and lab.glassware.held.has_meta("calculation_record"):
		var candidate: Node3D=lab.glassware.held;var record: Dictionary=candidate.get_meta("calculation_record");var states: Array=record.data.get("previews",[])
		if states.is_empty() or not states[record.chosen].get("accepted",false):lab.say("This calculation beaker has no accepted result.");return
		var state: Dictionary=states[record.chosen];var inv: Dictionary=state.get("inventory",{})
		snapshot={"inventory":inv.duplicate(true),"solids":state.solids.duplicate(true),"species":inv.get("aqueous",[]).map(func(r):return {"id":r.id,"name":r.name,"concentration":r.moles}),"volume":1000.0,"y":state.pH,"modelSolventMassKg":1.0}
		carried=candidate;carrying=true;lab.glassware.held=null
	if not outputs.is_empty():
		if output_solid.visible or output_liquid.visible:
			lab.say("Collect both previous filtration beakers before starting another separation. G puts your new sample down safely.");return
		outputs={}
	if not carrying:lab.say("Bring the calculated beaker from Acid–Base Titrations first.");return
	filter_snapshot=snapshot.duplicate(true);filtering_vessel=carried
	carried.reparent(self);carried.position=Vector3(4.9,1.17,2.65);carried.rotation=Vector3.ZERO;carrying=false;filtering=true;filter_time=0;pump.play();filter_liquid.show()
	lab.say("Suction filtration running. Ideal separation: solids retained, dissolved material in the filtrate.")
func finish_filter() -> void:
	for node in [output_solid,output_liquid]:
		for child in node.get_children():
			if child.has_meta("filter_output"):child.queue_free()
	output_solid.show();output_liquid.show()
	filtering=false;pump.stop();filter_liquid.hide();filtering_vessel.queue_free();filtering_vessel=null;carried=null
	# Partition the accepted snapshot without a new equilibrium or inferred recovery.
	outputs={"precipitate":filter_snapshot.solids.filter(func(s):return float(s.get("amount",0))>0).duplicate(true),"filtrate":filter_snapshot.species.duplicate(true),"volumeMl":filter_snapshot.volume,"sourcePH":filter_snapshot.y,"modelSolventMassKg":filter_snapshot.get("modelSolventMassKg",null)}
	outputs["inventory"]=filter_snapshot.get("inventory",{}).duplicate(true)
	outputs["residueMassG"]=outputs.inventory.get("drySolidMassG")
	var retained: Dictionary=outputs.inventory.duplicate(true);retained["aqueous"]=[];retained["representedDissolvedMassG"]=0
	var dissolved: Dictionary=outputs.inventory.duplicate(true);dissolved["solids"]=[];dissolved["drySolidMassG"]=0;dissolved["components"]=[]
	lab.accounting.annotate(output_solid,retained);lab.accounting.annotate(output_liquid,dissolved)
	var fluid:=liquid_visual(Vector3(3.65,1.183,3.37),.135,.22,Color(.46,.64,.71,.3));fluid.set_meta("filter_output",true);fluid.reparent(output_liquid)
	if not outputs.precipitate.is_empty():
		var residue:=cylinder(Vector3(3.65,1.19,2.67),.133,.045,material(Color(.79,.75,.58),0,.93));residue.set_meta("filter_output",true);residue.reparent(output_solid)
	if lab.economy!=null and lab.economy.uranium_residue(retained):
		var pile=Node3D.new();output_solid.add_child(pile);pile.set_meta("filter_output",true);pile.position=Vector3(0,.12,0);lab.economy.chunk(pile)
	lab.say("Filtration complete: precipitate and filtrate are in separate beakers." if not outputs.precipitate.is_empty() else "Filtration complete. No calculated solid was present; the precipitate beaker is empty.",8)
	sample_away=false;sample_target.collision_layer=4;lab.room.sample_vessel.show();lab.workbench.apply_vessel()
func build_weapon() -> void:
	box(Vector3(-4.8,1.1,8.30),Vector3(1.45,2.2,.10),dark)
	rack_model=rifle();rack_model.position=Vector3(-4.8,1.63,8.43);rack_model.rotation.y=PI/2
	rifle_target=target(Vector3(-4.8,1.53,8.51),Vector3(1.4,.65,.22),"rifle","Pick up AK-47")
	label_at("AK-47",Vector3(-4.8,1.03,8.51),25,Color(.86,.84,.74),.002).rotation.y=0
	var mount_light:=OmniLight3D.new();mount_light.position=Vector3(-4.8,2.25,9.2);mount_light.light_energy=.7;mount_light.omni_range=2;add_child(mount_light)
	held_rifle=rifle();held_rifle.reparent(lab.player.camera);held_rifle.position=Vector3(.25,-.28,-.47);held_rifle.rotation=Vector3.ZERO;held_rifle.set_meta("dynamic",true);held_rifle.hide();held_bolt=held_rifle.get_node("Bolt")
	for part in held_rifle.find_children("*","MeshInstance3D",true,false):part.layers=2
	var fill:=OmniLight3D.new();fill.position=Vector3(-.1,.15,-.25);fill.light_energy=.65;fill.omni_range=1.6;fill.light_cull_mask=2;lab.player.camera.add_child(fill)
	flash=ellipsoid(Vector3.ZERO,Vector3(.025,.025,.1),material(Color(1,.65,.12),0,.5,4));flash.reparent(held_rifle);flash.position=Vector3(0,.05,-.62);flash.hide()
	shot=AudioStreamPlayer.new();shot.bus="Master";shot.volume_db=-9;add_child(shot);shot.stream=shot_sound()
func profile_part(points: PackedVector2Array,width: float,mat: Material) -> MeshInstance3D:
	var st:=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var triangles:=Geometry2D.triangulate_polygon(points)
	for side in [-1,1]:
		for i in range(0,triangles.size(),3):
			for j in ([0,1,2] if side==1 else [2,1,0]):
				var p:=points[triangles[i+j]];st.add_vertex(Vector3(side*width*.5,p.y,p.x))
	for i in points.size():
		var a:=points[i];var b:=points[(i+1)%points.size()]
		for v in [Vector3(-width/2,a.y,a.x),Vector3(width/2,a.y,a.x),Vector3(width/2,b.y,b.x),Vector3(-width/2,a.y,a.x),Vector3(width/2,b.y,b.x),Vector3(-width/2,b.y,b.x)]:st.add_vertex(v)
	st.generate_normals();var node:=MeshInstance3D.new();node.mesh=st.commit();node.material_override=mat;add_child(node);return node
func rifle() -> Node3D:
	var r:=Node3D.new();add_child(r);var start:=get_child_count()
	var steel:=material(Color(.085,.10,.105),.85,.29);var edge:=material(Color(.18,.19,.19),.8,.32);var wood:=material(Color(.30,.12,.045),0,.47)
	profile_part(PackedVector2Array([Vector2(-.09,-.045),Vector2(.24,-.045),Vector2(.24,.025),Vector2(.16,.06),Vector2(-.07,.06)]),.07,steel)
	var bolt:=box(Vector3(.046,.025,.02),Vector3(.038,.018,.04),edge);bolt.name="Bolt"
	profile_part(PackedVector2Array([Vector2(.21,.025),Vector2(.49,.005),Vector2(.49,-.15),Vector2(.43,-.145),Vector2(.30,-.075),Vector2(.21,-.06)]),.067,wood)
	box(Vector3(0,-.07,.495),Vector3(.075,.16,.014),rubber)
	profile_part(PackedVector2Array([Vector2(-.28,.035),Vector2(-.09,.032),Vector2(-.085,-.04),Vector2(-.25,-.055)]),.077,wood)
	tube(Vector3(0,.025,-.25),Vector3(0,.025,-.62),.014,steel)
	tube(Vector3(0,.07,-.12),Vector3(0,.07,-.43),.011,steel)
	box(Vector3(0,.07,-.51),Vector3(.022,.085,.03),steel)
	ring(Vector3(0,.114,-.51),.018,.003,edge).rotation.x=PI/2
	box(Vector3(0,.075,.12),Vector3(.052,.035,.035),edge)
	profile_part(PackedVector2Array([Vector2(.12,-.04),Vector2(.19,-.05),Vector2(.24,-.20),Vector2(.175,-.205)]),.045,wood)
	profile_part(PackedVector2Array([Vector2(-.045,-.04),Vector2(.045,-.04),Vector2(.045,-.12),Vector2(.015,-.22),Vector2(-.05,-.30),Vector2(-.14,-.27),Vector2(-.09,-.19),Vector2(-.06,-.115)]),.045,steel)
	for side in [-1,1]:
		for i in 3:cable([Vector3(side*.024,-.10,-.034+i*.025),Vector3(side*.024,-.18,-.06+i*.025),Vector3(side*.024,-.25,-.10+i*.025)],edge,.002)
		for i in 5:box(Vector3(side*.040,-.003,-.245+i*.029),Vector3(.002,.045,.007),material(Color(.12,.045,.016),0,.8))
		for z in [-.04,.07,.18]:ellipsoid(Vector3(side*.036,.0,z),Vector3(.003,.005,.005),edge)
	cable([Vector3(0,-.045,.055),Vector3(0,-.103,.065),Vector3(0,-.113,.115),Vector3(0,-.06,.145)],steel,.005)
	tube(Vector3(0,-.047,.09),Vector3(0,-.083,.105),.004,edge)
	for n in get_children().slice(start):n.reparent(r)
	return r
func shot_sound() -> AudioStreamWAV:
	var rng:=RandomNumberGenerator.new();rng.seed=913
	var data:=PackedByteArray();var length:=17640;data.resize(length*2)
	var previous:=0.0
	for i in length:
		var t:=float(i)/22050;previous=lerpf(previous,rng.randf_range(-1,1),.72)
		var value: int=int(clampf((previous*.7+sin(t*TAU*72)*.3)*exp(-t*38)+previous*.19*exp(-t*5)*(1.0-exp(-t*40)),-1,1)*23000)
		data.encode_s16(i*2,value)
	var wave:=AudioStreamWAV.new();wave.format=AudioStreamWAV.FORMAT_16_BITS;wave.mix_rate=22050;wave.data=data;return wave
func pickup_rifle(remove_lab_display:bool=true) -> void:
	if (lab.glassware!=null and lab.glassware.holding()) or carrying or (lab.polish!=null and lab.polish.carried_output!=null):lab.say("Place the beaker before taking the rifle.");return
	owns_rifle=true
	if remove_lab_display:rack_model.hide();rifle_target.collision_layer=0
	set_equipped(true)
	lab.say("E · chamber   |   1 · holster   |   3 / wheel · draw   |   Left click · fire",7)
func set_equipped(value: bool) -> void:
	equipped=value and owns_rifle and (lab.glassware==null or lab.glassware.held==null) and not carrying and (lab.polish==null or lab.polish.carried_output==null);held_rifle.visible=equipped
func chamber() -> void:
	if not equipped or chambered or rack_time>0 or rounds<=0:return
	rack_time=.6;lab.sound.one_shot("click",-16,.55);lab.say("Chambering…",.7)
func fire() -> bool:
	if not equipped or not chambered or rounds<=0 or cooldown>0 or not lab.player.enabled or lab.paused:return false
	rounds-=1;cooldown=.14
	if not lab.sound.muted:shot.play()
	flash.show();held_rifle.rotation.x=.12;held_rifle.position.z=-.40
	lab.player.camera.rotation.x=clampf(lab.player.camera.rotation.x+.018,-1.45,1.45)
	var origin: Vector3=lab.player.camera.global_position
	var q:=PhysicsRayQueryParameters3D.create(origin,origin-lab.player.camera.global_basis.z*80)
	q.exclude=[lab.player.get_rid()];q.collision_mask=9;q.collide_with_areas=true
	var hit: Dictionary=lab.get_world_3d().direct_space_state.intersect_ray(q)
	if lab.staff_exit!=null and lab.staff_exit.apartment!=null:
		var balcony=lab.staff_exit.apartment.balcony
		if balcony!=null:hit=balcony.redirect_shot(origin,-lab.player.camera.global_basis.z,hit)
	if not hit.is_empty():
		if hit.collider.has_meta("sentry"):hit.collider.get_meta("sentry").take_hit()
		elif hit.collider.has_meta("practice_target"):hit.collider.get_meta("practice_target").score_hit(hit.position)
		elif lab.polish!=null:lab.polish.hit_target(hit)
		var impact:=ellipsoid(hit.position+hit.normal*.012,Vector3.ONE*.012,material(Color(.24,.22,.18),0,.9))
		get_tree().create_timer(2).timeout.connect(impact.queue_free)
	if rounds==0:chambered=false
	return true
func handle_input(event: InputEvent) -> bool:
	if not lab.player.enabled or lab.paused:return false
	if event is InputEventKey and event.pressed and not event.echo:
		if event.physical_keycode==KEY_1:set_equipped(false);return true
		if event.physical_keycode==KEY_3:set_equipped(true);return true
	if event is InputEventMouseButton and event.pressed:
		if event.button_index in [MOUSE_BUTTON_WHEEL_UP,MOUSE_BUTTON_WHEEL_DOWN]:set_equipped(not equipped);return true
		if event.button_index==MOUSE_BUTTON_LEFT and equipped:
			if not fire():
				lab.sound.one_shot("click",-24,.75)
				if not chambered and rounds>0:lab.say("E · chamber before firing",2)
			return true
	if event.is_action_pressed("interact") and equipped and not chambered and rounds>0:chamber();return true
	return false
func _process(delta: float) -> void:
	if lab==null:return
	var show_music: bool=(lab.workbench.visible or (lab.calculations!=null and lab.calculations.visible)) and not lab.paused
	if music.stream!=null:
		if show_music and not music.playing:music.play()
		elif not show_music and music.playing:music.stop()
	held_rifle.visible=equipped and lab.player.enabled
	if lab.paused:return
	cooldown=maxf(0,cooldown-delta);rack_time=maxf(0,rack_time-delta)
	if equipped and not chambered and rack_time==0 and held_rifle.has_meta("racking"):chambered=true;held_rifle.remove_meta("racking")
	if rack_time>0:held_rifle.set_meta("racking",true)
	held_bolt.position.z=.02+sin(clampf(rack_time/.6,0,1)*PI)*.075
	held_rifle.rotation.x=lerpf(held_rifle.rotation.x,0,delta*12)
	held_rifle.position.z=lerpf(held_rifle.position.z,-.47,delta*14)
	if cooldown<.09:flash.hide()
	if filtering:
		filter_time+=delta;filter_liquid.fill_level=clampf(filter_time/5,.05,1);filter_liquid.apply_visuals()
		if filter_time>=5:finish_filter()

