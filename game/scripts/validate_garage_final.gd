extends "res://scripts/validate_lake_views.gd"
func check(ok:bool,title:String):
 print("PASS " if ok else "FAIL ",title)
 if not ok:failures+=1
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await physics_frame
 lab.close_panel();lab.game_ui.hide();route=lab.staff_exit
 var g=route.garage;g.interact("garage_door")
 for i in 55:await physics_frame
 check(is_equal_approx(g.door_pivot.rotation.z,-PI/2) and g.door.global_position.y<g.global_position.y+3,"Garage door folds underneath roof")
 var car=route.vehicles[0];car.body.global_position=g.to_global(Vector3(11,.15,-.5));car.body.rotation=Vector3(0,-PI/2,0);car.global_transform=car.body.global_transform;car.enter()
 for i in 90:await physics_frame
 Input.action_press("forward")
 for i in 140:await physics_frame
 Input.action_release("forward");print("Garage car position ",g.to_local(car.body.global_position))
 check(g.to_local(car.body.global_position).x<4.5 and g.to_local(car.body.global_position).x> -3,"Lexus drives into garage parking bay")
 car.body.linear_velocity=Vector3.ZERO;car.body.angular_velocity=Vector3.ZERO;car.speed=0;car.exit_car()
 check(not car.driving,"Can leave parked car in garage")
 lab.player.global_position=g.to_global(Vector3(-3,.1,-3.6));g.interact("garage_preparation");check(lab.workbench.visible and lab.workbench.table_mode,"Garage has chemical component selection");lab.workbench.close()
 var a=route.apartment;var space=lab.get_world_3d().direct_space_state
 for x in [-1.2,-.8,-.4]:
  var q=PhysicsShapeQueryParameters3D.new();q.shape=CapsuleShape3D.new();q.shape.radius=.28;q.shape.height=1.75;q.transform.origin=a.to_global(Vector3(x,.94,-.87));q.exclude=[lab.player.get_rid()]
  check(space.intersect_shape(q).is_empty(),"Full-width player clears apartment ammo table at "+str(x))
 await shot("garage-outside-final",Vector3(-45,-44.5,-988),Vector3(-62,-46.5,-996))
 route.outdoor_environment=g.environment
 await shot("garage-lab-final",g.to_global(Vector3(3,2.1,3)),g.to_global(Vector3(-4,1.2,-2)))
 print("GARAGE FINAL FAILURES ",failures);quit(1 if failures else 0)
