extends SceneTree
var lab: Node3D
var checks: Array=[]
func _initialize() -> void:call_deferred("run")
func check(ok: bool,message: String) -> void:
	checks.append({"pass":ok,"check":message});print("PASS " if ok else "FAIL ",message)
func capture(file: String) -> void:
	await create_timer(.3).timeout
	if DisplayServer.get_name()!="headless":root.get_texture().get_image().save_png("res://validation/calculation-pass/"+file+".png")
func aim(position: Vector3,point: Vector3) -> void:
	lab.player.position=position;lab.player.velocity=Vector3.ZERO;lab.player.camera.look_at(point);await physics_frame;await physics_frame;lab.find_target()
func run() -> void:
	lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);await process_frame;await process_frame;lab.close_panel()
	var c=lab.calculations;var p=lab.polish;var e=lab.expansion;var w=lab.workbench
	check(lab.room.find_children("*","Node3D",true,false).all(func(n):return n.get_script()!=load("res://scripts/lab_visitor.gd")),"Female character removed")
	await aim(Vector3(.6,.02,-1.6),Vector3(.6,2.25,-3.59));check(lab.current_target!=null and lab.current_target.get_meta("interaction","")=="periodic","Periodic screen reachable on staircase glass")
	await capture("periodic-glass")
	await aim(Vector3(1.4,.02,.85),Vector3(3.08,1.95,.85));check(lab.current_target!=null and lab.current_target.get_meta("interaction","")=="calculation","Calculation monitor reachable beside filtration")
	await capture("calculation-bench")
	var original_setup: Dictionary=w.setup.duplicate(true)
	lab.interact("calculation");check(c.visible and not lab.player.enabled,"Calculation opens and releases FPS control")
	c.run_calculation();var start:=Time.get_ticks_msec()
	while c.busy and Time.get_ticks_msec()-start<125000:await process_frame
	check(c.data.get("ok",false),"Native calculation interface runs real worker")
	check(w.setup==original_setup,"Calculation does not change titration stock or volume")
	c.conditions[0].min=2;c.conditions[0].max=12;c.conditions[0].points=11;c.conditions.append({"componentId":"component:Ca%202%2B","name":"Ca 2+","role":"basis-choice","choice":0,"value":.01,"min":-4,"max":-1,"points":8});c.data=JSON.parse_string(FileAccess.get_file_as_string("res://validation/calculation-pass/sweep.json"));c.rebuild();await capture("calculation-sweep")
	c.conditions[-1].choice=6;c.data=JSON.parse_string(FileAccess.get_file_as_string("res://validation/calculation-pass/grid.json"));c.rebuild();await capture("calculation-grid")
	var drag:=InputEventMouseButton.new();drag.button_index=MOUSE_BUTTON_LEFT;drag.pressed=true;c.plot._gui_input(drag)
	var motion:=InputEventMouseMotion.new();motion.relative=Vector2(40,10);var before: float=c.plot.yaw;c.plot._gui_input(motion);check(c.plot.yaw!=before,"3D graph rotates with mouse drag")
	c.close();check(lab.player.enabled,"Leaving calculation restores FPS")
	var fixture: Dictionary=JSON.parse_string(FileAccess.get_file_as_string("res://validation/bench-expansion/carbonate.json"))
	w.setup=fixture.setup;w.points=fixture.points;w.diagrams=fixture.diagrams;w.chosen=w.points.size()-1
	e.take_sample();e.use_filter();await create_timer(5.2).timeout
	check(not e.outputs.is_empty(),"Filtration completes before output transport")
	await aim(Vector3(2,.02,2.67),Vector3(3.65,1.38,2.67));check(lab.current_target!=null and lab.current_target.get_meta("interaction","")=="output_residue","Residue pickup is unobstructed by filtration controls")
	lab.interact("output_residue");var vessel: Node3D=p.carried_output
	check(vessel!=null and not e.output_solid.visible,"Residue removed from filtration into hands")
	p.take_output("filtrate");check(p.carried_output==vessel,"Cannot hold or duplicate a second output")
	e.owns_rifle=true;e.set_equipped(true);check(not e.equipped,"Carrying output prevents drawing rifle")
	p.place_output("balance");check(p.carried_output==null and p.get_meta("placed_balance")==vessel,"Same beaker placed on balance")
	await aim(Vector3(1.9,.02,1.9),Vector3(3.65,1.35,1.9));await capture("balance-output")
	p.place_output("balance");check(p.carried_output==vessel,"Same inventory retrieved from balance")
	p.place_output("analysis");p.take_output("filtrate");check(p.carried_kind=="filtrate" and not e.output_liquid.visible,"Filtrate independently carryable")
	p.place_output("acid_return");check(p.has_meta("placed_acid_return"),"Filtrate placed at other workstation")
	check(p.get_meta("placed_acid_return").get_meta("record").filtrate==e.outputs.filtrate,"Dissolved inventory survives transport")
	e.use_filter();check(p.has_meta("placed_analysis") and p.has_meta("placed_acid_return"),"Clearing filtration preserves transported samples")
	await aim(Vector3(1.6,.02,-.2),Vector3(3.55,1.33,-.2))
	e.set_equipped(true);e.chambered=true;e.cooldown=0;e.fire();await process_frame
	check(not p.breakables[0].get_meta("breakable").visible,"Firing ray breaks designated glassware")
	check(e.held_rifle.position.z>-.47 and e.shot.playing,"Shot plays sound and recoils")
	await capture("rifle-held")
	var actor: Node3D=lab.room.actors[0];var target: Area3D
	for child in actor.get_children():
		if child is Area3D and child.has_meta("actor"):target=child
	p.hit_target({"collider":target,"position":actor.global_position+Vector3.UP});check(actor.get_meta("health")==66,"NPC takes non-graphic damage")
	p.hit_target({"collider":target,"position":actor.global_position});p.hit_target({"collider":target,"position":actor.global_position});check(actor.get_meta("health")==0 and target.collision_layer==0,"NPC becomes nonblocking incapacitated after hits")
	var f:=FileAccess.open("res://validation/calculation-pass/checks.json",FileAccess.WRITE);f.store_string(JSON.stringify(checks,"  "));f.close()
	lab.queue_free();await process_frame;quit(1 if checks.any(func(v):return not v.pass) else 0)
