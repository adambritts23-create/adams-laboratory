extends "res://scripts/validate_lake_views.gd"
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await process_frame
 lab.close_panel();lab.game_ui.hide();route=lab.staff_exit
 await shot("shop-interior",Vector3(39,-46.35,-869),Vector3(44,-46.5,-883))
 await shot("woodland",Vector3(-110,-37,-910),Vector3(-157,-46,-935))
 var a=route.apartment
 a.interact("home_enter")
 await shot("apartment-room",a.global_position+Vector3(2,1.65,.4),a.global_position+Vector3(3.2,1.0,4.2))
 await shot("apartment-rear",a.global_position+Vector3(4.6,1.65,2.7),a.global_position+Vector3(8,1.5,2.7))
 print("PORTAL ",a.rear_camera.global_position," basis ",a.rear_camera.global_basis," world ",a.rear_view.world_3d==lab.get_world_3d()," size ",a.rear_view.size)
 a.rear_view.get_texture().get_image().save_png("res://validation/rear-raw.png")
 await shot("apartment-kitchen",a.global_position+Vector3(5,1.65,-.1),a.global_position+Vector3(4.5,1.1,-3))
 print("APARTMENT SHOP VIEWS COMPLETE");quit()
