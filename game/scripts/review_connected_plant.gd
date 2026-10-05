extends SceneTree
var lab: Node3D
var rows: Array=[]
func _initialize() -> void: call_deferred("run")
func frames(n: int) -> void:
	for i in n: await process_frame
func shot(id: String,eye: Vector3,target: Vector3,measure: bool=false) -> void:
	lab.player.camera.global_position=eye;lab.player.camera.look_at(target)
	await frames(30);await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://validation/connected-plant/"+id+".png")
	print("CAPTURE "+id)
	if measure:
		var durations: Array[float]=[];var last:=Time.get_ticks_usec()
		for i in 120:
			await process_frame
			var now:=Time.get_ticks_usec();durations.append((now-last)/1000.0);last=now
		durations.sort()
		rows.append({"view":id,"median_ms":durations[60],"p95_ms":durations[114],"median_fps":1000.0/durations[60],"draw_calls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)})
func run() -> void:
	root.size=Vector2i(1280,720);DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED);Engine.max_fps=0
	lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
	await frames(90);lab.close_panel();lab.paused=true;lab.player.enabled=false;lab.player.set_physics_process(false);lab.game_ui.hide()
	await shot("01-door-locked",Vector3(-2.2,1.65,10.5),Vector3(-6,1.5,9.5))
	await shot("02-dense-window-view",Vector3(-4.9,1.7,3),Vector3(-29,0,-5),true)
	await shot("03-lab-home-base",Vector3(0,1.62,10),Vector3(-.4,1.6,-2),true)
	lab.room.start_presentation();lab.room.advance_presentation(12)
	await shot("04-lab-feeding",Vector3(-2.8,1.8,6.8),Vector3(-4.2,1.48,6.4))
	await shot("05-live-ph-trace",Vector3(-2.65,1.75,6.9),Vector3(-3.758,1.7,6.72))
	lab.room.advance_presentation(10)
	await shot("06-lab-suspension",Vector3(-3.05,1.66,6.65),Vector3(-3.8,1.36,6.1))
	lab.room.advance_presentation(16)
	await shot("07-lab-slow-settling",Vector3(-3.05,1.66,6.65),Vector3(-3.8,1.36,6.1))
	lab.room.advance_presentation(10);lab.room.show_success()
	await shot("08-lab-result",Vector3(-2.8,1.8,6.8),Vector3(-4.2,1.48,6.4))
	for data in [["09-plant-feeding",.18],["10-plant-suspension",.45],["11-plant-settling",.78],["12-plant-settled",1.0]]:
		lab.room.facility.set_response(data[1])
		await shot(data[0],Vector3(-15,2,4),Vector3(-23,-.5,-4.6))
	lab.success_time=84;lab.advance_handoff();lab.room.facility.access.animate(3)
	await shot("13-access-released",Vector3(-3,1.65,10),Vector3(-12,-1,12))
	await shot("14-threshold-service-route",Vector3(-8,1.62,9.5),Vector3(-24,0,6),true)
	await shot("15-lower-stair",Vector3(-16,-1.38,17),Vector3(-16,-4,23))
	await shot("16-vessel-close-service",Vector3(-16,-4.38,3),Vector3(-23,-3,-4.6),true)
	await shot("17-filter-walk",Vector3(-30,5.62,0),Vector3(-40,0,2))
	await shot("18-vacuum-to-furnaces",Vector3(-30,5.62,-14),Vector3(-35,7,10))
	await shot("19-tank-overlook",Vector3(-37,5.62,-28),Vector3(-49,1,-24))
	await shot("20-furnace-service",Vector3(-50,5.62,14),Vector3(-48,2,18))
	await shot("21-uranium-packaging",Vector3(-20,-4.38,23),Vector3(-24,-4,26))
	await shot("22-connected-plant",Vector3(-12,10,23),Vector3(-40,2,-5),true)
	await shot("23-return-to-lab",Vector3(-8,1.62,9.5),Vector3(-3,1.8,8.5))
	var out:=FileAccess.open("res://validation/connected-plant/performance.json",FileAccess.WRITE)
	out.store_string(JSON.stringify({"adapter":RenderingServer.get_video_adapter_name(),"renderer":RenderingServer.get_current_rendering_method(),"viewport":"1280x720","views":rows},"\t"));out.close()
	lab.queue_free();await frames(20);quit()
