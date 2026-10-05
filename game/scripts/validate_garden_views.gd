extends "res://scripts/validate_lake_views.gd"
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 12:await process_frame
 lab.close_panel();lab.game_ui.hide();route=lab.staff_exit
 await shot("garden-close",Vector3(13,-46.35,-610),Vector3(18,-46.6,-614))
 await shot("farmstead",Vector3(-94,-43.0,-667),Vector3(-105,-46,-690))
 await shot("harbre",Vector3(-85,-45.5,-684),Vector3(-94,-46,-693))
 await shot("pier-close",Vector3(74,-46.35,-810),Vector3(78,-48,-810))
 print("GARDEN VIEWS COMPLETE");quit()
