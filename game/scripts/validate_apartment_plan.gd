extends SceneTree
var failures=0
func _initialize():call_deferred("run")
func check(ok:bool,label:String):
 print("PASS " if ok else "FAIL ",label)
 if not ok:failures+=1
func run():
 var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await physics_frame
 lab.close_panel();var a=lab.staff_exit.apartment;a.interact("home_enter")
 check(a.inside,"Apartment enters through 5C")
 var space=lab.get_world_3d().direct_space_state
 for p in [Vector3(-2.35,.95,-.8),Vector3(1.5,.95,-.8),Vector3(2.1,.95,-1.6),Vector3(2.65,.95,-1.6),Vector3(.9,.95,-2.3),Vector3(2.2,.95,0),Vector3(2.1,.95,1),Vector3(5,.95,0),Vector3(4.6,.95,-1.8)]:
  var q=PhysicsShapeQueryParameters3D.new();q.shape=CapsuleShape3D.new();q.shape.radius=.23;q.shape.height=1.75;q.transform.origin=a.global_position+p;q.exclude=[lab.player.get_rid()]
  check(space.intersect_shape(q).is_empty(),"Walking clearance "+str(p))
 var hit=space.intersect_ray(PhysicsRayQueryParameters3D.create(a.global_position+Vector3(-2.2,1.3,-.8),a.global_position+Vector3(-3.3,1.3,-.8)))
 check(not hit.is_empty() and hit.collider.get_meta("interaction","")=="home_leave","Apartment exit reachable")
 hit=space.intersect_ray(PhysicsRayQueryParameters3D.create(a.global_position+Vector3(5,1.6,2.5),a.global_position+Vector3(7,1.6,2.5)))
 check(not hit.is_empty(),"Window blocks falling out")
 a.interact("home_leave");check(not a.inside and lab.player.position.distance_to(lab.staff_exit.home_entry)<3,"Exit returns to 5C")
 var land=load("res://scripts/valley_landscape.gd")
 check(abs(land.town_relief(0,850))<.001 and abs(land.town_relief(50,855))<.001,"Road and shop approach elevations preserved")
 check(abs(land.town_relief(-170,940))>.05,"Meadow has actual ground relief")
 print("APARTMENT CHECK FAILURES: ",failures);quit(1 if failures else 0)
