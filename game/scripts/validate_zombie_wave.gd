extends SceneTree
var failures:=0
func _initialize():call_deferred("run")
func check(ok: bool,title: String):
	print(("PASS " if ok else "FAIL ")+title)
	if not ok:failures+=1
func run():
	var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);await process_frame;await process_frame;lab.close_panel()
	check(lab.zombies==null,"No zombies before opening conversion door")
	lab.interact("plant_gate");lab.interact("plant_gate")
	check(lab.zombies.walkers.size()==3,"Opening door starts exactly one three-zombie wave")
	lab.player.position=Vector3(-2,.02,9.5);lab.player.camera.look_at(Vector3(-6,1,9.5))
	for i in 1100:await physics_frame
	var walker=lab.zombies.walkers[0]
	check(walker.body.position.x>-5.8,"Zombie walks through opened facility doorway into lab")
	walker.body.position=Vector3(0,.03,2);walker.route=[]
	lab.player.position=Vector3(0,.03,0.6)
	await physics_frame;await physics_frame
	lab.player.camera.look_at(walker.body.global_position+Vector3.UP)
	await process_frame;await process_frame;root.get_texture().get_image().save_png("res://validation/zombie-entry.png")
	var e=lab.expansion;e.owns_rifle=true;e.set_equipped(true);e.chambered=true;e.cooldown=0
	var rounds: int=e.rounds;e.fire()
	check(walker.body.get_meta("down",false) and e.rounds==rounds-1,"One actual rifle bullet drops zombie")
	check(walker.target.collision_layer==0,"Downed zombie no longer catches bullets")
	lab.queue_free();await process_frame;quit(1 if failures else 0)

