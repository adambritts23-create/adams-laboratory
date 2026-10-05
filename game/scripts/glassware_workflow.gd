extends "res://scripts/lab_props.gd"
var lab: Node3D
var held: Node3D
var glass_targets: Dictionary={}
var parked: Dictionary={}
var next_id:=0
var owns_crowbar:=false
var crowbar_equipped:=false
var crowbar: Node3D
var wall_bar: Node3D
var bar_target: Area3D
var swing:=0.0
var cleanup_time:=0.0
var wash_slots: Array=[]
var wash_occupied: Dictionary={}
func build(world: Node3D) -> void:
	lab=world;init_materials();set_meta("dynamic",true);build_wash();build_crowbar();build_calculation_beaker();call_deferred("register_room_glass")
func holding() -> bool:return held!=null or lab.expansion.carrying or lab.polish.carried_output!=null
func register_room_glass() -> void:
	for root in get_tree().get_nodes_in_group("laboratory_glass"):
		if root in [lab.room.sample_vessel,lab.expansion.output_solid,lab.expansion.output_liquid] or root.get_meta("protected_glass",false):continue
		register_glass(root)
func register_glass(root: Node3D,kind: String="decor",record: Dictionary={}) -> Area3D:
	if root.has_meta("glass_target") and is_instance_valid(root.get_meta("glass_target")):
		var existing: Area3D=root.get_meta("glass_target")
		existing.collision_layer=4 if kind=="source" else 12
		root.set_meta("transport_kind",kind);root.set_meta("transport_record",record)
		return existing
	var id:=str(next_id);next_id+=1
	var a: Area3D
	for old in lab.polish.breakables:
		if is_instance_valid(old) and old.get_meta("breakable",null)==root:a=old;break
	if a==null:
		a=Area3D.new();root.add_child(a);a.position.y=float(root.get_meta("glass_height",.35))*.5
		var c:=CollisionShape3D.new();var shape:=CylinderShape3D.new();shape.height=float(root.get_meta("glass_height",.35));shape.radius=.19*float(root.get_meta("glass_scale",1));c.shape=shape;a.add_child(c)
		a.set_meta("breakable",root);lab.polish.breakables.append(a)
	else:a.reparent(root)
	a.collision_layer=4 if kind=="source" else 12;a.collision_mask=0;a.set_meta("interaction","glass_"+id);a.set_meta("title","Pick up glassware · G puts it down")
	root.set_meta("transport_kind",kind);root.set_meta("transport_record",record);glass_targets[id]=a;root.set_meta("glass_target",a);return a
func on_broken(root: Node3D) -> void:
	for node in root.find_children("*","Area3D",true,false):node.collision_layer=0
	for key in lab.polish.places:
		if lab.polish.has_meta("placed_"+key) and lab.polish.get_meta("placed_"+key)==root:lab.polish.remove_meta("placed_"+key)
	for key in wash_occupied.keys():
		if wash_occupied[key]==root:wash_occupied.erase(key)
func pickup(id: String) -> void:
	if not glass_targets.has(id) or not is_instance_valid(glass_targets[id]):return
	if holding():put_down();return
	var target: Area3D=glass_targets[id];var root: Node3D=target.get_meta("breakable")
	if not root.visible or root.get_meta("fixed_apparatus",false):return
	for key in lab.polish.places:
		if lab.polish.has_meta("placed_"+key) and lab.polish.get_meta("placed_"+key)==root:lab.polish.remove_meta("placed_"+key)
	for key in wash_occupied.keys():
		if wash_occupied[key]==root:wash_occupied.erase(key)
	target.collision_layer=0;root.reparent(lab.player.camera);root.position=Vector3(.32,-.45,-.8);root.rotation=Vector3.ZERO
	var kind: String=root.get_meta("transport_kind","decor")
	if kind=="source":
		lab.expansion.carried=root;lab.expansion.carrying=true;lab.expansion.snapshot=root.get_meta("transport_record",{}).duplicate(true)
	elif kind=="output":lab.polish.carried_output=root;lab.polish.carried_kind=root.get_meta("kind");lab.polish.carried_record=root.get_meta("record")
	else:held=root
	lab.expansion.set_equipped(false);crowbar_equipped=false;lab.say("Carrying glassware · G puts it down · E at wash station stores it.",4)
