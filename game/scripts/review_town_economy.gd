extends "res://scripts/validate_lake_views.gd"
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await process_frame
 lab.close_panel();lab.game_ui.hide();route=lab.staff_exit;lab.player.enabled=false;lab.player.set_physics_process(false)
 var env=route.outdoor_environment;route.outdoor_environment=null
 await shot("alarm-display",Vector3(-3.7,2.3,9.5),Vector3(-6,3.25,9.5))
 await shot("clear-lab-window",Vector3(0,1.7,-3),Vector3(-3,2,-9))
 route.outdoor_environment=env;lab.player.position=Vector3(0,.1,-70)
 for i in 5:await process_frame
 await shot("sentry-gate",Vector3(-5,2,-80),Vector3(3,1.4,-62))
 lab.player.position=Vector3(-68,-47.9,-842)
 for i in 5:await process_frame
 await shot("lexus-showroom",Vector3(-68,-45.5,-839),Vector3(-68,-46.7,-851))
 await shot("lexus-cars",Vector3(-68,-46.1,-845),Vector3(-69,-46.9,-851))
 var a=route.apartment;a.interact("home_enter");var e=lab.economy;e.extensions.open_room("buy_piano");e.extensions.open_room("buy_hall")
 for i in 5:await process_frame
 route.outdoor_environment=a.interior_environment
 await shot("apartment-piano-door",a.to_global(Vector3(4.8,1.65,1)),a.to_global(Vector3(5.9,1.4,5.4)))
 await shot("apartment-hall-door",a.to_global(Vector3(-1.6,1.65,-.15)),a.to_global(Vector3(-2.35,1.3,-2.6)))
 route.outdoor_environment=env
 print("ECONOMY VIEWS COMPLETE");quit()
