extends SceneTree
func _initialize() -> void:call_deferred("review")
func review() -> void:
	root.size=Vector2i(1600,1000)
	var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab)
	for i in 8:await process_frame
	assert(lab.player.position.distance_to(Vector3(0,.05,9.4))<1)
	assert(not lab.dialogue.voice_enabled)
	var station=lab.find_child("UpstairsKFStation",true,false)
	assert(station.view==lab.kf_workstation)
	station.handle_vial("kf_pick_3");assert(station.held_index==3)
	station.handle_vial("kf_place");assert(station.held_index==-1);assert(lab.kf_workstation.run.vial.id=="YELLOWCAKE-001")
	var origin=station.to_global(Vector3(.555,.205,1));var endpoint=station.to_global(Vector3(.555,.205,-.20))
	var query=PhysicsRayQueryParameters3D.create(origin,endpoint,4);query.collide_with_areas=true;query.collide_with_bodies=false
	var hit=lab.get_world_3d().direct_space_state.intersect_ray(query);assert(not hit.is_empty());assert(hit.collider.get_meta("interaction")=="kf_start")
	lab.interact("kf_start");assert(lab.kf_workstation.run.status=="running");assert(not lab.kf_workstation.visible)
	lab.paused=false
	for i in 5:await process_frame
	assert(lab.kf_workstation.gas_routes[0].arrows[0].visible)
	var stir=station.model.find_child("*magnetic*stir*bar*",true,false);assert(stir!=null);var spin=stir.rotation.y
	var idle_speed=lab.kf_workstation.electron_speed
	lab.kf_workstation.run.rate=400
	var gas_position=lab.kf_workstation.gas_routes[0].arrows[0].position
	for i in 5:await process_frame
	assert(abs(stir.rotation.y-spin)>.01);assert(lab.kf_workstation.electron_speed>idle_speed)
	assert(gas_position.distance_to(lab.kf_workstation.gas_routes[0].arrows[0].position)>.001)
	lab.kf_workstation.run.step(15)
	assert(lab.kf_workstation.run.status=="complete")
	lab.paused=false;lab.panel.hide();lab.player.set_physics_process(false);lab.player.enabled=false
	var camera=Camera3D.new();station.add_child(camera);camera.position=Vector3(.4,.75,2.25);camera.look_at(station.to_global(Vector3(.3,.3,0)));camera.current=true;camera.fov=64
	for i in 20:await process_frame
	assert(station.mirrors.size()==38)
	assert(not lab.kf_workstation.gas_routes[0].arrows[0].visible)
	assert(station.model.find_child("ComputerDisplay",true,false).material_override==lab.kf_workstation.model.find_child("ComputerDisplay",true,false).material_override)
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("C:/Users/adamb/Documents/Codex/2026-09-09/the/outputs/kf-lab-updated.png")
	lab.kf_workstation.open()
	assert(lab.kf_workstation.viewport.world_3d==lab.get_world_3d())
	lab.kf_workstation.target=Vector3(1,2,0);lab.kf_workstation.distance=16;lab.kf_workstation.update_camera()
	for i in 8:await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("C:/Users/adamb/Documents/Codex/2026-09-09/the/outputs/kf-real-lab-inspection.png")
	var view=lab.kf_workstation
	var old_target=view.target
	view.zoom_at(Vector2(300,300),.1);assert(view.target.distance_to(old_target)>.1)
	var motion=InputEventMouseMotion.new();motion.relative=Vector2(20,10);view.panning=true;old_target=view.target;view.view_input(motion);assert(view.target.distance_to(old_target)>.1);view.panning=false
	view.looking=true;var old_eye=view.camera.position;view.view_input(motion);assert(view.camera.position.distance_to(old_eye)<.001);view.looking=false
	lab.kf_workstation.close()
	print("PASS: lab start, silent dialogue, physical vial pickup/placement, shared displays, 38 mirrored animation objects")
	quit()
