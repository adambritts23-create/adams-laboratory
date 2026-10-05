extends "res://scripts/validate_lake_views.gd"
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await process_frame
 lab.close_panel();lab.game_ui.hide();route=lab.staff_exit
 await shot("infill-street",Vector3(1,-45.8,-684),Vector3(35,-39,-704))
 await shot("infill-entrance",Vector3(29,-46.3,-687),Vector3(34,-44,-705))
 await shot("flag",Vector3(49,-40,-716),Vector3(46,-40,-727))
 await shot("gold-rounded",Vector3(8,1.5,-39),Vector3(4.5,.8,-43))
 await shot("red-rounded",Vector3(-1,1.5,-39),Vector3(-4.5,.8,-43))
 var a=route.apartment;a.interact("home_enter")
 await shot("apartment-details",a.global_position+Vector3(2,1.65,.3),a.global_position+Vector3(.5,1,1.0))
 var env=route.outdoor_environment;route.outdoor_environment=route.staff_environment
 await shot("exit-details",Vector3(0,1.65,-12.5),Vector3(-1,1.3,-17))
 route.outdoor_environment=env
 print("INFILL VIEWS COMPLETE");quit()