func put_down(position_override: Variant=null) -> Node3D:
	if not holding():return null
	var carried_item:Node3D=lab.accounting.held_node()
	var desired:Vector3=position_override if position_override!=null else placement_position()
	var safe=safe_glass_position(desired,carried_item)
	if safe==null:lab.say("No clear space here. Choose an open part of the worktop.");return null
	var root: Node3D;var kind:="decor";var record: Dictionary={}
	if lab.expansion.carrying:root=lab.expansion.carried;kind="source";record=lab.expansion.snapshot.duplicate(true);lab.expansion.carrying=false
	elif lab.polish.carried_output!=null:
		root=lab.polish.carried_output;kind="output";record=lab.polish.carried_record.duplicate(true);root.set_meta("kind",lab.polish.carried_kind);root.set_meta("record",record);lab.polish.carried_output=null;lab.polish.carried_kind="";lab.polish.carried_record={}
	else:root=held;held=null
	var pos:Vector3=safe
	root.reparent(self);root.position=pos+Vector3(0,.005,0);root.rotation=Vector3.ZERO
	var target: Area3D
	for a in glass_targets.values():
		if is_instance_valid(a) and a.get_meta("breakable")==root:target=a;break
	if target==null:target=register_glass(root,kind,record)
	else:target.collision_layer=4 if kind=="source" else 12
	lab.say("Glassware placed. E picks it up again.",3);return root
func placement_position() -> Vector3:
	var camera: Camera3D=lab.player.camera;var start:=camera.global_position
	var query:=PhysicsRayQueryParameters3D.create(start,start-camera.global_basis.z*2.5,1,[lab.player.get_rid()]);var space:=lab.get_world_3d().direct_space_state
	var hit:=space.intersect_ray(query)
	if not hit.is_empty() and hit.normal.y>.7:return hit.position
	var front: Vector3=-camera.global_basis.z;front.y=0;front=front.normalized()
	for distance in [.65,.35,0.0]:
		var point: Vector3=lab.player.global_position+front*distance+Vector3.UP*.8
		query=PhysicsRayQueryParameters3D.create(point,point-Vector3.UP*5,1,[lab.player.get_rid()]);hit=space.intersect_ray(query)
		if not hit.is_empty() and hit.normal.y>.7:return hit.position
	return lab.player.global_position
func build_wash() -> void:
	var steel:=material(Color(.46,.51,.53),.8,.24)
	box(Vector3(4.6,.35,10.18),Vector3(2.5,.70,1.65),painted,true)
	box(Vector3(3.86,1.02,10.18),Vector3(1.0,.10,1.7),steel,true)
	box(Vector3(5.55,1.02,10.18),Vector3(.4,.10,1.7),steel,true)
	for z in [9.47,10.90]:box(Vector3(4.95,1.02,z),Vector3(.9,.10,.30),steel,true)
	box(Vector3(4.95,.78,10.18),Vector3(.94,.04,1.15),steel)
	for x in [4.48,5.40]:box(Vector3(x,.90,10.18),Vector3(.04,.25,1.17),steel)
	for z in [9.61,10.76]:box(Vector3(4.95,.90,z),Vector3(.94,.25,.04),steel)
	cylinder(Vector3(4.95,.808,10.18),.065,.006,rubber)
	cable([Vector3(5.52,1.08,10.18),Vector3(5.52,1.55,10.18),Vector3(5.1,1.55,10.18),Vector3(5.05,1.43,10.18)],steel,.024)
	for z in [10.4,10.8]:cylinder(Vector3(5.55,1.12,z),.042,.07,steel)
	for i in 7:box(Vector3(3.84,1.078,9.58+i*.20),Vector3(.75,.008,.012),metal)
	plaque("GLASSWARE / WASH STATION",Vector3(3.325,.72,10.18),Vector2(2.1,.30),-PI/2)
	lab.expansion.target(Vector3(3.29,.78,10.18),Vector3(.12,.28,1.6),"wash_station","Put carried glassware on draining board")
	lab.expansion.target(Vector3(4.9,1.05,10.18),Vector3(.85,.18,1.10),"pour_basin","Pour out carried contents into basin")
	for x in [3.60,3.96]:
		for i in 4:wash_slots.append(Vector3(x,1.08,9.65+i*.35))
	var light:=OmniLight3D.new();light.position=Vector3(4.2,2.5,10.18);light.omni_range=3;light.light_energy=1.3;light.light_color=Color(.85,.91,1);add_child(light)
