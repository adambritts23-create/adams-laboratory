extends "res://scripts/validate_lake_views.gd"
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await process_frame
 lab.close_panel();lab.game_ui.hide();route=lab.staff_exit
 await shot("flags-centre",Vector3(30,-43.5,-750),Vector3(45,-40,-727))
 await shot("flags-lakeside",Vector3(135,-42,-683),Vector3(127,-44,-650))
 var count=0
 for n in route.find_children("*","Node3D",true,false):
  if n.get_script()!=null and n.get_script().resource_path=="res://scripts/swedish_flag.gd":count+=1
 print("SWEDISH FLAGPOLES: ",count);quit()

