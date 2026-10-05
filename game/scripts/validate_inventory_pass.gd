extends SceneTree
var lab
var failures:=0
func _initialize():call_deferred("run")
func check(ok: bool,title: String):
	print(("PASS " if ok else "FAIL ")+title)
	if not ok:failures+=1
func capture(name: String):
	await process_frame;await process_frame;await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png("res://validation/"+name+".png")
func run():
	lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);await process_frame;await process_frame;lab.close_panel()
	var c=lab.calculations;var g=lab.glassware;var a=lab.accounting;var e=lab.expansion;var w=lab.workbench;var p=lab.polish
	c.data=JSON.parse_string(FileAccess.get_file_as_string("res://validation/inventory-calculation.json"));c.chosen=0;g.sync_calculation_beaker()
	check(g.calculation_glass.get_meta("inventory").basisKgWater==1,"Calculation sample has explicit 1 kg water inventory")
	g.take_calculation_beaker();e.use_filter();check(e.filtering,"Calculation sample can be filtered")
	e.finish_filter();p.take_output("residue");var mass: float=p.carried_output.get_meta("inventory").drySolidMassG
	check(mass>0 and p.carried_output.get_meta("inventory").aqueous.is_empty(),"Filtered residue retains solid mass only")
	a.transfer();check(is_instance_valid(a.jar) and absf(a.jar.get_meta("inventory").drySolidMassG-mass)<1e-12,"Transfer preserves exact solid inventory")
	check(g.held.get_meta("inventory").drySolidMassG==0 and g.held.get_meta("inventory").solids.is_empty(),"Transfer empties source without duplicating precipitate")
	a.transfer();check(g.held.get_meta("inventory").drySolidMassG==0,"Second transfer cannot duplicate sample")
	g.put_down(Vector3(3.6,1.08,9.65));p.take_output("filtrate")
	check(p.carried_output.get_meta("inventory").solids.is_empty(),"Filtrate retains aqueous composition without solids")
	g.put_down(Vector3(3.96,1.08,9.65));e.use_filter()
	var fixture=JSON.parse_string(FileAccess.get_file_as_string("res://validation/inventory-titration.json"));w.setup=fixture.setup;w.points=fixture.points;w.diagrams=fixture.diagrams;w.chosen=w.points.size()-1;w.apply_vessel()
	check(e.take_sample(),"Titration sample remains carryable")
	check(e.carried.get_meta("inventory").basisKgWater==e.snapshot.modelSolventMassKg,"Titration inventory follows actual model basis")
	e.return_sample();w.open(false);await capture("inventory-titration-axes");w.close()
	a.show_inventory(a.jar.get_meta("inventory"));await capture("inventory-inspection");a.close_inventory()
	lab.player.position=Vector3(1.7,.03,10.8);lab.player.camera.look_at(Vector3(4.4,1.25,11.0));await capture("inventory-transfer-station")
	check(g.wash_slots.size()==8,"Narrow wash station retains eight storage slots")
	lab.interact("plant_gate");var zombie=lab.zombies.walkers[0];lab.player.position=zombie.body.position+Vector3(0,.03,1.15)
	for i in 100:await physics_frame
	check(zombie.swings>0,"Nearby zombie performs swings")
	check(not lab.player.has_meta("damage"),"Swing does not create player damage")
	lab.player.camera.look_at(zombie.body.global_position+Vector3.UP*1.3);await capture("inventory-zombie-swing")
	lab.queue_free();await process_frame;quit(1 if failures else 0)
