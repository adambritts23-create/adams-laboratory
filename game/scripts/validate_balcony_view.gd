extends SceneTree
func _initialize():call_deferred("run")
func run():
 root.size=Vector2i(1280,800)
 var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 12:await process_frame
 lab.close_panel();lab.game_ui.hide();var a=lab.staff_exit.apartment;a.interact("home_enter")
 var cam=Camera3D.new();lab.add_child(cam);cam.current=true;cam.fov=70;cam.environment=a.interior_environment
 cam.global_position=a.global_position+Vector3(4.8,1.65,1.125);cam.look_at(a.global_position+Vector3(6.58,1.2,1.125));a.balcony.interact("balcony_toggle")
 for i in 50:await process_frame
 await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("res://validation/balcony-left-final.png")
 print("BALCONY VIEW COMPLETE");quit()
