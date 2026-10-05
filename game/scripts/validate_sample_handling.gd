extends SceneTree
var lab
var failures:=0
func _initialize():call_deferred("run")
func check(ok: bool,title: String):
	print(("PASS " if ok else "FAIL ")+title)
	if not ok:failures+=1
func run():
	lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);await process_frame;await process_frame;lab.close_panel()
	var e=lab.expansion;var g=lab.glassware;var a=lab.accounting;var p=lab.polish;var c=lab.calculations;var w=lab.workbench
	await process_frame
	var fixed=e.get_node("FixedFiltrationFlask")
	check(fixed.get_meta("protected_glass") and not fixed.has_meta("glass_target"),"Filtration apparatus fixed, excluded from pickup and breakables")
	var fake:=Area3D.new();fake.set_meta("breakable",fixed);lab.add_child(fake);p.hit_target({"collider":fake,"position":fixed.global_position});check(fixed.visible,"Protected apparatus survives damage dispatch");fake.queue_free()
	for fixture in ["inventory-calculation","iron-inventory"]:
		c.data=JSON.parse_string(FileAccess.get_file_as_string("res://validation/"+fixture+".json"));c.chosen=0;g.sync_calculation_beaker()
		var original: Dictionary=g.calculation_glass.get_meta("inventory").duplicate(true)
		g.take_calculation_beaker();e.use_filter();check(e.filtering,"Repeated filtration starts: "+fixture);e.finish_filter()
		p.take_output("residue");var residue: Node3D=p.carried_output
		check(residue.get_meta("inventory").solids==original.solids and residue.get_meta("inventory").drySolidMassG==original.drySolidMassG,"Each precipitate mass and total conserved: "+fixture)
		check(a.summary(original).contains(original.solids[0].name),"Individual solid mass on label")
		g.put_down(Vector3(0,.1,-4))
		# Prior residue/filtrate no longer prevents a new titration sample being carried.
		var tit=JSON.parse_string(FileAccess.get_file_as_string("res://validation/inventory-titration.json"));w.setup=tit.setup;w.points=tit.points;w.diagrams=tit.diagrams;w.chosen=w.points.size()-1
		check(e.take_sample(),"Titration pickup allowed with previous filtration outputs")
		var before: Dictionary=e.outputs.duplicate(true);e.use_filter();check(not e.filtering and e.outputs==before,"Uncollected output is never silently discarded")
		a.pour(true);check(g.held!=null and not g.held.has_meta("titration_record") and g.held.get_meta("inventory").drySolidMassG==0,"Basin disposal keeps empty beaker and removes restorable experiment")
		g.put_down(Vector3(0,.1,-3));p.take_output("filtrate")
		check(p.carried_output.get_meta("inventory").aqueous==original.aqueous and p.carried_output.get_meta("inventory").drySolidMassG==0,"Filtrate preserves dissolved inventory, not solid mass")
		a.pour(false);g.put_down(Vector3(0,.1,-2))
		var id: String=residue.get_meta("glass_target").get_meta("interaction").trim_prefix("glass_");g.pickup(id)
		var credits: float=a.credits;a.sell();check(a.credits>credits and g.held==residue and residue.get_meta("inventory").solids.is_empty(),"Axel pays for solids and retains empty beaker")
		credits=a.credits;a.sell();check(a.credits==credits,"Cannot sell the same solids twice")
		g.put_down(Vector3(0,.1,-1))
	# NPC splash changes reaction only, no damage.
	c.data=JSON.parse_string(FileAccess.get_file_as_string("res://validation/inventory-calculation.json"));c.chosen=0;g.sync_calculation_beaker();g.take_calculation_beaker()
	var actor: Node3D=lab.room.actors[1];lab.player.position=actor.global_position+Vector3(0,0,1.0);await physics_frame;lab.player.camera.look_at(actor.global_position+Vector3.UP*1.2)
	var hp: int=actor.get_meta("health");a.pour(false)
	check(lab.subtitle.text.begins_with("AXEL:") and actor.get_meta("health")==hp,"Splash provokes Axel without health damage")
	check(g.held!=null and not g.held.has_meta("calculation_record"),"Thrown sample stays as empty nonrestorable beaker")
	await create_timer(.7).timeout
	print("HANDLING FAILURES: ",failures);lab.queue_free();await process_frame;quit(1 if failures else 0)
