extends SceneTree
var lab: Node3D
var checks: Array[String]=[]
var failures: Array[String]=[]
var route_results: Array=[]
func _initialize() -> void: call_deferred("run")
func frames(n: int) -> void:
	for i in n: await physics_frame
func verify(ok: bool,msg: String) -> void:
	if ok: checks.append(msg);print("PASS "+msg)
	else: failures.append(msg);push_error(msg)
func walk_to(goal: Vector3) -> bool:
	var start: Vector3=lab.player.position
	var max_steps:=ceili(start.distance_to(goal)/3.6*60)+180
	Input.action_press("forward")
	var reached:=false
	for i in max_steps:
		var delta:=Vector2(goal.x-lab.player.position.x,goal.z-lab.player.position.z)
		if delta.length()<.22:
			reached=true;break
		lab.player.look_at(Vector3(goal.x,lab.player.position.y,goal.z))
		await physics_frame
	Input.action_release("forward")
	await frames(8)
	var final: Vector3=lab.player.position
	var good:=reached and absf(final.y-goal.y)<.35
	if not good:
		for i in lab.player.get_slide_collision_count():
			var collision: KinematicCollision3D=lab.player.get_slide_collision(i)
			print("BLOCKER ",collision.get_collider().get_path()," at ",collision.get_collider().global_position," normal ",collision.get_normal())
	route_results.append({"from":str(start),"goal":str(goal),"actual":str(final),"passed":good})
	print("ROUTE ",goal," -> ",final," ",good)
	return good
