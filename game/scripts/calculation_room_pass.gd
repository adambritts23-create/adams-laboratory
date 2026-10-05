extends "res://scripts/lab_props.gd"
var lab: Node3D
var breakables: Array=[]
var shards: Array=[]
var reactions: Dictionary={}
var carried_output: Node3D
var carried_kind:=""
var carried_record: Dictionary={}
var output_targets: Array=[]
var places: Dictionary={}
var residue_record: Dictionary={}
var filtrate_record: Dictionary={}
var balance_label: Label3D
var glass_sound: AudioStreamWAV
func build(world: Node3D) -> void:
	lab=world;init_materials();set_meta("dynamic",true)
	build_calculation_monitor()
	for i in 6:
		var pos:=Vector3(4.4 if i<2 else 3.55,1.18,-.2-i*.40)
		var root:=vessel("beaker" if i%2==0 else "flask",pos,.65)
		root.set_meta("dynamic",true)
		var target:=Area3D.new();target.position=pos+Vector3(0,.15,0);target.collision_layer=8;target.collision_mask=0;target.set_meta("breakable",root);add_child(target)
		var shape:=CollisionShape3D.new();var capsule:=CylinderShape3D.new();capsule.radius=.13;capsule.height=.35;shape.shape=capsule;target.add_child(shape);breakables.append(target)
	for actor in lab.room.actors:
		actor.set_meta("health",100)
		var target:=Area3D.new();target.collision_layer=8;target.collision_mask=0;target.set_meta("actor",actor);actor.add_child(target);target.position.y=actor.height*.5
		var c:=CollisionShape3D.new();var shape:=CapsuleShape3D.new();shape.radius=.29;shape.height=actor.height;c.shape=shape;target.add_child(c)
	for item in [["residue",Vector3(3.65,1.38,2.67)],["filtrate",Vector3(3.65,1.38,3.37)]]:
		var a: Area3D=lab.expansion.target(item[1],Vector3(.32,.42,.32),"output_"+item[0],"Carry "+item[0]+" beaker");a.collision_layer=0;output_targets.append(a)
	# Dedicated accessible balance beside calculation screen, and existing laboratory balance.
	imported_prop("machine_electronic_scale",Vector3(3.65,1.17,1.9),.9)
	places={"balance":Vector3(3.65,1.33,1.9),"prep_balance":Vector3(3.85,1.35,-6),"analysis":Vector3(-1.25,1.17,-7.6),"acid_return":Vector3(-3.35,1.18,4.55)}
	# Physical weighing pans match the visual plates, so placed glass rests above the equipment.
	for key in ["balance","prep_balance"]:
		var support:=StaticBody3D.new();add_child(support);support.position=places[key]-Vector3(0,.015,0)
		var shape:=CollisionShape3D.new();shape.shape=BoxShape3D.new();shape.shape.size=Vector3(.44,.03,.44);support.add_child(shape)
	for key in places:lab.expansion.target(places[key]+Vector3(0,.12,0),Vector3(.45,.35,.45),"place_"+key,"Place / retrieve carried beaker"+(" on balance" if "balance" in key else ""))
	balance_label=label_at("BALANCE / EMPTY",Vector3(3.1,1.18,1.9),20,Color(.7,.95,.8),.0014);balance_label.rotation.y=-PI/2
	glass_sound=glass_clip()
func build_calculation_monitor() -> void:
	box(Vector3(3.24,1.28,.85),Vector3(.32,.22,1.1),dark)
	box(Vector3(3.24,1.95,.85),Vector3(.12,1.05,1.65),painted)
	var vp:=SubViewport.new();vp.size=Vector2i(900,560);vp.render_target_update_mode=SubViewport.UPDATE_ALWAYS;add_child(vp)
	var chart:=preload("res://scripts/calculation_plot.gd").new();chart.size=Vector2(900,560);vp.add_child(chart);lab.calculations.monitor=chart
	var mesh:=MeshInstance3D.new();var quad:=QuadMesh.new();quad.size=Vector2(1.54,.96);mesh.mesh=quad;mesh.position=Vector3(3.17,1.95,.85);mesh.rotation.y=-PI/2
	var mat:=StandardMaterial3D.new();mat.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;mat.albedo_texture=vp.get_texture();mesh.material_override=mat;add_child(mesh)
	lab.expansion.target(Vector3(3.08,1.95,.85),Vector3(.13,1.05,1.65),"calculation","Calculation workstation / equilibrium diagrams")
	box(Vector3(3.08,.76,.85),Vector3(.02,.38,1.45),rubber)
	label_at("CALCULATION",Vector3(3.055,.76,.85),30,Color(.9,.9,.8),.0023).rotation.y=-PI/2
