extends "res://scripts/validate_lake_views.gd"
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await process_frame
 lab.close_panel();lab.game_ui.hide();route=lab.staff_exit
 var land=route.grounds.get_node("DownhillRoadAndTown")
 var p=Vector3(land.road_x(460)+28,land.road_height(460),-460)
 await shot("reference-villa",p+Vector3(-25,3,9),p+Vector3(0,4,0))
 await shot("reference-audi",p+Vector3(-17,1.9,2),p+Vector3(-11,1,-6))
 await shot("dalarna-cottage",Vector3(115,-45,-676),Vector3(126,-45,-650))
 await shot("dalarna-lakeside",Vector3(146,-35,-720),Vector3(134,-45,-645))
 var space=lab.get_world_3d().direct_space_state
 for station in [445,460,480,510,535,555,575]:
  var pos=Vector3(land.road_x(station),land.road_height(station),-station)
  var q=PhysicsShapeQueryParameters3D.new();q.shape=BoxShape3D.new();q.shape.size=Vector3(2.0,1.4,4.8);q.transform.origin=pos+Vector3.UP*1.0;q.transform.basis=Basis(Vector3.RIGHT,atan((land.road_height(station+1)-land.road_height(station-1))*.5));q.exclude=[lab.player.get_rid()]
  var clear=space.intersect_shape(q).is_empty();print("PASS " if clear else "FAIL ","Road clearance ",station)
  if not clear:failures+=1
 print("REFERENCE HOUSE FAILURES ",failures);quit(1 if failures else 0)

