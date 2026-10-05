extends "res://scripts/validate_lake_views.gd"
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await process_frame
 lab.close_panel();lab.game_ui.hide();route=lab.staff_exit;lab.player.enabled=false;lab.player.set_physics_process(false)
 var env=route.outdoor_environment;route.outdoor_environment=null
 await shot("october-alarms",Vector3(-2.3,3.1,9.6),Vector3(-5,3.45,9.5))
 await shot("october-storage",Vector3(-1.5,1.8,9),Vector3(-1.5,1.7,11.7))
 route.outdoor_environment=env;lab.player.position=Vector3(-45,-48,-975)
 for i in 8:await process_frame
 await shot("october-contact",Vector3(-48.8,-46.4,-973),Vector3(-52.3,-47.2,-972.5))
 await shot("october-dealer",Vector3(-41,-45.8,-975),Vector3(-22,-46,-975))
 await shot("october-front",Vector3(-40,-44,-950),Vector3(-55,-46,-950))
 var a=route.apartment;a.interact("home_enter");lab.economy.extensions.open_room("buy_piano")
 for i in 5:await process_frame
 route.outdoor_environment=a.interior_environment
 lab.room.sample_liquid.visible=true;lab.room.sample_liquid.sediment_amount=.35;lab.room.sample_liquid.settling_progress=.35;lab.room.sample_liquid.precipitation_progress=.35
 await shot("october-home-lab",a.to_global(Vector3(3.4,1.8,7.3)),a.to_global(Vector3(3.1,1.4,9.4)))
 await shot("october-home-green",a.to_global(Vector3(-.5,1.7,-.8)),a.to_global(Vector3(1.1,1.7,-1.4)))
 print("OCTOBER VIEWS COMPLETE");quit()
