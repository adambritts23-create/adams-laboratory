extends "res://scripts/validate_lake_views.gd"
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await process_frame
 lab.close_panel();lab.game_ui.hide();route=lab.staff_exit
 var a=route.apartment;a.interact("home_enter")
 var camera=Camera3D.new();lab.add_child(camera);camera.current=true;camera.fov=70;camera.environment=a.interior_environment
 for spec in [["curtains",Vector3(3.9,1.65,2.8),Vector3(6.6,1.6,2.8)],["shelf",Vector3(2.5,1.65,1.8),Vector3(.1,1.8,.9)],["mirrors",Vector3(4.2,1.65,1.2),Vector3(1.8,1.6,4.0)],["kitchen",Vector3(5.1,1.65,-.15),Vector3(4.1,1.3,-3.1)]]:
  camera.position=a.global_position+spec[1];camera.look_at(a.global_position+spec[2])
  for i in 30:await process_frame
  await RenderingServer.frame_post_draw
  root.get_texture().get_image().save_png("res://validation/furnish-"+spec[0]+".png")
 print("FURNISH VIEWS COMPLETE");quit()
