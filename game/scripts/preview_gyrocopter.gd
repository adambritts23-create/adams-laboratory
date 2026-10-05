extends SceneTree
func _initialize():call_deferred("run")
func run():
 var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 lab.staff_exit.apartment.interact("home_leave");lab.game_ui.hide()
 var cam=Camera3D.new();lab.add_child(cam);cam.position=Vector3(-36,-43.5,-997);cam.look_at(Vector3(-43,-46.5,-989));cam.environment=lab.staff_exit.outdoor_environment;cam.make_current()
 for i in 12:await process_frame
 await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("res://validation/gyrocopter-preview.png")
 lab.free();await process_frame;quit()
