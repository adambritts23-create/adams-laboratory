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
	await frames(60)
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://validation/phase5/"+id+".png")
	if measure:
		var durations: Array[float]=[]
		var last:=Time.get_ticks_usec()
		for i in 180:
			await process_frame
			var now:=Time.get_ticks_usec()
			durations.append((now-last)/1000.0)
			last=now
		durations.sort()
		performance_rows.append({"view":id,"median_ms":durations[90],"p95_ms":durations[171],"median_fps":1000.0/durations[90],"draw_calls":Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),"objects":Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME)})
func run() -> void:
	root.size=Vector2i(1280,720)
	DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
	Engine.max_fps=0
	lab=load("res://scenes/lab_b.tscn").instantiate()
	root.add_child(lab)
	current_scene=lab
	await frames(90)
	lab.close_panel()
	lab.paused=true
	lab.player.enabled=false
	lab.player.set_physics_process(false)
	lab.game_ui.hide()
	await shot("01-entrance",Vector3(0,1.62,10),Vector3(-0.4,1.6,-2),true)
	await shot("02-acid",Vector3(-2,1.62,8),Vector3(-3.9,1.48,6.05),true)
	await shot("03-redox",Vector3(-2,1.62,2),Vector3(-4,1.45,-0.1))
	await shot("04-electrochemistry",Vector3(1.9,1.62,8),Vector3(3.8,1.4,6))
	await shot("05-preparation",Vector3(2,1.62,-3.7),Vector3(4.6,1.65,-5.8))
	await shot("06-gallery",Vector3(-2,1.62,-3),Vector3(-7,1.8,-5),true)
	await shot("07-storage",Vector3(1,1.62,-7.7),Vector3(2.8,1.4,-10.7))
	await shot("08-workers",Vector3(0,1.62,4.2),Vector3(0,1.4,0))
	await shot("facility-before",Vector3(-2.5,1.7,-3.7),Vector3(-8.25,2,-4.6),true)
	await shot("hood",Vector3(-2.35,2.02,6.85),Vector3(-4.4,2.1,6))
	await shot("imported-assets",Vector3(2.9,1.75,-.15),Vector3(4.05,1.43,-.55))
	await shot("wet-floor",Vector3(1.9,.8,7.3),Vector3(.6,.04,3.3))
	await shot("sink",Vector3(3.4,1.75,2.2),Vector3(4.15,1.25,1.45))
	lab.room.sample_liquid.show()
	await shot("fluorescent-close",Vector3(-3.05,1.66,6.65),Vector3(-3.8,1.36,6.1))
	lab.room.facility.set_response(.5)
	await shot("facility-during",Vector3(-2.5,1.7,-3.7),Vector3(-8.25,2,-4.6))
	lab.room.facility.set_response(0)
	lab.room.sample_liquid.show()
	lab.room.show_success()
	await shot("09-success",Vector3(-2.9,1.60,7.2),Vector3(-3.8,1.4,6.1))
	# Capture actual E-started presentation with the live HUD, not a posed fake outcome.
	lab.game_ui.show()
	lab.player.position=Vector3(-1.5,0.05,6.1)
	lab.player.camera.position=Vector3(0,1.62,0)
	lab.delivered.assign(["sample","beaker","titrant"])
	lab.phase=lab.Phase.TITRATION
	lab.station_open=false
	lab.paused=false
	lab.open_station()
	lab._process(2.0)
	lab.paused=true
	lab.update_hud()
	await frames(5)
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://validation/phase5/10-titrating-hud.png")
	lab.paused=false
	lab._process(2.6)
	lab.paused=true
	await frames(5)
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://validation/phase5/11-success-hud.png")
	lab.success_time=18
	lab.advance_handoff()
	lab.update_hud()
	lab.room.facility.set_response(1.0)
	await shot("facility-after",Vector3(-2.5,1.7,-3.7),Vector3(-8.25,2,-4.6))
	lab.game_ui.show()
	lab.phase=lab.Phase.RETRIEVE_MATERIALS
	lab.delivered.assign(["sample","titrant"])
	lab.subtitle.text=lab.lines[3]
	lab.update_hud()
	await shot("hud-checklist-subtitle",Vector3(0,1.62,5.5),Vector3(-1.4,1.7,1))
	lab.phase=lab.Phase.FREE_EXPLORE
	lab.free_notice_time=6
	lab.subtitle.text=""
	lab.update_hud()
	await shot("hud-free-exploration",Vector3(0,1.62,5.5),Vector3(-1.4,1.7,1))
	var report:=FileAccess.open("res://validation/phase5/performance.json",FileAccess.WRITE)
	report.store_string(JSON.stringify({"viewport":"1280x720","renderer":RenderingServer.get_current_rendering_method(),"adapter":RenderingServer.get_video_adapter_name(),"vsync":false,"views":performance_rows},"\t"))
	report.close()
	lab.queue_free()
	await frames(10)
	quit()




