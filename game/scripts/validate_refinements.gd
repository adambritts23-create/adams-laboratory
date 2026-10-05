extends SceneTree
var lab: Node3D
var checks: Array=[]
func _initialize() -> void:call_deferred("run")
func check(ok: bool,text: String) -> void:
	checks.append({"pass":ok,"check":text});print("PASS " if ok else "FAIL ",text)
func capture(file: String) -> void:
	await create_timer(.5).timeout
	if DisplayServer.get_name()!="headless":root.get_texture().get_image().save_png("res://validation/refinements/"+file+".png")
func run() -> void:
	lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab)
	await process_frame;await process_frame;lab.close_panel()
	check(not lab.room.lower_lab.unlocked and not lab.room.facility.access.unlocked,"Doors closed initially")
	await create_timer(3).timeout
	check(lab.room.lower_lab.gate.position.y==0 and lab.room.facility.access.gate.position.y==0,"Doors do not auto-open")
	lab.interact("periodic");await process_frame
	var labels:=""
	for b in lab.workbench.box.find_children("*","Button",true,false):labels+=b.text+"|"
	check(not labels.contains("Bench") and not labels.contains("Prepare experiment"),"Periodic screen cannot launch titration remotely")
	check(lab.workbench.box.find_children("*","SpinBox",true,false).is_empty(),"Periodic screen is system selection only")
	await capture("periodic-system")
	lab.workbench.close()
	lab.player.position=Vector3(2.1,.05,-1.7);lab.player.camera.look_at(Vector3(1.5,1.3,-3.2));await physics_frame;lab.find_target()
	check(lab.current_target!=null and lab.current_target.get_meta("interaction")=="axel","Raycast can select Axel")
	lab.interact("axel")
	check(lab.subtitle.text=="AXEL: I fear for Adam's mental state lately.","Axel delivers requested line")
	await capture("axel")
	lab.sound.update_audio(.1,30,0);var far: float=lab.sound.geiger_db
	lab.sound.update_audio(.1,1,0)
	check(far<=-32 and lab.sound.geiger_db<=-20,"Geiger subdued both far and near")
	lab.interact("lower_gate");lab.interact("plant_gate")
	await create_timer(3.1).timeout
	check(lab.room.lower_lab.opened and lab.room.facility.access.opened,"E-triggered door animations finish")
	var q:=PhysicsRayQueryParameters3D.create(Vector3(1.5,1,-5.5),Vector3(1.5,-1,-5.5));q.exclude=[lab.player.get_rid()]
	var hit:=lab.get_world_3d().direct_space_state.intersect_ray(q)
	check(not hit.is_empty() and absf(hit.position.y)<.03,"Reclaimed stair margin has walkable floor")
	lab.player.position=Vector3(1.8,.05,-3.2);lab.player.camera.look_at(Vector3(2.9,1.9,-5.8));await capture("screen-clearance")
	lab.player.position=Vector3(3.8,.05,10.7);lab.player.camera.look_at(Vector3(5.05,1.3,9.05));await capture("powder-shelf")
	check(lab.room.find_child("PowderChemicalShelf",true,false)!=null,"Powder shelf beside visitor")
	lab.interact("acid");await capture("bench-separated")
	var f:=FileAccess.open("res://validation/refinements/checks.json",FileAccess.WRITE);f.store_string(JSON.stringify(checks,"  "));f.close()
	lab.queue_free();await process_frame;quit(1 if checks.any(func(c):return not c.pass) else 0)
