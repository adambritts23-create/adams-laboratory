extends "res://scripts/validate_lake_views.gd"
func run():
 root.size=Vector2i(1280,720);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await process_frame
 lab.close_panel();route=lab.staff_exit;route.apartment.interact("home_leave");lab.player.position=Vector3(0,.05,-4)
 for i in 5:await process_frame
 var env=route.outdoor_environment;route.outdoor_environment=null
 await shot("sealed-gallery",Vector3(0,1.7,-3),Vector3(-7,2,-4))
 route.outdoor_environment=env;lab.player.position=Vector3(13,-47.8,-713)
 for i in 5:await process_frame
 await shot("brighter-outdoors",Vector3(13,-45.9,-713),Vector3(-2,-47.5,-732))
 quit()
