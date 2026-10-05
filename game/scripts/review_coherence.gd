extends SceneTree
var lab: Node3D
func _initialize() -> void:call_deferred("run")
func frames(n: int) -> void:
	for i in n:await process_frame
func shot(id: String,eye: Vector3,target: Vector3) -> void:
	lab.player.camera.global_position=eye;lab.player.camera.look_at(target)
	await frames(18);await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://validation/coherence/"+id+".png");print("CAPTURE "+id)
func run() -> void:
	root.size=Vector2i(1440,900);DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED);Engine.max_fps=0
	lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
	await frames(65);lab.close_panel();lab.paused=true;lab.player.enabled=false;lab.player.set_physics_process(false);lab.game_ui.hide()
	await shot("01-lab-b",Vector3(-4.8,1.7,3),Vector3(-43,1,-4))
	await shot("02-visitor",Vector3(4.0,1.42,10.85),Vector3(4.65,1.36,9.9))
	await shot("03-visitor-full",Vector3(2.7,1.5,11.2),Vector3(4.65,.85,9.9))
	lab.room.start_presentation()
	for stage in [["04-addition-early",9.6],["05-addition-mid",9.6],["06-addition-endpoint",9.6],["07-settling",11.2],["08-settled",8.0]]:
		lab.room.advance_presentation(stage[1]);await shot(stage[0],Vector3(-2.65,1.75,6.9),Vector3(-3.8,1.5,6.4))
	for stage in [["09-plant-early",.20],["10-plant-mid",.40],["11-plant-endpoint",.60],["12-plant-settling",.82],["13-plant-settled",1.0]]:
		lab.room.facility.set_response(stage[1]);await shot(stage[0],Vector3(-15,2,4),Vector3(-23,-.5,-4.6))
	lab.success_time=84;lab.advance_handoff();lab.room.facility.access.animate(3)
	await shot("14-access-doorway",Vector3(-5,1.62,9.5),Vector3(-22,.5,4))
	await shot("15-overlooking-gallery",Vector3(-14,1.62,9.5),Vector3(-43,1,-5))
	await shot("16-precipitation-level",Vector3(-31,-4.38,0),Vector3(-22,-1,-5))
	await shot("17-separation-route",Vector3(-35,-4.38,4),Vector3(-45,0,0))
	await shot("18-high-district-overview",Vector3(-35,10.62,-30.1),Vector3(-44,-4,0))
	await shot("19-upstream-tank-bay",Vector3(-37,5.62,-26),Vector3(-51,0,-31))
	await shot("20-downstream-thermal",Vector3(-60,5.62,14),Vector3(-48,1,22))
	await shot("21-final-handling-overlook",Vector3(-62,-.8,28),Vector3(-50,-3,33))
	await shot("22-final-storage",Vector3(-59,-4.38,35),Vector3(-49,-3,30))
	await shot("23-look-back-through-plant",Vector3(-54,5.62,14),Vector3(-25,0,-13))
	# Sample the actual running industrial response, including per-frame suspension motion.
	lab.player.camera.global_position=Vector3(-15,2,4);lab.player.camera.look_at(Vector3(-23,-.5,-4.6))
	lab.phase=lab.Phase.SUCCESS;lab.success_time=34;lab.paused=false
	await frames(30)
	var durations: Array[float]=[];var last:=Time.get_ticks_usec()
	for i in 180:
		await process_frame
		var now:=Time.get_ticks_usec();durations.append((now-last)/1000.0);last=now
	durations.sort()
	var out:=FileAccess.open("res://validation/coherence/performance.json",FileAccess.WRITE)
	out.store_string(JSON.stringify({"viewport":"1440x900","adapter":RenderingServer.get_video_adapter_name(),"sample":"live industrial suspension, 180 frames","median_ms":durations[90],"p95_ms":durations[171],"median_fps":1000.0/durations[90]},"\t"));out.close()
	lab.queue_free();await frames(8);quit()
