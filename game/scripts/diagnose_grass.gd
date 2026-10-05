extends SceneTree
func _initialize():call_deferred("run")
func run():
 var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 8:await physics_frame
 lab.close_panel()
 for p in [Vector3(100,-40,-1050),Vector3(10,-40,-1000),Vector3(-120,-40,-850),Vector3(0,-40,-1050)]:
  var q=PhysicsRayQueryParameters3D.create(p,p-Vector3.UP*30);q.hit_back_faces=false
  print("GROUND ",p," ",lab.get_world_3d().direct_space_state.intersect_ray(q))
 var car=lab.staff_exit.vehicle;car.enter();car.body.position=Vector3(100,-47.8,-1050);car.body.rotation=Vector3(0,PI,0);car.global_transform=car.body.global_transform;car.speed=0
 Input.action_press("forward")
 for i in 120:await physics_frame
 Input.action_release("forward");print("GRASS CAR ",car.position," floor ",car.body.is_on_floor());quit()
