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
		verify(actor.find_children("*","PhysicsBody3D",true,false).is_empty(),actor.identity+": replacement NPC remains nonblocking")
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

	lab.sound.update_audio(.01,30,0)
	var far: float=lab.sound.geiger_db
	lab.sound.update_audio(.01,1,0)
	verify(lab.sound.geiger_db>far,"Positional Geiger response retained")
	verify(lab.sound.environmental_loops.size()>=10,"Recorded spatial audio layers retained")
	var output:=FileAccess.open("res://validation/free-lab/core-checks.json",FileAccess.WRITE)
	output.store_string(JSON.stringify({"checks":checks,"failures":failures},"  "));output.close()
	lab.queue_free();await frames(2);quit(0 if failures.is_empty() else 1)
