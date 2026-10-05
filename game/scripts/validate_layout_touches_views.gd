extends "res://scripts/validate_lake_views.gd"
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await process_frame
 lab.close_panel();lab.game_ui.hide();route=lab.staff_exit
 await shot("garden-variety",Vector3(-11,-46.1,-640),Vector3(-19,-46,-651))
 await shot("garden-flowers",Vector3(29,-46.6,-689),Vector3(33,-46.5,-696))
 var a=route.apartment;a.interact("home_enter")
 var env=route.outdoor_environment
 # Match the actual player's interior environment for these room inspections.
 var camera=Camera3D.new();lab.add_child(camera);camera.current=true;camera.fov=70;camera.environment=a.interior_environment
 for spec in [["room-entrance",Vector3(3.3,1.65,2.6),Vector3(1.8,1.3,0)],["longer-hall",Vector3(-2.4,1.65,-.8),Vector3(2.4,1.3,-.9)],["bigger-bath",Vector3(2.2,1.65,-1.65),Vector3(1.7,1.2,-3.6)],["extended-windows",Vector3(4.6,1.65,2.7),Vector3(7.0,1.55,2.7)]]:
  camera.position=a.global_position+spec[1];camera.look_at(a.global_position+spec[2])
  for i in 35:await process_frame
  await RenderingServer.frame_post_draw
  root.get_texture().get_image().save_png("res://validation/layout-"+spec[0]+".png")
 print("LAYOUT TOUCHES VIEWS COMPLETE");quit()
