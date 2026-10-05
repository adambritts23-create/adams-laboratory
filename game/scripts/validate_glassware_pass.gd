extends SceneTree
var lab: Node3D
var checks: Array=[]
func _initialize():call_deferred("run")
func check(ok: bool,text: String):checks.append({"pass":ok,"check":text});print("PASS " if ok else "FAIL ",text)
func capture(file: String):
	await create_timer(.4).timeout
	if DisplayServer.get_name()!="headless":root.get_texture().get_image().save_png("res://validation/glassware-pass/"+file+".png")
func aim(pos: Vector3,point: Vector3):
	lab.player.position=pos;lab.player.velocity=Vector3.ZERO;lab.player.camera.look_at(point);await physics_frame;await physics_frame;lab.find_target()
func run():
	lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);await process_frame;await process_frame;lab.close_panel();await process_frame
	var g=lab.glassware;var c=lab.calculations;var w=lab.workbench;var e=lab.expansion
	check(g.glass_targets.size()>100,"Most room glassware has interaction and damage targets")
	c.open();c.conditions=[{"componentId":"component:H%2B","name":"H+","role":"proton","choice":4,"min":2,"max":12,"points":31,"value":0},{"componentId":"component:H2O","name":"H2O","role":"solvent","choice":1,"value":0},{"componentId":"component:Ca%202%2B","name":"Ca 2+","role":"basis-choice","choice":0,"value":.01},{"componentId":"component:CO3%202-","name":"CO3 2-","role":"basis-choice","choice":0,"value":.01}]
	c.data=JSON.parse_string(FileAccess.get_file_as_string("res://validation/glassware-pass/calculation.json"));c.series_index=-1;c.rebuild();c.select_point(0)
	check(c.plot.series_index==-1 and c.data.diagrams[0].series.size()>3,"Calculation defaults to all concentration curves")
	var fill: float=c.preview.liquid.fill_level;check(c.preview.liquid.sediment_amount==0,"Accepted dissolved result has no sediment")
	await capture("calculation-dissolved")
	c.select_point(c.data.previews.size()-1);check(c.preview.liquid.sediment_amount>0,"Accepted solid result changes preview precipitate")
	check(c.preview.liquid.fill_level==fill,"Calculation preview liquid level remains fixed")
	await capture("calculation-precipitate")
	c.data.previews[c.chosen]={"accepted":false,"visual":{"bedHeight":0},"message":"Unavailable"};c.update_preview();check(not c.preview.liquid.visible,"Failed equilibrium hides preview rather than inventing contents")
	c.close()
	var fixture: Dictionary=JSON.parse_string(FileAccess.get_file_as_string("res://validation/bench-expansion/carbonate.json"));w.setup=fixture.setup;w.points=fixture.points;w.diagrams=fixture.diagrams;w.chosen=w.points.size()-1;w.diagram_index=1;w.curve_index=-1;w.open(false)
	check(w.graph.diagram.has("all_series") and w.graph.diagram.all_series.size()>1,"Titration log concentrations plot all curves")
	await capture("titration-log-concentrations")
	for i in w.diagrams.size():
		if w.diagrams[i].key.begins_with("solubility"):w.diagram_index=i;break
	w.rebuild();check(w.graph.diagram.label.contains("solubility"),"Log solubility selectable at titration bench");await capture("titration-log-solubility");w.close()
	check(e.take_sample(),"Accepted titration sample carried")
	var vessel: Node3D=e.carried;g.put_down(Vector3(3.6,1.08,9.65));check(not e.carrying and e.sample_away,"Titration beaker can be parked without losing source state")
	var id: String=vessel.get_meta("glass_target").get_meta("interaction").trim_prefix("glass_");g.pickup(id);check(e.carrying and e.carried==vessel,"Parked titration sample resumes as the same object")
	e.return_sample();check(not e.sample_away,"Parked sample still returns correctly to titration")
	var area: Area3D=lab.polish.breakables[0];id=area.get_meta("interaction").trim_prefix("glass_");g.pickup(id);check(g.held!=null,"Decorative glassware is carryable")
	g.wash();check(g.held==null and g.wash_occupied.size()==1,"Wash station accepts glassware")
	g.pickup(id);await aim(Vector3(2.2,.02,10.7),Vector3(2.2,2,11.5));g.put_down();check(g.held==null and area.collision_layer==12,"Looking away from a bench still allows putting glassware down")
	g.pickup(id);g.wash();await aim(Vector3(1.7,.02,10.6),Vector3(4.6,1.05,10.6));await capture("wash-station")
	await aim(Vector3(2.2,.02,9.65),Vector3(3.6,1.25,9.65));check(lab.current_target!=null and str(lab.current_target.get_meta("interaction","")).begins_with("glass_"),"Stored beaker remains reachable by E raycast")
	lab.interact("crowbar");check(g.owns_crowbar and g.crowbar_equipped and not e.equipped,"Crowbar pickup and equip")
	var target: Area3D=lab.polish.breakables[1];var pos: Vector3=target.global_position
	await aim(Vector3(pos.x-1.1,.02,pos.z),pos);var count: int=lab.polish.breakables.filter(func(t):return is_instance_valid(t) and not t.get_meta("breakable").visible).size();g.strike();check(lab.polish.breakables.filter(func(t):return is_instance_valid(t) and not t.get_meta("breakable").visible).size()>count,"Crowbar strike breaks nearest glass within reach")
	await capture("crowbar")
	await aim(Vector3(-1.4,.02,2.3),lab.room.actors[0].global_position+Vector3.UP);g.swing=0;g.strike();check(lab.room.actors[0].get_meta("health")==66,"Crowbar also uses non-graphic NPC damage")
	print("REGISTERED GLASS: ",g.glass_targets.size())
	var key:=InputEventKey.new();key.physical_keycode=KEY_1;key.pressed=true;g.handle_input(key);check(not g.crowbar_equipped,"1 holsters crowbar")
	var out:=FileAccess.open("res://validation/glassware-pass/checks.json",FileAccess.WRITE);out.store_string(JSON.stringify(checks,"  "));out.close()
	lab.queue_free();await process_frame;quit(1 if checks.any(func(x):return not x.pass) else 0)
