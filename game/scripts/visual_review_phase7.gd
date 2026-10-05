extends SceneTree
var lab: Node3D
var performance_rows: Array=[]
func _initialize() -> void:
	call_deferred("run")
func frames(n: int) -> void:
	for i in n: await process_frame
func shot(id: String, eye: Vector3, target: Vector3, measure: bool=false) -> void:
	lab.player.camera.global_position=eye
	lab.player.camera.look_at(target)
	await frames(30)
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://validation/phase7/"+id+".png")
	print("CAPTURE "+id)
	if measure:
		var durations: Array[float]=[]
		var last:=Time.get_ticks_usec()
		for i in 120:
			await process_frame
			var now:=Time.get_ticks_usec()
			durations.append((now-last)/1000.0);last=now
		durations.sort()
		performance_rows.append({"view":id,"median_ms":durations[60],"p95_ms":durations[114],"median_fps":1000.0/durations[60],"draw_calls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"objects":Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME)})
func run() -> void:
	root.size=Vector2i(1280,720)
	DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	Engine.max_fps=0
	lab=load("res://scenes/lab_b.tscn").instantiate()
	root.add_child(lab);current_scene=lab
	await frames(90)
	lab.close_panel();lab.paused=true;lab.player.enabled=false
	lab.player.set_physics_process(false);lab.game_ui.hide()
	await shot("01-lab-b-wide",Vector3(0,1.62,10),Vector3(-.4,1.6,-2),true)
	await shot("02-lab-window",Vector3(-4.9,1.7,3.0),Vector3(-29,0,-5),true)
	await shot("03-hall-establishing",Vector3(-14,7,21),Vector3(-46,1,-4),true)
	# Review-only pose of the actual Adam rig at unchanged human scale.
	var adam: Node3D=lab.room.actors[0]
	var old: Vector3=adam.position
	adam.position=Vector3(-15,-6,-1)
	await shot("04-human-scale",Vector3(-10,-3.8,7),Vector3(-23,-.5,-4.6))
	adam.position=old
	await shot("05-vessel-district",Vector3(-10,7,-18),Vector3(-26,0,-2),true)
	await shot("06-vessel-before",Vector3(-13,2,5),Vector3(-23,-.5,-4.6))
	lab.room.facility.set_response(.38)
	await shot("07-vessel-turbidity",Vector3(-13,2,5),Vector3(-23,-.5,-4.6))
	lab.room.facility.set_response(.74)
	await shot("08-vessel-settling",Vector3(-13,2,5),Vector3(-23,-.5,-4.6))
	lab.room.facility.set_response(1)
	await shot("09-vessel-settled",Vector3(-13,2,5),Vector3(-23,-.5,-4.6))
	lab.room.facility.set_response(0)
	await shot("10-overhead-pipework",Vector3(-16,7,-25),Vector3(-49,14,-9))
	await shot("11-catwalk-vertical",Vector3(-12.4,10.6,21),Vector3(-37,-2,-4))
	await shot("12-tank-district",Vector3(-48,3,-7),Vector3(-64,0,-23))
	await shot("13-filter-district",Vector3(-33,4,16),Vector3(-45,-4,-1))
	await shot("14-furnace-district",Vector3(-40,-1,18),Vector3(-57,2,25))
	await shot("15-storage-district",Vector3(-22,-2,23),Vector3(-25,-3,34))
	await shot("15b-restricted-district",Vector3(-17,-2,-23),Vector3(-24,-1,-35))
	await shot("16-wet-materials",Vector3(-13,-4.9,-.2),Vector3(-17,-5.5,-2.4))
	await shot("17-process-lighting",Vector3(-13,-3.3,9),Vector3(-24,-3,-5))
	await shot("18-nightshift-beauty",Vector3(-14,12,27),Vector3(-44,1,-3),true)
	await shot("19-two-storey-lab",Vector3(-17,1,17),Vector3(-4,-1,-3))
	await shot("19b-handoff-sightline",Vector3(-1.5,1.62,6.1),lab.room.facility.focus)
	lab.room.sample_liquid.show()
	for item in [["20-beaker-before",0.0],["21-beaker-clouding",.38],["22-beaker-settling",.74],["23-beaker-sediment",1.0]]:
		lab.room.sample_liquid.set_treatment(item[1])
		await shot(item[0],Vector3(-3.05,1.66,6.65),Vector3(-3.8,1.36,6.1))
	var report:=FileAccess.open("res://validation/phase7/performance.json",FileAccess.WRITE)
	report.store_string(JSON.stringify({"viewport":"1280x720","renderer":RenderingServer.get_current_rendering_method(),"adapter":RenderingServer.get_video_adapter_name(),"vsync":false,"static_instances_batched":lab.room.facility.static_instances,"views":performance_rows},"\t"));report.close()
	lab.queue_free();await frames(10);quit()
