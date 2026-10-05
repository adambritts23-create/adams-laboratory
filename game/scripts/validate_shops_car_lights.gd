extends "res://scripts/validate_lake_views.gd"
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await process_frame
 lab.close_panel();lab.game_ui.hide();route=lab.staff_exit
 await shot("supermarket",Vector3(32,-45.8,-857),Vector3(46,-46.4,-875))
 await shot("boss-resident",Vector3(39,-46.4,-865),Vector3(40,-46.7,-868))
 await shot("residents",Vector3(-18,-46.55,-871),Vector3(-18,-46.9,-875))
 await shot("gold-car",Vector3(8,1.5,-39),Vector3(4.5,.8,-43))
 await shot("red-car",Vector3(-1,1.5,-39),Vector3(-4.5,.8,-43))
 await shot("car-rear",Vector3(7,1.6,-47),Vector3(4.5,1,-43))
 route.outdoor_environment=null
 await shot("lab-light-left",Vector3(1,1.65,2.3),Vector3(4.3,1.3,0))
 await shot("lab-light-right",Vector3(1,1.65,-2.3),Vector3(4.3,1.3,0))
 await shot("titration-left",Vector3(-1,1.65,3.8),Vector3(-4.3,1.3,6))
 await shot("titration-right",Vector3(-1,1.65,8.2),Vector3(-4.3,1.3,6))
 print("SHOPS CAR LAB VIEWS COMPLETE");quit()
