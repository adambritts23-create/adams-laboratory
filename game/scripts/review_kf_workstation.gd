extends SceneTree
class FakePlayer extends Node:
	var enabled:=true
class FakeLab extends Node:
	var paused:=false
	var player=FakePlayer.new()
	var prompt=Label.new()
func _initialize() -> void:call_deferred("run_test")
func run_test() -> void:
	root.size=Vector2i(1400,850)
	var owner_lab=FakeLab.new();root.add_child(owner_lab);owner_lab.add_child(owner_lab.player);owner_lab.add_child(owner_lab.prompt)
	var view=load("res://scripts/kf_workstation.gd").new();root.add_child(view);view.initialize(owner_lab)
	var game_controller=load("res://scripts/lab.gd").new();game_controller.kf_workstation=view;game_controller.interact("kf_station");game_controller.free()
	assert(view.visible and not owner_lab.player.enabled and owner_lab.paused)
	assert(view.electron_toggle.button_pressed)
	view.run.start();view.run.step(12)
	assert(view.run.status=="complete");assert(abs(view.run.ppm()-1000)<2)
	for i in 30:await process_frame
	for spec in [["generator",Vector3(-.32,2.6,.1)],["indicator",Vector3(.6,2.6,.3)],["computer",Vector3(10.2,3.5,-.6)],["vial",Vector3(-3.9,1.5,-1.2)],["argon",Vector3(-6.1,1.7,-1.2)]]:
		var screen: Vector2=view.camera.unproject_position(spec[1])*view.container.size/Vector2(view.viewport.size)
		var hit=view.pick(screen);assert(not hit.is_empty(),"Missing hit "+spec[0]);assert(hit.collider.get_meta("part")==spec[0],"Wrong part "+str(hit.collider.get_meta("part")))
	var fake_event=InputEventMouseButton.new();fake_event.button_index=MOUSE_BUTTON_LEFT;fake_event.pressed=true;fake_event.double_click=true;fake_event.position=view.camera.unproject_position(Vector3(10.2,3.5,-.6))*view.container.size/Vector2(view.viewport.size);view.view_input(fake_event)
	assert(view.target.distance_to(Vector3(10.2,3.5,-.6))<.01)
	view.target=Vector3(1.6,2,-.6);view.distance=25;view.update_camera()
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("C:/Users/adamb/Documents/Codex/2026-09-09/the/outputs/kf-game-interactive.png")
	view.side.show()
	for i in 3:await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("C:/Users/adamb/Documents/Codex/2026-09-09/the/outputs/kf-game-records.png")
	var event=InputEventKey.new();event.pressed=true;event.physical_keycode=KEY_E;view._input(event)
	assert(not view.visible and owner_lab.player.enabled and not owner_lab.paused)
	view.open();assert(view.visible and view.run.status=="complete")
	print("KF PASS: native view, simulation %.3f ppm, E exit/restoration, retained result, electron flow default on"%view.run.ppm())
	view.close();quit()

