extends SceneTree
var lab: Node3D
var checks: Array=[]
func check(value: bool,message: String) -> void:
	checks.append({"pass":value,"check":message});print("PASS " if value else "FAIL ",message)
func _initialize() -> void:call_deferred("run")
func run() -> void:
	lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab)
	await process_frame;await process_frame
	lab.close_panel()
	check(lab.phase==lab.Phase.FREE_EXPLORE,"Free laboratory on launch")
	check(not lab.room.lower_lab.unlocked and not lab.room.facility.access.unlocked,"Doors remain closed on startup")
	lab.interact("lower_gate");lab.interact("plant_gate")
	check(lab.room.lower_lab.unlocked and lab.room.facility.access.unlocked,"E opens both access doors")
	check(lab.room.actors.size()==2,"Adam and Axel retained")
	lab._process(1000)
	check(lab.phase==lab.Phase.FREE_EXPLORE,"No incident after extended exploration")
	lab.interact("periodic");await process_frame
	check(lab.workbench.visible,"Periodic screen interaction")
	await create_timer(1).timeout
	if DisplayServer.get_name()!="headless":root.get_texture().get_image().save_png("res://validation/free-lab/periodic-table.png")
	lab.workbench.close();lab.interact("acid");await process_frame
	lab.workbench.prepare()
	var start:=Time.get_ticks_msec()
	while lab.workbench.busy and Time.get_ticks_msec()-start<120000:await process_frame
	check(lab.workbench.points.size()>100,"Real engine prepared dose series")
	if not lab.workbench.points.is_empty():
		check(absf(float(lab.workbench.points[0].y)-13.0015)<.01,"Initial H+/OH- sample agrees with reference")
		var count: int=lab.workbench.solve_count
		lab.workbench.select_point(50)
		var dose: int=lab.workbench.chosen
		lab.workbench.close();lab.interact("acid")
		check(lab.workbench.chosen==dose and lab.workbench.solve_count==count,"Return to bench preserves dose with zero solves")
		check(lab.room.sample_liquid.sediment_amount==0,"No invented precipitate in acid-base system")
	await create_timer(1).timeout
	if DisplayServer.get_name()!="headless":root.get_texture().get_image().save_png("res://validation/free-lab/wet-lab.png")
	var click:=InputEventMouseButton.new();click.button_index=MOUSE_BUTTON_LEFT;click.pressed=true;click.position=Vector2(lab.workbench.graph.size.x-20,100)
	lab.workbench.graph._gui_input(click)
	check(lab.workbench.chosen==lab.workbench.points.size()-1,"Graph click selects calculated dose")
	check(lab.workbench.selector.selected==lab.workbench.chosen,"Graph selection synchronized with sample selector")
	lab.workbench.set_dose(50.01)
	while lab.workbench.busy:await process_frame
	check(absf(float(lab.workbench.points[lab.workbench.chosen].x)-50.01)<.00001,"Custom dose calculated and selected")
	lab.workbench.setup.sample.initialPH="invalid"
	lab.workbench.invalidate()
	check(lab.workbench.points.is_empty(),"Stock edits invalidate previous results")
	lab.workbench.prepare()
	while lab.workbench.busy:await process_frame
	check(lab.workbench.points.is_empty() and lab.workbench.status.text.contains("finite"),"Invalid stock refused with visible diagnostic")
	lab.workbench.close()
	lab.player.position=Vector3(.6,.05,-1.6)
	lab.player.camera.look_at(Vector3(.6,2.25,-3.59))
	await physics_frame;lab.find_target()
	check(lab.current_target!=null and lab.current_target.get_meta("interaction")=="periodic","Physical screen raycast interaction")
	await create_timer(.5).timeout
	if DisplayServer.get_name()!="headless":root.get_texture().get_image().save_png("res://validation/free-lab/preparation-screen-in-room.png")
	var output:=FileAccess.open("res://validation/free-lab/checks.json",FileAccess.WRITE);output.store_string(JSON.stringify(checks,"  "));output.close()
	lab.queue_free();await process_frame;quit(1 if checks.any(func(c):return not c.pass) else 0)