func wash() -> void:
	if not holding():lab.say("E picks up stored glassware. G puts any carried beaker down.");return
	for i in wash_slots.size():
		if not wash_occupied.has(i):
			var placed:=put_down(wash_slots[i])
			if placed!=null:wash_occupied[i]=placed
			return
	put_down();lab.say("Draining board full; glassware placed safely nearby.")
func bar_model() -> Node3D:
	var root:=Node3D.new();add_child(root);var start:=get_child_count();var steel:=material(Color(.29,.31,.32),.85,.27)
	cable([Vector3(0,-.25,.15),Vector3(0,.13,-.42),Vector3(0,.21,-.47),Vector3(0,.25,-.43),Vector3(0,.22,-.36)],steel,.014)
	tube(Vector3(0,-.22,.10),Vector3(0,-.06,-.14),.019,rubber)
	box(Vector3(0,.215,-.35),Vector3(.04,.018,.04),steel)
	for node in get_children().slice(start):node.reparent(root)
	return root
func build_crowbar() -> void:
	box(Vector3(-3.88,1.5,8.30),Vector3(.36,1.2,.10),dark)
	wall_bar=bar_model();wall_bar.position=Vector3(-3.88,1.5,8.44);wall_bar.rotation.x=PI/2
	bar_target=lab.expansion.target(Vector3(-3.88,1.52,8.53),Vector3(.24,.95,.2),"crowbar","Pick up crowbar")
	crowbar=bar_model();crowbar.reparent(lab.player.camera);crowbar.position=Vector3(.3,-.25,-.4);crowbar.rotation=Vector3.ZERO;crowbar.hide()
	for part in crowbar.find_children("*","MeshInstance3D",true,false):part.layers=2
	label_at("CROWBAR",Vector3(-3.88,.99,8.53),19,Color.WHITE,.0015)
func equip_bar() -> void:
	if holding() or not owns_crowbar:return
	lab.expansion.set_equipped(false);crowbar_equipped=true
func strike() -> void:
	if swing>0:return
	swing=.48;lab.sound.one_shot("click",-13,.45)
	var camera: Camera3D=lab.player.camera;var query:=PhysicsRayQueryParameters3D.create(camera.global_position,camera.global_position-camera.global_basis.z*1.9,9,[lab.player.get_rid()]);query.collide_with_areas=true
	var hit:=lab.get_world_3d().direct_space_state.intersect_ray(query)
	if not hit.is_empty():lab.polish.hit_target(hit)
func interact(id: String) -> bool:
	if id in ["acid","carry_sample","calculation","calculation_beaker"] and holding():return_to_station("acid" if id in ["acid","carry_sample"] else "calculation");return true
	if id=="calculation_beaker":take_calculation_beaker();return true
	if id=="wash_station":wash();return true
	if id=="crowbar":
		if holding():lab.say("Put the beaker down first (G).");return true
		owns_crowbar=true;wall_bar.hide();bar_target.collision_layer=0;equip_bar();lab.say("2 · crowbar  |  Left click · swing  |  1 · empty hands");return true
	if id.begins_with("glass_"):pickup(id.trim_prefix("glass_"));return true
	return false