func glass_clip() -> AudioStreamWAV:
	var wave:=AudioStreamWAV.new();wave.format=AudioStreamWAV.FORMAT_16_BITS;wave.mix_rate=22050
	var bytes:=PackedByteArray();bytes.resize(22050*2);var rng:=RandomNumberGenerator.new();rng.seed=392
	for i in 22050:
		var t:=float(i)/22050;var value: float=(rng.randf_range(-.5,.5)*exp(-t*15)+sin(t*TAU*2711)*exp(-t*8)*.25+sin(t*TAU*4287)*exp(-t*10)*.18)
		bytes.encode_s16(i*2,int(clampf(value,-1,1)*20000))
	wave.data=bytes;return wave
func hit_target(hit: Dictionary) -> void:
	var collider: Object=hit.collider
	if collider.has_meta("zombie"):
		lab.zombies.hit(collider.get_meta("zombie"));return
	if collider.has_meta("breakable"):
		var prop: Node3D=collider.get_meta("breakable")
		if prop.get_meta("protected_glass",false):return
		prop.hide();collider.collision_layer=0
		if lab.glassware!=null:lab.glassware.on_broken(prop)
		var audio:=AudioStreamPlayer3D.new();audio.stream=glass_sound;audio.position=hit.position;audio.volume_db=-8;audio.unit_size=3;audio.bus="LabEnvironment";add_child(audio);audio.finished.connect(audio.queue_free);audio.play()
		var ground:=lab.get_world_3d().direct_space_state.intersect_ray(PhysicsRayQueryParameters3D.create(hit.position+Vector3.UP*.03,hit.position-Vector3.UP*8,1,[lab.player.get_rid()]))
		var floor_y: float=ground.position.y+.01 if not ground.is_empty() else 0.0
		for i in 18:
			var mesh:=PrismMesh.new();mesh.size=Vector3(.015+randf()*.02,.012,.027)
			var piece:=mesh_node(mesh,hit.position,Vector3.ONE,material(Color(.75,.87,.90,.6),.2,.12))
			shards.append({"node":piece,"velocity":Vector3(randf_range(-1.8,1.8),randf_range(.4,2),randf_range(-1.8,1.8)),"time":3.0,"floor":floor_y})
	elif collider.has_meta("actor"):
		var actor: Node3D=collider.get_meta("actor");var health:=maxi(0,int(actor.get_meta("health"))-34);actor.set_meta("health",health)
		if health==0:
			collider.collision_layer=0;lab.companions.hit(actor,true);lab.say(actor.identity.capitalize()+" is incapacitated. Restart the shift to reset.",5)
			for child in actor.get_children():
				if child is Area3D:child.collision_layer=0
		else:lab.companions.hit(actor,false);lab.say(actor.identity.to_upper()+": Watch where you're firing!",2)
func interact(id: String) -> bool:
	if id.begins_with("output_"):take_output(id.trim_prefix("output_"));return true
	if id.begins_with("place_"):place_output(id.trim_prefix("place_"));return true
	return false
func take_output(kind: String) -> void:
	if kind=="residue" and lab.economy!=null and lab.accounting.held_node()==null and lab.economy.collect_precipitate():return
	if lab.glassware!=null and lab.glassware.held!=null:lab.say("Put the glassware down first (G).");return
	if carried_output!=null or lab.expansion.carrying:lab.say("Place the beaker you are carrying first.");return
	if lab.expansion.outputs.is_empty():return
	var node: Node3D=lab.expansion.output_solid if kind=="residue" else lab.expansion.output_liquid
	if not node.visible:return
	node.hide();carried_record=lab.expansion.outputs.duplicate(true);carried_kind=kind
	carried_output=vessel("beaker",Vector3.ZERO,.8)
	if kind=="residue" and not carried_record.precipitate.is_empty():
		var sediment:=cylinder(Vector3(0,.025,0),.125,.045,paper);sediment.set_meta("sample_sediment",true);sediment.reparent(carried_output)
	elif kind=="filtrate":
		var fluid:=liquid_visual(Vector3(0,.015,0),.125,.20,Color(.46,.64,.71,.3));fluid.reparent(carried_output)
	var inv: Dictionary=carried_record.get("inventory",{}).duplicate(true)
	if kind=="residue":inv["aqueous"]=[];inv["representedDissolvedMassG"]=0
	else:inv["solids"]=[];inv["drySolidMassG"]=0;inv["components"]=[]
	lab.accounting.annotate(carried_output,inv)
	carried_output.reparent(lab.player.camera);carried_output.position=Vector3(.32,-.45,-.8);carried_output.rotation=Vector3.ZERO;lab.expansion.set_equipped(false)
	output_targets[0 if kind=="residue" else 1].collision_layer=0
	lab.say("Carrying "+kind+". E at a balance or sample point places it.")
