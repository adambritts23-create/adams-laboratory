extends "res://scripts/lab_props.gd"
var lab: Node3D
var marks:=true
var tick:=0.0
var restore_player:=true
var popup: PanelContainer
var jar: Node3D
var credits:=0.0
var wallet_idle=0.0
var wallet: Label
func build(world: Node3D) -> void:
	lab=world;init_materials();set_meta("dynamic",true)
	wallet=Label.new();wallet.position=Vector2(26,132);wallet.text="";lab.game_ui.add_child(wallet);wallet.hide()
	box(Vector3(4.55,.5,11.65),Vector3(2.2,1,.8),painted,true)
	box(Vector3(4.55,1.04,11.65),Vector3(2.3,.08,.88),metal,true)
	plaque("PRECIPITATE / TRANSFER",Vector3(3.39,.77,11.65),Vector2(.76,.24),-PI/2)
	lab.expansion.target(Vector3(3.36,1.12,11.65),Vector3(.18,.35,.78),"solid_transfer","Transfer carried filtered precipitate into container")
	label_at("E · TRANSFER SOLIDS",Vector3(3.35,1.40,11.65),19,Color.WHITE,.0015).rotation.y=-PI/2
func held_node() -> Node3D:
	if lab.glassware.held!=null:return lab.glassware.held
	if lab.expansion.carrying:return lab.expansion.carried
	return lab.polish.carried_output
func selected_node() -> Node3D:
	var node:=held_node()
	if node!=null:return node
	var target: Object=lab.current_target
	if target!=null:
		if target.has_meta("breakable"):return target.get_meta("breakable")
		var id: String=target.get_meta("interaction","")
		if id in ["acid","carry_sample"]:return lab.room.sample_vessel
		if id in ["calculation","calculation_beaker"]:return lab.glassware.calculation_glass
		if id=="output_residue":return lab.expansion.output_solid
		if id=="output_filtrate":return lab.expansion.output_liquid
		if id in ["home_acid","home_sample"] and lab.economy.extensions!=null and lab.economy.extensions.home_lab!=null:return lab.economy.extensions.home_lab.titration_vessel
		if id=="home_residue":return lab.expansion.output_solid
		if id=="home_filtrate":return lab.expansion.output_liquid
		if id in ["home_calculation","home_calculation_sample"]:return lab.glassware.calculation_glass
	return null
func summary(inv: Dictionary) -> String:
	if not inv.get("available",false):return "Inventory unavailable"
	var mass=inv.get("drySolidMassG")
	var text:="Dry solids: "+("%.5f g" % float(mass) if mass!=null else "unavailable")
	for solid in inv.get("solids",[]):
		text+="\n%s: %s" % [solid.name,("%.5f g" % float(solid.massG)) if solid.get("massG")!=null else "mass unavailable"]
	for c in inv.get("components",[]):
		if c.get("ok",false):
			var fraction: float=c.solidFraction
			var percent: String=">99.9%" if fraction>.999 and fraction<1 else "<0.1%" if fraction>0 and fraction<.001 else "%.1f%%" % (100*fraction)
			text+="\n%s: %s in solids" % [c.name,percent]
	return text
func annotate(node: Node3D,inv: Dictionary) -> void:
	if not is_instance_valid(node):return
	node.set_meta("inventory",inv.duplicate(true))
	var note: Label3D=node.get_node_or_null("SampleMark")
	if note==null:
		note=Label3D.new();note.name="SampleMark";node.add_child(note);note.position=Vector3(0,.21,.17);note.rotation.z=-.035;note.font_size=26;note.pixel_size=.00080;note.outline_size=3;note.modulate=Color(1,1,.94);note.no_depth_test=false;note.billboard=BaseMaterial3D.BILLBOARD_ENABLED
		var font:=SystemFont.new();font.font_names=PackedStringArray(["Segoe Print","Comic Sans MS"]);note.font=font
	note.text=summary(inv);note.visible=marks and inv.get("available",false)