func handle_input(event: InputEvent) -> bool:
	if not lab.player.enabled or lab.paused:return false
	if event is InputEventKey and event.pressed and not event.echo:
		if event.physical_keycode==KEY_G and holding():put_down();return true
		if event.physical_keycode==KEY_1:crowbar_equipped=false
		if event.physical_keycode==KEY_2:equip_bar();return true
		if event.physical_keycode==KEY_3:crowbar_equipped=false
	if event.is_action_pressed("interact") and holding() and lab.current_target==null:put_down();return true
	if event is InputEventMouseButton and event.pressed:
		if event.button_index==MOUSE_BUTTON_LEFT and crowbar_equipped:strike();return true
		if event.button_index in [MOUSE_BUTTON_WHEEL_UP,MOUSE_BUTTON_WHEEL_DOWN]:
			if holding():return true
			if lab.expansion.equipped:lab.expansion.set_equipped(false);equip_bar();return true
			if crowbar_equipped:crowbar_equipped=false;return true
	return false
func _process(delta: float) -> void:
	if lab==null:return
	if holding():crowbar_equipped=false
	crowbar.visible=crowbar_equipped and lab.player.enabled
	cleanup_time+=delta
	if cleanup_time>1:
		cleanup_time=0
		for key in glass_targets.keys():
			if not is_instance_valid(glass_targets[key]):glass_targets.erase(key)
		lab.polish.breakables=lab.polish.breakables.filter(func(t):return is_instance_valid(t))
	if lab.paused:return
	swing=maxf(0,swing-delta);crowbar.rotation.x=-sin(swing/.48*PI)*1.1

var calculation_glass: Node3D
var calculation_fluid: Node3D
var calculation_fill: OmniLight3D
func build_calculation_beaker() -> void:
	calculation_glass=vessel("beaker",Vector3(3.65,1.18,-.05),1.0)
	calculation_glass.set_meta("protected_glass",true)
	calculation_fluid=liquid_visual(Vector3(3.65,1.20,-.05),.16,.30,Color(.45,.66,.74,.35),0)
	calculation_fluid.sediment_color=Color(.78,.73,.61)
	calculation_fluid.reparent(calculation_glass)
	lab.expansion.target(Vector3(3.65,1.40,-.05),Vector3(.4,.45,.4),"calculation_beaker","Take calculation beaker")
	if calculation_fill==null:
		calculation_fill=OmniLight3D.new();calculation_fill.position=Vector3(3,2.35,-.05);calculation_fill.light_energy=1.2;calculation_fill.omni_range=2.4;add_child(calculation_fill)
	sync_calculation_beaker()
func sync_calculation_beaker() -> void:
	if calculation_fluid==null:return
	var c=lab.calculations;var states: Array=c.data.get("previews",[])
	var state: Dictionary=states[clampi(c.chosen,0,states.size()-1)] if not states.is_empty() else {}
	calculation_fluid.visible=state.get("accepted",false);calculation_fluid.fill_level=.65
	calculation_fluid.sediment_amount=clampf(float(state.get("visual",{}).get("bedHeight",0))/56,0,1) if calculation_fluid.visible else 0
	calculation_fluid.settling_progress=calculation_fluid.sediment_amount;calculation_fluid.precipitation_progress=calculation_fluid.sediment_amount;calculation_fluid.apply_visuals()
	if lab.accounting!=null:lab.accounting.annotate(calculation_glass,state.get("inventory",{}))
func take_calculation_beaker() -> void:
	if holding():return
	var c=lab.calculations
	held=calculation_glass
	held.set_meta("calculation_record",{"data":c.data.duplicate(true),"conditions":c.conditions.duplicate(true),"chosen":c.chosen})
	held.reparent(lab.player.camera);held.position=Vector3(.32,-.45,-.8);held.rotation=Vector3.ZERO
	calculation_glass=null;calculation_fluid=null
	# Keep the original interaction area; only replace the vessel and its contents.
	var before: int=lab.expansion.get_child_count()
	c.clear_results();build_calculation_beaker()
	for child in lab.expansion.get_children().slice(before):
		if child is Area3D and child.get_meta("interaction","")=="calculation_beaker":child.queue_free()
	lab.expansion.set_equipped(false);c.close();lab.say("Calculation beaker taken. A fresh beaker is ready. E at either station puts it back.",5)
