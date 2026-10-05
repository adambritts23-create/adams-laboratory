extends SceneTree

var failures: Array[String] = []
var checks: Array[String] = []
var lab: Node

func verify(condition: bool, message: String) -> void:
	if condition:
		checks.append(message)
		print("PASS " + message)
	else:
		failures.append(message)
		push_error("FAIL " + message)

func frames(count: int) -> void:
	for i in count: await physics_frame

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	if DisplayServer.get_name() == "headless": root.size = Vector2i(1280, 720)
	lab = load("res://scenes/lab_b.tscn").instantiate()
	root.add_child(lab)
	current_scene = lab
	await frames(8)
	verify(lab.player.is_on_floor(), "Player grounded on room floor")
	for actor in lab.room.actors:
		verify(actor.rig.get_bone_count()>=60 and actor.rig.find_bone("index_03_l")>=0 and actor.rig.find_bone("Head")>=0, actor.identity+": imported humanoid skeleton includes head and articulated fingers")
		var skinned:=0
		for mesh in actor.model.find_children("*","MeshInstance3D",true,false):
			if mesh.skin!=null:skinned+=1
		verify(skinned>=5, actor.identity+": actual skinned head, clothes, hands and boots loaded")
		verify(actor.find_children("*","CollisionObject3D",true,false).is_empty(),actor.identity+": replacement NPC remains nonblocking")
		var head_index: int=actor.rig.find_bone("Head")
		var before_idle: Quaternion=actor.rig.get_bone_pose_rotation(head_index)
		actor.animate(1.0,actor.global_position+Vector3(2,1.7,2),true)
		var after_idle: Quaternion=actor.rig.get_bone_pose_rotation(head_index)
		verify(after_idle.is_normalized() and before_idle.angle_to(after_idle)>.01 and before_idle.angle_to(after_idle)<.5,actor.identity+": restrained dialogue head orientation uses skeleton")
	verify(lab.room.actors[0].height==1.88 and lab.room.actors[1].height==1.75,"Requested 1.88 m / 1.75 m character heights")
	var shoulder_spans: Array[float]=[]
	for actor in lab.room.actors:
		var top: float=-INF
		var bottom: float=INF
		for mesh in actor.model.find_children("*","MeshInstance3D",true,false):
			var bounds: AABB=mesh.global_transform*mesh.get_aabb()
			top=maxf(top,bounds.end.y)
			bottom=minf(bottom,bounds.position.y)
		verify(absf((top-bottom)-actor.height)<.055,actor.identity+": exported mesh height agrees with intended physical scale")
		var left: Vector3=actor.rig.global_transform*actor.rig.get_bone_global_pose(actor.rig.find_bone("upperarm_l")).origin
		var right: Vector3=actor.rig.global_transform*actor.rig.get_bone_global_pose(actor.rig.find_bone("upperarm_r")).origin
		shoulder_spans.append(left.distance_to(right))
	verify(shoulder_spans[0]>.52 and shoulder_spans[0]>shoulder_spans[1],"Adam retains broader authored shoulder span than Axel")

	var menu_contents:=""
	for label in lab.panel.find_children("*","Button",true,false):menu_contents+=label.text
	verify(not menu_contents.contains("Open Adam"),"Standalone menu has no scientific-app launch")

	verify(lab.paused and lab.panel.visible, "Start menu releases mouse and pauses opening")
	verify(lab.subtitle.get_global_rect().position.x>=0 and lab.subtitle.get_global_rect().end.x<=root.size.x, "Subtitles fit horizontal safe area")
	verify(lab.panel.get_global_rect().end.y <= root.size.y and lab.panel.position.y >= 0, "Main menu fits default viewport")
	if DisplayServer.get_name() != "headless":
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://validation/menu-render.png")
	lab.close_panel()
	verify(Input.mouse_mode == Input.MOUSE_MODE_CAPTURED or DisplayServer.get_name() == "headless", "Mouse capture on start")
	var motion := InputEventMouseMotion.new()
	motion.relative = Vector2(25, 10)
	lab.player._unhandled_input(motion)
	if DisplayServer.get_name() != "headless":
		verify(absf(lab.player.rotation.y) > 0.01 and absf(lab.player.camera.rotation.x) > 0.01, "Mouse look changes yaw and pitch")
	lab.player.rotation = Vector3.ZERO
	lab.player.camera.rotation = Vector3.ZERO
	lab.paused = true # Freeze narrative while exercising actual physics.
	var initial: Vector3 = lab.player.position
	Input.action_press("forward")
	await frames(40)
	Input.action_release("forward")
	var walk_distance: float = initial.distance_to(lab.player.position)
	verify(walk_distance > 1.5, "WASD forward moves player")
	initial = lab.player.position
	Input.action_press("forward")
	Input.action_press("sprint")
	await frames(40)
	Input.action_release("forward")
	Input.action_release("sprint")
	verify(initial.distance_to(lab.player.position) > walk_distance * 1.3, "Sprint faster than walking")
	Input.action_press("crouch")
	await frames(20)
	verify(lab.player.crouched and lab.player.camera.position.y < 1.0, "Crouch changes collider and eye height")
	Input.action_release("crouch")
	await frames(20)
	Input.action_press("jump")
	await frames(8)
	Input.action_release("jump")
	verify(lab.player.position.y > 0.3, "Jump leaves floor")
	await frames(60)
	verify(lab.player.is_on_floor(), "Gravity returns player to floor")
	lab.player.position = Vector3(0.5, 0.05, -10.3)
	Input.action_press("forward")
	await frames(70)
	Input.action_release("forward")
	verify(lab.player.position.z > -11.7, "Far wall collision prevents escape")
	lab.player.position = Vector3(-1.4, 0.05, 2.8)
	Input.action_press("forward")
	await frames(70)
	Input.action_release("forward")
	verify(lab.player.position.z < 0, "Adam has no blocking collision")
	lab.player.position = Vector3(2.6,0.05,-3.2)
	lab.player.look_at(Vector3(-1,0.05,-3.2))
	Input.action_press("forward")
	await frames(70)
	Input.action_release("forward")
	verify(lab.player.position.x < .5, "Axel remains nonblocking across the clear aisle beside the stairs")
	lab.player.position = Vector3(-1.5, 0.05, 6.1)
	lab.player.rotation = Vector3.ZERO
	lab.player.camera.rotation = Vector3.ZERO
	lab.player.camera.look_at(Vector3(-3.055,0.73,6.1))
	await frames(10)
	lab.find_target()
	verify(lab.current_target != null and lab.current_target.get_meta("interaction") == "acid", "Raycast discovers Acid-Base interaction prompt")
	lab.interact("sample")
	verify(lab.carrying.is_empty(), "Materials reserved before incident")
	lab.elapsed = 11
	lab.paused = false
	lab._process(.01)
	await frames(2)
	verify(lab.dialogue_index == 1, "Opening dialogue advances")
	lab.elapsed = 151
	lab._process(0.01)
	await frames(2)
	verify(lab.phase == lab.Phase.RETRIEVE_MATERIALS, "Quiet opening transitions to incident")
	lab.interact("sample")
	lab.interact("beaker")
	verify(lab.carrying == "sample" and not lab.room.pickups.sample.visible, "Controlled single-item pickup cannot lose sample")
	lab.interact("acid")
	lab.update_hud()
	verify(lab.hud.text.contains("✓  Sample") and lab.hud.text.contains("□  Beaker") and not lab.hud.text.contains("concerned"), "Mission HUD shows individual delivery checklist")
	for item in ["beaker", "titrant"]:
		lab.interact(item)
		lab.interact("acid")
	verify(lab.delivered.size() == 3 and lab.phase == lab.Phase.TITRATION, "Three snap deliveries unlock station")
	lab.interact("acid")
	verify(lab.station_open and lab.player.enabled and not lab.panel.visible, "Station starts physical presentation without a dispenser menu")
	lab._process(1.0)
	var presentation_time: float=lab.room.presentation_time
	lab.interact("acid")
	verify(lab.room.presentation_time == presentation_time, "Repeated interaction does not reset presentation")
	lab.open_pause()
	lab._process(2.0)
	verify(lab.room.presentation_time == presentation_time, "Pause freezes titration presentation")
	lab.close_panel()
	lab._process(10.0)
	verify(lab.phase==lab.Phase.TITRATION and lab.room.presentation,"Slower titration remains active after eleven seconds")
	lab._process(lab.room.PRESENTATION_DURATION-lab.room.presentation_time+.01)
	verify(lab.phase == lab.Phase.SUCCESS and lab.room.sludge.visible and not lab.room.presentation, "Completed fictional sequence produces orange sludge and success")
	lab.success_time = 3
	lab._process(0.01)
	verify(lab.subtitle.text.contains("sending you the precipitation data"), "Adam sends the result to control room")
	lab.success_time = 12
	lab._process(0.01)
	verify(lab.room.facility.response > 0 and lab.room.facility.response < 1, "Outside vessel responds progressively after acknowledgement")
	lab.success_time = 8+lab.room.facility.RESPONSE_DURATION
	lab._process(0.01)
	verify(lab.room.facility.settled, "Outside facility reaches illustrative settled state")
	lab.success_time = 12+lab.room.facility.RESPONSE_DURATION
	lab._process(0.1)
	await frames(2)
	verify(lab.phase == lab.Phase.FREE_EXPLORE and lab.player.enabled, "Success becomes free exploration")
	verify(lab.room.lower_lab.unlocked and lab.room.facility.access.unlocked, "Full mission releases both lower laboratory and plant access")
	lab._process(6.0)
	verify(lab.hud.text.is_empty() and lab.center.visible, "Free exploration notice fades, leaving crosshair and prompts")
	lab.sound.update_audio(0.01, 20, 0)
	var far_rate: float = lab.sound.click_rate
	lab.sound.update_audio(.01,40,0)
	verify(lab.sound.click_rate>=.9 and lab.sound.geiger_db>=-19, "Farthest position retains room-wide baseline")
	lab.sound.toggle_mute()
	verify(not lab.sound.geiger.playing, "Sound toggle silences Geiger")
	lab.sound.toggle_mute()
	verify(far_rate >= 0.9 and lab.sound.geiger != null, "Geiger retains room-wide spatial baseline")
	lab.sound.update_audio(0.01, 1, 0)
	verify(lab.sound.click_rate > far_rate * 5, "Geiger proximity increases uncalibrated click rate")
	verify(lab.sound.ambience.playing and lab.sound.clips.size() == 6, "Recorded ambience and compatible movement/mission audio API available")
	verify(lab.sound.recorded.size()==7 and lab.sound.event_sources.size()==6,"Separate licensed recordings and spatial event sources loaded")
	verify(lab.sound.hood_sources[0].volume_db>=-12 and lab.sound.hood_sources[0].max_distance<8,"Hood airflow is prominent locally with a bounded range")
	verify(lab.sound.click_rate>18 and lab.sound.geiger_db>-9,"Cabinet produces dramatically faster and louder atmospheric clicks")
	verify(lab.sound.drain.playing and lab.sound.drain.stream.resource_path.is_empty(),"Recorded sink layer loops independently")
	lab.player.position = Vector3(0, 0.05, 9.4)
	lab.player.rotation = Vector3.ZERO
	lab.player.camera.rotation = Vector3.ZERO
	lab.paused = true
	await frames(4)
	if DisplayServer.get_name() != "headless":
		await RenderingServer.frame_post_draw
		root.get_texture().get_image().save_png("res://validation/room-render.png")
	lab.begin_incident()
	verify(lab.room.environment_dressing.hoods.size()==5, "Five enclosed fume hoods preserve station working areas")
	verify(lab.sound.hood_sources.size()==5 and lab.sound.environmental_loops.size()==10, "Localized hood and gallery recording layers exist")
	verify(lab.sound.get_node("RecordedHVAC").playing, "Recorded HVAC bed plays independently of machinery")
	lab.sound.toggle_mute()
	verify(AudioServer.is_bus_mute(lab.sound.lab_bus), "Mute silences all ambience, positional sources and events")
	lab.sound.toggle_mute()
	lab.room.sample_liquid.fill_level=.5
	lab.room.sample_liquid.apply_visuals()
	verify(is_equal_approx(lab.room.sample_liquid.surface.position.y,.135), "Liquid fill level moves body and independent surface together")
	lab.room.sample_liquid.fill_level=1.0
	lab.room.sample_liquid.set_treatment(.5)
	verify(lab.room.sample_liquid.cloudiness>.90 and lab.room.sample_liquid.emission_strength<.4, "Fictional mid-transition clouds liquid and reduces glow")
	lab.room.sample_liquid.set_treatment(1)
	verify(lab.room.sample_liquid.sediment.multimesh.visible_instance_count==1200 and lab.room.sample_liquid.emission_strength==0, "Fine sediment settles and fluorescence stops at visual completion")
	lab.room.facility.set_response(.5)
	verify(is_equal_approx(lab.room.facility.liquid.cloudiness,lab.room.sample_liquid.cloudiness)==false, "Vessel B has an independent instance of the shared liquid visuals")
	lab.room.facility.set_response(1)
	verify(lab.room.facility.settled and lab.room.facility.liquid.sediment_amount==1, "Vessel B completes its shared sediment response")
	lab.incident_remaining = 1
	lab.paused = false
	lab._process(2)
	verify(lab.phase == lab.Phase.FAILURE and lab.panel.visible, "Expired narrative timer produces failure and restart UI")
	lab.open_pause()
	var before: float = lab.incident_remaining
	lab._process(30)
	verify(lab.incident_remaining == before, "Pause freezes scenario timer")
	lab.restart()
	await frames(12)
	lab = current_scene
	verify(lab.phase == lab.Phase.EXPLORE and lab.delivered.is_empty() and lab.paused, "Restart recreates a clean playable shift")
	var report := FileAccess.open("res://validation/checks.json", FileAccess.WRITE)
	report.store_string(JSON.stringify({"passed": checks, "failed": failures}, "\t"))
	report.close()
	print("RESULT %d passed / %d failed" % [checks.size(), failures.size()])
	lab.queue_free()
	await frames(5)
	quit(0 if failures.is_empty() else 1)