func place_output(key: String) -> void:
	if lab.accounting!=null and lab.glassware.holding() and "balance" in key:
		var item: Node3D=lab.accounting.held_node();var record: Dictionary=item.get_meta("inventory",{})
		if record.get("available",false):
			if lab.glassware.put_down(places[key])==null:return
			balance_label.text=lab.accounting.summary(record);lab.say("Model inventory displayed · I for full composition. No container tare.",5);return
	if lab.glassware!=null and lab.glassware.held!=null:
		if has_meta("placed_"+key):lab.glassware.put_down()
		else:lab.glassware.put_down(places[key])
		return
	if lab.expansion.carrying:lab.say("Return the titration beaker first.");return
	var stored: Node3D=get_meta("placed_"+key) if has_meta("placed_"+key) else null
	if carried_output==null:
		if stored==null:lab.say("Bring a filtration output beaker here.");return
		if "balance" in key:balance_label.text="BALANCE / EMPTY"
		if stored.has_meta("glass_target"):stored.get_meta("glass_target").collision_layer=0
		carried_output=stored;remove_meta("placed_"+key);carried_kind=stored.get_meta("kind");carried_record=stored.get_meta("record");carried_output.reparent(lab.player.camera);carried_output.position=Vector3(.32,-.45,-.8);carried_output.rotation=Vector3.ZERO;lab.expansion.set_equipped(false);return
	if stored!=null:lab.say("This sample point is occupied.");return
	var safe=lab.glassware.safe_glass_position(places[key],carried_output)
	if safe==null:lab.say("This worktop has no clear space for the beaker.");return
	carried_output.reparent(self);carried_output.position=safe;carried_output.rotation=Vector3.ZERO;carried_output.set_meta("kind",carried_kind);carried_output.set_meta("record",carried_record);set_meta("placed_"+key,carried_output)
	if lab.glassware!=null:lab.glassware.register_glass(carried_output,"output",carried_record)
	if "balance" in key:
		var text:="Mass unavailable: no validated dry mass / solvent-density conversion."
		if carried_kind=="residue" and carried_record.get("residueMassG",null)!=null:text="Dry solid estimate: %.5f g (ideal recovery, no container tare)" % float(carried_record.residueMassG)
		balance_label.text=text;lab.say(text,7)
	else:lab.say("Sample placed. E retrieves the same beaker and inventory.")
	carried_output=null;carried_kind="";carried_record={}
func _process(delta: float) -> void:
	if lab==null or lab.paused:return
	for actor in reactions.keys():
		reactions[actor]-=delta
		if int(actor.get_meta("health"))>0:actor.rotation.x=sin(float(reactions[actor])*25)*.045
		if reactions[actor]<=0:actor.rotation.x=0;reactions.erase(actor)
	for i in range(shards.size()-1,-1,-1):
		var s: Dictionary=shards[i];s.time-=delta;s.velocity.y-=9.8*delta;s.node.position+=s.velocity*delta;s.node.rotate_x(delta*6)
		if s.node.position.y<s.floor:s.node.position.y=s.floor;s.velocity=Vector3.ZERO
		if s.time<=0:s.node.queue_free();shards.remove_at(i)
	if not lab.expansion.outputs.is_empty():
		for i in 2:
			var source: Node3D=lab.expansion.output_solid if i==0 else lab.expansion.output_liquid
			output_targets[i].collision_layer=4 if source.visible else 0
	else:
		for t in output_targets:t.collision_layer=0