func show_inventory(inv: Dictionary) -> void:
	if popup!=null:return
	popup=PanelContainer.new();popup.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);popup.offset_left=70;popup.offset_right=-70;popup.offset_top=50;popup.offset_bottom=-50;lab.game_ui.add_child(popup)
	var style:=StyleBoxFlat.new();style.bg_color=Color("10272e");style.set_content_margin_all(20);popup.add_theme_stylebox_override("panel",style)
	var box:=VBoxContainer.new();popup.add_child(box)
	lab.workbench.button(box,"Close inventory · Esc / I",close_inventory)
	var text:=RichTextLabel.new();text.size_flags_vertical=Control.SIZE_EXPAND_FILL;text.add_theme_font_size_override("normal_font_size",20);box.add_child(text)
	text.text=summary(inv)+"\n\n"
	if inv.get("available",false):
		text.text+="Reference basis: %.6f kg model water (not retained water after filtration). Calculation beaker illustration: nominal 1 L, not a density conversion.\n" % float(inv.basisKgWater)
		for phase in ["solids","aqueous"]:
			text.text+="\n"+phase.to_upper()+"\n"
			for row in inv.get(phase,[]):text.text+="%s: %.6f mol · %s\n" % [row.name,row.moles,("%.6f g" % float(row.massG)) if row.get("massG")!=null else "mass unavailable"]
		for c in inv.get("components",[]):
			if not c.get("ok",false):text.text+="\n"+c.name+": yield unavailable — "+c.reason
		text.text+="\nRepresented dissolved species mass: "+(str(inv.representedDissolvedMassG)+" g" if inv.get("representedDissolvedMassG")!=null else "unavailable")
		text.text+="\n\n"+inv.get("note","")
	restore_player=lab.player.enabled;lab.player.enabled=false;Input.mouse_mode=Input.MOUSE_MODE_VISIBLE
func close_inventory() -> void:
	if popup!=null:popup.queue_free();popup=null
	lab.player.enabled=restore_player;Input.mouse_mode=Input.MOUSE_MODE_CAPTURED if restore_player else Input.MOUSE_MODE_VISIBLE
func handle(event: InputEvent) -> bool:
	if popup!=null and (event.is_action_pressed("ui_cancel") or (event is InputEventKey and event.pressed and event.physical_keycode==KEY_I)):close_inventory();return true
	if not lab.player.enabled or lab.paused:return false
	if event is InputEventMouseButton and event.pressed and event.button_index==MOUSE_BUTTON_LEFT and held_node()!=null:
		pour(false);return true
	if event is InputEventKey and event.pressed and not event.echo:
		if event.physical_keycode==KEY_M:marks=not marks;return true
		if event.physical_keycode==KEY_I:
			var node:=selected_node();show_inventory(node.get_meta("inventory",{}) if node!=null else {});return true
	return false
func transfer(destination:Vector3=Vector3(3.8,1.09,11.65)) -> void:
	var source:=held_node()
	if source==null:lab.say("Carry the filtered precipitate beaker here first.");return
	var inv: Dictionary=source.get_meta("inventory",{})
	if not inv.get("available",false) or inv.get("solids",[]).is_empty() or not inv.get("aqueous",[]).is_empty():lab.say("Use suction filtration first; this station accepts isolated precipitate.");return
	if is_instance_valid(jar) and jar.global_position.distance_to(destination)<.4:lab.say("Move the previous container first.");return
	jar=vessel("bottle",destination,.85,paper,"SOLIDS")
	annotate(jar,inv);lab.glassware.register_glass(jar)
	empty_vessel(source)
	lab.say("Precipitate transferred. I inspects the container; E picks it up. Empty beaker remains in your hand.",6)
func show_wallet():
	wallet_idle=8.0
	if wallet!=null:wallet.text=wallet.get_meta("expanded_text",wallet.text)
func update_wallet(delta:float):
	if wallet==null:return
	wallet.visible=lab.player.enabled
	if not lab.paused:wallet_idle=maxf(0,wallet_idle-delta)
	wallet.text=wallet.get_meta("expanded_text",wallet.text) if wallet_idle>0 else "Inventory · [I]"
func _process(delta: float) -> void:
	update_wallet(delta)
	tick+=delta
	if tick<.4 or lab==null:return
	tick=0
	var w=lab.workbench
	annotate(lab.room.sample_vessel,w.points[w.chosen].get("inventory",{}) if not w.points.is_empty() else {})
	for node in get_tree().get_nodes_in_group("laboratory_glass"):
		var note: Label3D=node.get_node_or_null("SampleMark")
		if note!=null:note.visible=marks and node.get_meta("inventory",{}).get("available",false)