func return_to_station(station: String, local_station_position: Variant=null) -> void:
	var root:Node3D=lab.accounting.held_node()
	if root==null:return
	var restored=false
	if station=="acid" and root.has_meta("titration_record"):
		var record:Dictionary=root.get_meta("titration_record");var w=lab.workbench
		w.setup=record.setup.duplicate(true);w.points=record.points.duplicate(true);w.diagrams=record.diagrams.duplicate(true);w.chosen=record.chosen;w.serial+=1
		lab.expansion.sample_away=false;w.apply_vessel();restored=true
	elif station=="calculation" and root.has_meta("calculation_record"):
		var record:Dictionary=root.get_meta("calculation_record");var c=lab.calculations
		c.data=record.data.duplicate(true);c.conditions=record.conditions.duplicate(true);c.chosen=record.chosen
		sync_calculation_beaker();c.sync_plot();restored=true
	if restored:
		# Transfer the recorded contents into the fixed vessel; no second beaker in its space.
		if held==root:held=null
		if lab.expansion.carried==root:lab.expansion.carrying=false;lab.expansion.carried=null;lab.expansion.snapshot={}
		if lab.polish.carried_output==root:lab.polish.carried_output=null;lab.polish.carried_kind="";lab.polish.carried_record={}
		root.queue_free()
	else:
		root=put_down(local_station_position if local_station_position!=null else (Vector3(3.65,1.18,-.05) if station=="calculation" else Vector3(-3.35,1.18,4.55)))
		if root==null:return
	lab.say("Beaker put in "+("Acid–Base Titration" if station=="acid" else "Calculation")+" workstation.",4)

func safe_glass_position(desired:Vector3,item:Node3D):
	var radius=.20*float(item.get_meta("glass_scale",1))+.025
	var height=float(item.get_meta("glass_height",.4))
	var shape=CylinderShape3D.new();shape.radius=radius;shape.height=height
	var excluded=[lab.player.get_rid()]
	for collider in item.find_children("*","CollisionObject3D",true,false):excluded.append(collider.get_rid())
	var space=get_world_3d().direct_space_state
	for offset in [Vector3.ZERO,Vector3(.4,0,0),Vector3(-.4,0,0),Vector3(0,0,.4),Vector3(0,0,-.4),Vector3(.4,0,.4),Vector3(-.4,0,-.4)]:
		var p=desired+offset
		var q=PhysicsShapeQueryParameters3D.new();q.shape=shape;q.transform.origin=p+Vector3(0,height*.5+.018,0);q.collision_mask=1;q.exclude=excluded
		if not space.intersect_shape(q).is_empty():continue
		var clear=true
		for other in get_tree().get_nodes_in_group("laboratory_glass"):
			if other==item or not other.is_visible_in_tree():continue
			var d=other.global_position-p
			if absf(d.y)<maxf(height,float(other.get_meta("glass_height",.4))) and Vector2(d.x,d.z).length()<radius+.20*float(other.get_meta("glass_scale",1))+.025:clear=false;break
		if not clear:continue
		# All four sides must be supported at the selected height, avoiding table edges.
		for edge in [Vector3(radius,0,0),Vector3(-radius,0,0),Vector3(0,0,radius),Vector3(0,0,-radius)]:
			var ray=PhysicsRayQueryParameters3D.create(p+edge+Vector3.UP*.02,p+edge-Vector3.UP*.12,1,excluded)
			var hit=space.intersect_ray(ray)
			if hit.is_empty() or hit.normal.y<.8:clear=false;break
		if clear:return p
	return null
