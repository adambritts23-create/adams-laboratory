extends SceneTree
var lab: Node3D
var review_camera: Camera3D
func _initialize() -> void:call_deferred("run")
func frames(n: int) -> void:
	for i in n:await process_frame
func shot(id: String,eye: Vector3,target: Vector3) -> void:
	review_camera.global_position=eye;review_camera.look_at(target)
	await frames(18);await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://validation/lab-expansion/"+id+".png");print("CAPTURE "+id)
func run() -> void:
	root.size=Vector2i(1440,900)
	lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
	review_camera=Camera3D.new();root.add_child(review_camera);review_camera.fov=78;review_camera.current=true
	await frames(65);lab.close_panel();lab.paused=true;lab.player.enabled=false;lab.player.set_physics_process(false);lab.game_ui.hide()
	await shot("01-upper-wide-entry",Vector3(0,1.65,9),Vector3(-.4,1.5,-6))
	await shot("02-upper-wide-return",Vector3(0,1.65,-9),Vector3(0,1.6,7))
	await shot("03-chemical-storage",Vector3(-3.8,1.7,8.8),Vector3(-4.3,1.5,11.4))
	await shot("04-glassware-cabinets",Vector3(-.5,1.65,8.3),Vector3(-.4,1.5,11.4))
	await shot("05-washing-station",Vector3(3,1.75,-8.7),Vector3(5.1,1.35,-9.5))
	await shot("06-lower-door-locked",Vector3(3.7,1.65,2.85),Vector3(6,1.5,2.85))
	var actor: Node3D=lab.room.actors[0]
	var head:=actor.position+Vector3(0,1.76,.02)
	for data in [["front",Vector3(0,0,1)],["three-quarter",Vector3(.70,0,.72)],["profile",Vector3(1,0,.03)]]:
		for distance in [.50,2.0]:await shot("adam-"+data[0]+("-close" if distance<1 else "-conversation"),head+data[1]*distance,head)
	lab.room.start_presentation();lab.room.advance_presentation(48);lab.room.show_success();lab.room.facility.set_response(1)
	await shot("07-lab-thick-sediment",Vector3(-3.0,1.52,5.9),Vector3(-3.8,1.32,6.1))
	await shot("08-plant-thick-sediment",Vector3(-16,-2,3),Vector3(-23,-3,-4.6))
	lab.success_time=84;lab.advance_handoff();lab.room.facility.access.animate(3)
	lab.paused=false;lab.room.lower_lab._process(3);lab.paused=true
	await shot("09-lower-door-released",Vector3(3.7,1.65,2.85),Vector3(8,1.3,2.85))
	await shot("10-stair-transition",Vector3(10.5,.65,-2.3),Vector3(10.5,-2.5,5.5))
	await shot("11-first-view-from-stair-foot",Vector3(10.5,-2.93,3.8),Vector3(6,-2.6,8.7))
	await shot("12-lower-wide",Vector3(7,-2.93,2),Vector3(-2,-2.8,-5))
	await shot("13-lower-preparation",Vector3(-.6,-2.93,-4),Vector3(7,-2.8,-2))
	await shot("14-gamma-room",Vector3(-3,-2.93,-5.8),Vector3(-3.6,-2.9,-10.7))
	await shot("15-weighing-room",Vector3(1,-2.93,-7.6),Vector3(1,-3,-10.6))
	await shot("16-two-fume-hoods",Vector3(10,-2.9,-5.5),Vector3(13.3,-2.8,-5.5))
	await shot("17-coulometry-bench",Vector3(5,-2.8,1.9),Vector3(5,-3.1,4.35))
	await shot("18-icp-ms-through-glazing",Vector3(3,-2.93,3.0),Vector3(4,-2.7,8.7))
	await shot("19-gowning-locked-entry",Vector3(-.4,-2.93,1.7),Vector3(-3.8,-2.5,4.9))
	await shot("20-lower-return-route",Vector3(7,-2.93,1.2),Vector3(10.5,-1,-2))
	review_camera.queue_free();lab.queue_free();await frames(8);quit()