# Disposal consumes the saved experiment too: returning an empty vessel cannot restore it.
func empty_vessel(source: Node3D) -> void:
	var inv: Dictionary=source.get_meta("inventory",{}).duplicate(true)
	inv["solids"]=[];inv["aqueous"]=[];inv["components"]=[];inv["drySolidMassG"]=0.0;inv["representedDissolvedMassG"]=0.0
	annotate(source,inv);source.set_meta("emptied",true)
	for key in ["record","transport_record","titration_record","calculation_record","kind"]:
		if source.has_meta(key):source.remove_meta(key)
	source.set_meta("transport_kind","decor")
	if lab.expansion.carried==source:
		lab.expansion.carrying=false;lab.expansion.carried=null;lab.expansion.snapshot={};lab.expansion.sample_away=false
	if lab.polish.carried_output==source:
		lab.polish.carried_output=null;lab.polish.carried_kind="";lab.polish.carried_record={}
	lab.glassware.held=source
	for child in source.get_children():
		if child.get_meta("sample_contents",false) or child.get_meta("sample_sediment",false) or child.get_meta("filter_output",false):child.hide();child.queue_free()
func has_contents(source: Node3D) -> bool:
	if source.get_meta("emptied",false):return false
	var inv: Dictionary=source.get_meta("inventory",{})
	if not inv.get("solids",[]).is_empty() or not inv.get("aqueous",[]).is_empty():return true
	for child in source.get_children():
		if child.get_meta("sample_contents",false) or child.get_meta("sample_sediment",false):return true
	return false
func pour(basin: bool, basin_position: Vector3=Vector3(4.95,.85,10.18)) -> void:
	var source:=held_node()
	if source==null:lab.say("Carry a beaker to pour out its contents.");return
	if not has_contents(source):lab.say("The beaker is already empty.");return
	var camera: Camera3D=lab.player.camera
	var start: Vector3=camera.global_position+Vector3(0,-.15,0)
	var end: Vector3=start-camera.global_basis.z*2.5
	var actor: Node3D
	if basin:end=basin_position
	else:
		var q:=PhysicsRayQueryParameters3D.create(camera.global_position,end,9,[lab.player.get_rid()]);q.collide_with_areas=true
		var hit:=lab.get_world_3d().direct_space_state.intersect_ray(q)
		if not hit.is_empty():
			end=hit.position
			if hit.collider.has_meta("actor"):actor=hit.collider.get_meta("actor")
	if not basin and actor==null:
		var floor_query:=PhysicsRayQueryParameters3D.create(end+Vector3.UP*.1,end-Vector3.UP*5,1,[lab.player.get_rid()])
		var floor_hit:=lab.get_world_3d().direct_space_state.intersect_ray(floor_query)
		if not floor_hit.is_empty() and floor_hit.normal.y>.7:
			end=floor_hit.position+Vector3.UP*.008
			var puddle:=ellipsoid(end,Vector3(.27,.004,.23),material(Color(.17,.30,.33),.2,.12))
			var fade:=create_tween();fade.tween_interval(12);fade.tween_property(puddle,"scale",Vector3.ZERO,2);fade.tween_callback(puddle.queue_free)
	# Brief splash only; no chemistry or health effect is inferred from pouring.
	for i in 12:
		var drop:=ellipsoid(start,Vector3.ONE*.022,material(Color(.56,.76,.81),.1,.2))
		var tween:=create_tween();tween.tween_property(drop,"position",end+Vector3(randf_range(-.16,.16),randf_range(-.12,.12),randf_range(-.16,.16)),.30+float(i)*.013);tween.tween_callback(drop.queue_free)
	empty_vessel(source)
	if actor!=null and int(actor.get_meta("health",100))>0:
		lab.polish.reactions[actor]=.8;lab.say(actor.identity.to_upper()+": What are you doing?! Stop throwing that at me!",5)
	else:lab.say("Contents poured into basin. Empty beaker retained." if basin else "Contents thrown out. Empty beaker retained.",4)
func sell() -> void:
	lab.say("Sample retained. Inspect its composition or transfer it at the laboratory bench.")
