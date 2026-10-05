extends SceneTree
var lab: Node3D
var checks: Array=[]
func _initialize() -> void:call_deferred("run")
func check(ok: bool,text: String) -> void:
	checks.append({"pass":ok,"check":text});print("PASS " if ok else "FAIL ",text)
func capture(file: String) -> void:
	await create_timer(.5).timeout
	if DisplayServer.get_name()!="headless":root.get_texture().get_image().save_png("res://validation/bench-expansion/"+file+".png")
func run() -> void:
	lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);await process_frame;await process_frame;lab.close_panel()
	var e=lab.expansion;var w=lab.workbench
	check(not e.take_sample(),"Uncalculated sample cannot be carried")
	var fixture: Dictionary=JSON.parse_string(FileAccess.get_file_as_string("res://validation/bench-expansion/carbonate.json"))
	w.setup=fixture.setup;w.points=fixture.points;w.diagrams=fixture.diagrams;w.chosen=w.points.size()-1
	w.open(false);await process_frame
	check(e.music.stream!=null and e.music.playing,"CC0 music plays in titration interface")
	for i in w.diagrams.size():
		w.diagram_index=i;w.curve_index=0;w.rebuild();await process_frame
		check(w.graph.diagram.label==w.diagrams[i].label,"Diagram: "+w.diagrams[i].label)
	w.diagram_index=5;w.rebuild();await capture("log-solubility")
	w.diagram_index=0;w.rebuild();await capture("bench-ui")
	w.close();await create_timer(.15).timeout;check(not e.music.playing,"Music stops on returning to room")
	lab.player.position=Vector3(-1.8,.05,6.25);lab.player.camera.look_at(Vector3(-3.8,1.94,5.95));await capture("bench-world")
	check(e.take_sample() and e.carrying and lab.room.sample_vessel.visible and not lab.room.sample_liquid.visible,"Carry leaves a fresh empty source beaker")
	check(not e.take_sample(),"Cannot duplicate carried sample")
	var carried_state: Dictionary=e.snapshot.duplicate(true)
	lab.interact("periodic");check(w.visible and e.snapshot==carried_state,"Preparation screen opens without changing carried sample");w.close()
	e.return_sample();check(not e.sample_away and lab.room.sample_vessel.visible,"Carried sample can return to its bench")
	e.take_sample()
	var original: Dictionary=e.snapshot.duplicate(true)
	lab.player.position=Vector3(1.65,.05,3);lab.player.camera.look_at(Vector3(3.8,1.3,3));await capture("carried-sample")
	e.use_filter();check(e.filtering and not e.carrying,"E places sample and starts pump")
	await create_timer(5.5).timeout
	check(not e.filtering and not e.sample_away and not e.outputs.precipitate.is_empty(),"Filtration completes with calculated solid")
	check(e.outputs.filtrate==original.species and e.outputs.volumeMl==original.volume,"Filtrate preserves dissolved snapshot and volume")
	check(e.outputs.precipitate==original.solids.filter(func(s):return s.amount>0),"Residue preserves calculated solid inventory")
	check(w.points.is_empty(),"Consumed experiment invalidated; cannot duplicate source")
	await capture("filtration-complete")
	e.use_filter();check(not e.outputs.is_empty(),"Previous outputs remain until collected")
	lab.player.position=Vector3(-4.6,.05,10.4);lab.player.camera.look_at(Vector3(-4.8,1.55,8.43));await physics_frame;lab.find_target()
	check(lab.current_target!=null and lab.current_target.get_meta("interaction")=="rifle","Wall rifle selectable by raycast")
	await capture("rifle-wall")
	lab.interact("rifle");check(e.owns_rifle and e.equipped and not e.chambered,"Rifle starts unchambered")
	check(not e.fire() and e.rounds==30,"Cannot fire before chambering")
	e.chamber();await create_timer(.8).timeout;check(e.chambered,"E chambers after animation delay")
	var key:=InputEventKey.new();key.pressed=true;key.physical_keycode=KEY_1;e.handle_input(key);check(not e.equipped,"1 holsters")
	key.physical_keycode=KEY_3;e.handle_input(key);check(e.equipped,"3 draws")
	var wheel:=InputEventMouseButton.new();wheel.pressed=true;wheel.button_index=MOUSE_BUTTON_WHEEL_DOWN;e.handle_input(wheel);check(not e.equipped,"Mouse wheel holsters")
	wheel.button_index=MOUSE_BUTTON_WHEEL_UP;e.handle_input(wheel);check(e.equipped,"Mouse wheel draws")
	lab.open_pause();check(not e.fire(),"Pause blocks firing");lab.close_panel()
	await capture("rifle-held")
	var shots:=0
	for i in 31:
		e.cooldown=0
		if e.fire():shots+=1
	check(shots==30 and e.rounds==0,"Exactly thirty shots; no replenishment")
	w.open(true);await create_timer(.15).timeout;check(not e.fire() and e.music.playing,"UI blocks firearm and plays soundtrack")
	w.close();e.set_equipped(false)
	lab.interact("axel");check(lab.subtitle.text=="AXEL: I fear for Adam's mental state lately.","Updated Axel dialogue")
	var f:=FileAccess.open("res://validation/bench-expansion/checks.json",FileAccess.WRITE);f.store_string(JSON.stringify(checks,"  "));f.close()
	lab.queue_free();await process_frame;quit(1 if checks.any(func(c):return not c.pass) else 0)
