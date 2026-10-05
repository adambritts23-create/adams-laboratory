extends "res://scripts/validate_lake_views.gd"
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 12:await process_frame
 lab.close_panel();lab.game_ui.hide();route=lab.staff_exit
 await shot("medieval-overview",Vector3(100,-12,-1140),Vector3(42,-42,-1045))
 await shot("medieval-street",Vector3(29,-38.3,-1110),Vector3(31,-42,-1040))
 await shot("medieval-canal",Vector3(49,-43.8,-1010),Vector3(48,-43,-1080))
 var cam=Camera3D.new();lab.add_child(cam);cam.position=Vector3(-1,1.8,-18);cam.look_at(Vector3(2.8,1.9,-16.7));cam.current=true
 for i in 20:await process_frame
 await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("res://validation/entrance-guns.png")
 var a=route.apartment;a.interact("home_enter")
 cam.global_position=a.global_position+Vector3(4.8,1.65,1.125);cam.look_at(a.global_position+Vector3(6.58,1.2,1.125));cam.environment=lab.player.camera.environment;cam.cull_mask=lab.player.camera.cull_mask
 a.balcony.interact("balcony_toggle")
 for i in 60:await process_frame
 await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("res://validation/balcony-open.png")
 print("NEW VIEWS COMPLETE");quit()