func run() -> void:
	Engine.time_scale=5
	lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
	await frames(12)
	lab.close_panel();lab.paused=true
	var access: Node3D=lab.room.facility.access
	verify(not access.unlocked and not access.opened,"Plant door starts locked")
	lab.player.position=Vector3(-4.7,.05,9.5)
	lab.player.look_at(Vector3(-8,.05,9.5))
	Input.action_press("forward");await frames(75);Input.action_release("forward")
	verify(lab.player.position.x>-5.65,"Locked industrial door physically prevents early entry")
	lab.phase=lab.Phase.TITRATION;lab.delivered.assign(["sample","beaker","titrant"]);lab.station_open=false
	lab.open_station()
	lab.room.advance_presentation(12)
	verify(lab.room.presentation and lab.room.titration_detail.feed_active,"Lab feed remains continuous at twelve seconds")
	verify(lab.room.sample_liquid.precipitation_progress>.1 and lab.room.sample_liquid.settling_progress==0,"Orange suspension develops during early addition without premature settling")
	var initial_level: float=lab.room.sample_liquid.fill_level
	verify(initial_level>.48 and initial_level<.96,"Titrant gradually raises laboratory liquid level")
	verify(lab.room.titration_detail.curve.progress>.2 and lab.room.titration_detail.curve.progress<.3,"Fictional pH curve follows the live laboratory sequence")
	var first_solids: float=lab.room.sample_liquid.precipitation_progress
	lab.room.advance_presentation(15)
	verify(lab.room.sample_liquid.precipitation_progress>first_solids and lab.room.sample_liquid.precipitation_progress>.97,"Precipitation approaches completion while feed is still active")
	verify(lab.room.titration_detail.feed_active and lab.room.presentation,"Feed and visible precipitation continue together through the addition stage")
	verify(lab.phase==lab.Phase.TITRATION and not access.unlocked,"Completion and access are not granted during settling")
	lab.paused=false;lab._process(21.01);lab.paused=true
	verify(lab.phase==lab.Phase.SUCCESS and lab.room.presentation_time>=48,"Success waits for the full forty-eight-second laboratory presentation")
	lab.success_time=12;lab.advance_handoff()
	verify(lab.room.facility.response>0 and lab.room.facility.feed_streams[0].visible,"Industrial response begins with visible feed through inlet piping")
	var level: float=lab.room.facility.liquid.fill_level
	lab.success_time=30;lab.advance_handoff()
	verify(lab.room.facility.liquid.fill_level>level and not access.unlocked,"Facility level rises before access is released")
	lab.room.facility.set_response(.60)
	verify(lab.room.facility.liquid.precipitation_progress==1 and lab.room.facility.liquid.settling_progress==0,"Industrial endpoint has a complete suspension before slower settling begins")
	lab.success_time=60;lab.advance_handoff()
	verify(not lab.room.facility.settled and not access.unlocked,"Industrial settling is still in progress after sixty seconds of handoff")
	lab.success_time=80;lab.advance_handoff()
	verify(lab.room.facility.settled and not access.unlocked,"Completed plant response precedes access clearance")
	lab.success_time=84;lab.advance_handoff()
	verify(lab.phase==lab.Phase.FREE_EXPLORE and access.unlocked,"Successful handoff releases the post-mission exploration door")
	access.animate(1)
	verify(access.gate.position.y>0 and not access.opened,"Industrial door opens through a visible lift animation")
	access.animate(3)
	verify(access.opened,"Door reaches full overhead clearance")
	lab.player.position=Vector3(-4.7,.05,9.5);lab.player.velocity=Vector3.ZERO;lab.player.enabled=true
	await frames(8)
	var route_ok:=true
	for point in access.route_points.slice(1):
		if not await walk_to(point): route_ok=false;break
	verify(route_ok,"Actual WASD controller traverses the door, ground circuit, both stairs, upper districts and return to Lab B")
	if route_ok:
		for point in [Vector3(-16,0,9.5),Vector3(-16,0,7),Vector3(-17,0,7),Vector3(-27,4,7),Vector3(-30,4,7),Vector3(-30,4,-17),Vector3(-34,4,-17),Vector3(-34,4,-18.5),Vector3(-34,9,-28.5),Vector3(-34,9,-30.1),Vector3(-41,9,-30.1),Vector3(-34,9,-30.1),Vector3(-34,9,-28.5),Vector3(-34,4,-18.5),Vector3(-34,4,-17),Vector3(-30,4,-17),Vector3(-30,4,7),Vector3(-27,4,7),Vector3(-17,0,7),Vector3(-16,0,7),Vector3(-16,0,9.5),Vector3(-4.7,0,9.5)]:
			if not await walk_to(point): route_ok=false;break
		verify(route_ok,"Optional high overlook is reachable and returns to the main gallery")
	if route_ok:
		# A second branch approaches the tank district on the lower deck.
		for point in [Vector3(-16,0,9.5),Vector3(-16,0,11),Vector3(-16,-6,23),Vector3(-16,-6,24),Vector3(-13,-6,24),Vector3(-13,-6,-28),Vector3(-39,-6,-28)]:
			if not await walk_to(point): route_ok=false;break
		verify(route_ok,"Lower marked aisle reaches the vessel and tank districts")
	# A physical ray from the protected deck must meet its visible railing.
	var q:=PhysicsRayQueryParameters3D.create(Vector3(-30,4.7,0),Vector3(-27,4.7,0))
	var hit: Dictionary=lab.get_world_3d().direct_space_state.intersect_ray(q)
	verify(not hit.is_empty(),"Accessible catwalk railing has a physical barrier")
	lab.sound.update_audio(0,20,0)
	var far_rate: float=lab.sound.click_rate
	lab.sound.update_audio(0,.8,0)
	verify(far_rate>=2.4 and lab.sound.click_rate>60 and lab.sound.geiger_db>-3,"Geiger baseline is raised and closed-cabinet proximity creates an intense uncalibrated burst")
	var visitor: Node3D=lab.room.get_node("LabVisitor")
	verify(visitor.height==1.54 and visitor.model!=null,"Reference-inspired visitor stands in Lab B at the requested height")
	lab.restart();await frames(16);lab=current_scene
	verify(not lab.room.facility.access.unlocked and lab.phase==lab.Phase.EXPLORE,"Restart relocks the door and restores the original shift")
	var out:=FileAccess.open("res://validation/coherence/checks.json",FileAccess.WRITE)
	out.store_string(JSON.stringify({"passed":checks,"failed":failures,"routes":route_results},"\t"));out.close()
	print("RESULT %d passed / %d failed"%[checks.size(),failures.size()])
	lab.queue_free();await frames(5);Engine.time_scale=1;quit(0 if failures.is_empty() else 1)
