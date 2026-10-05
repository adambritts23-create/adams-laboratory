extends SceneTree
var lab
var failures:=0
func _initialize():call_deferred("run")
func check(ok:bool,title:String):
 print(("PASS " if ok else "FAIL ")+title)
 if not ok:failures+=1
func run():
 lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 8:await process_frame
 lab.close_panel();var route=lab.staff_exit;var car=route.vehicles[1];car.enter()
 car.body.position=Vector3(0,-47.9,-880);car.body.rotation=Vector3(0,PI,0);car.global_transform=car.body.global_transform;car.speed=0
 Input.action_press("forward")
 for i in 800:await physics_frame
 Input.action_release("forward")
 print("Extension position ",car.position," speed ",car.speed)
 for i in car.body.get_slide_collision_count():
  var c=car.body.get_slide_collision(i);print("Contact ",c.get_collider().global_position," normal ",c.get_normal())
 check(car.position.z< -1130 and car.position.y> -49,"IS250 drives the full village extension")
 car.speed=0;car.body.velocity=Vector3.ZERO
 car.body.position=Vector3(-43,-47.9,-1010);car.body.rotation=Vector3.ZERO;car.global_transform=car.body.global_transform
 Input.action_press("forward")
 for i in 235:await physics_frame
 Input.action_release("forward")
 check(car.position.z> -980 and car.position.y> -49,"5C access road is driveable")
 car.speed=0;car.body.velocity=Vector3.ZERO;car.exit_car()
 for i in 2:await physics_frame
 var home=route.home_entry
 var ray=PhysicsRayQueryParameters3D.create(home+Vector3(2,1.2,0),home+Vector3(.2,1.2,0))
 var hit=lab.get_world_3d().direct_space_state.intersect_ray(ray)
 check(not hit.is_empty() and hit.collider.get_meta("interaction","")=="home_enter","Relocated door reachable by interaction ray")
 var capsule=PhysicsShapeQueryParameters3D.new();capsule.shape=lab.player.shape_node.shape;capsule.transform=Transform3D(Basis.IDENTITY,home+Vector3(2,1.0,0));capsule.exclude=[lab.player.get_rid()]
 check(lab.get_world_3d().direct_space_state.intersect_shape(capsule).is_empty(),"Clear walking space outside 5C")
 print("RESIDENTIAL DRIVE FAILURES: ",failures);quit(1 if failures else 0)
