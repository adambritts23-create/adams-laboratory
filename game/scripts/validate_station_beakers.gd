extends SceneTree
var failures:=0
func _initialize():call_deferred("run")
func check(ok: bool,title: String):
	print(("PASS " if ok else "FAIL ")+title)
	if not ok:failures+=1
func run():
	var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);await process_frame;await process_frame;lab.close_panel()
	var g=lab.glassware;var c=lab.calculations;var w=lab.workbench;var e=lab.expansion
	c.data=JSON.parse_string(FileAccess.get_file_as_string("res://validation/glassware-pass/calculation.json"));c.chosen=c.data.previews.size()-1;g.sync_calculation_beaker()
	check(g.calculation_fluid.visible and g.calculation_fluid.sediment_amount>0,"Physical calculation beaker reflects accepted precipitate")
	var old=g.calculation_glass;g.take_calculation_beaker()
	check(g.held==old and g.calculation_glass!=old,"Taking calculation beaker creates another physical vessel")
	check(not g.calculation_fluid.visible and c.data.is_empty(),"Replacement calculation beaker is empty")
	g.put_down(Vector3(2,0,2));var id: String=old.get_meta("glass_target").get_meta("interaction").trim_prefix("glass_");g.pickup(id);lab.interact("calculation")
	check(not g.holding() and not c.data.is_empty() and g.calculation_fluid.sediment_amount>0,"Returning calculation beaker restores saved result")
	var fixture=JSON.parse_string(FileAccess.get_file_as_string("res://validation/bench-expansion/carbonate.json"));w.setup=fixture.setup;w.points=fixture.points;w.diagrams=fixture.diagrams;w.chosen=w.points.size()-1;w.apply_vessel()
	check(e.take_sample(),"Take titration sample")
	var first=e.carried;g.put_down(Vector3(2,0,3))
	check(lab.room.sample_vessel.visible and not lab.room.sample_liquid.visible and w.points.is_empty(),"Titration station immediately has fresh empty beaker")
	w.points=fixture.points.duplicate(true);w.diagrams=fixture.diagrams.duplicate(true);w.chosen=w.points.size()-1;w.apply_vessel();check(e.take_sample(),"Can take second sample while first is parked")
	g.put_down(Vector3(2,0,4));id=first.get_meta("glass_target").get_meta("interaction").trim_prefix("glass_");g.pickup(id);lab.interact("acid")
	check(w.chosen==fixture.points.size()-1 and not g.holding(),"First sample can return after another was taken")
	w.open(false);await process_frame;await process_frame
	var primary=w.find_child("PrepareExperiment",true,false);check(primary.size.y>=42,"Prepare experiment is a large primary action")
	await process_frame;root.get_texture().get_image().save_png("res://validation/station-menu.png");w.close()
	lab.player.position=Vector3(1.8,.02,-.15);lab.player.camera.look_at(Vector3(3.65,1.4,-.05));await process_frame;await process_frame
	root.get_texture().get_image().save_png("res://validation/station-physical-beaker.png")
	lab.queue_free();await process_frame;quit(1 if failures else 0)
