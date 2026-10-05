extends "res://scripts/validate_lake_views.gd"
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await process_frame
 lab.close_panel();lab.game_ui.hide();route=lab.staff_exit;lab.player.enabled=false;lab.player.set_physics_process(false)
 lab.player.position=Vector3(0,.1,-40)
 for i in 6:await process_frame
 await shot("clear-factory",Vector3(4,1.8,-36),Vector3(-12,2,-57))
 lab.player.position=Vector3(-45,-48,-970)
 for i in 6:await process_frame
 await shot("home-frontage",Vector3(-44,-46,-944),Vector3(-55,-46,-944))
 await shot("home-forest",Vector3(-25,-21,-1030),Vector3(40,-40,-1100))
 var a=route.apartment;a.interact("home_enter");lab.economy.extensions.open_room("buy_piano")
 for i in 5:await process_frame
 route.outdoor_environment=a.interior_environment
 await shot("home-piano",a.to_global(Vector3(3.4,1.65,1.3)),a.to_global(Vector3(5.9,1.2,3.7)))
 await shot("home-lab",a.to_global(Vector3(5.85,1.65,5.65)),a.to_global(Vector3(2.8,1.35,9.4)))
 print("HOME VIEWS COMPLETE");quit()
