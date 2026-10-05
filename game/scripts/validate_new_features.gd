extends SceneTree
var failures=0
var lab
func _initialize():call_deferred("run")
func check(ok:bool,title:String):
 print("PASS " if ok else "FAIL ",title)
 if not ok:failures+=1
func run():
 lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await physics_frame
 lab.close_panel();var a=lab.staff_exit.apartment;a.interact("home_enter");var balcony=a.balcony
 var space=lab.get_world_3d().direct_space_state
 var origin=a.global_position+Vector3(5.6,1.65,1.125)
 var world_origin=a.REAR_ORIGIN+Basis(Vector3.UP,PI)*Vector3(5.6,1.65,1.125)
 var direction=Basis(Vector3.UP,PI).inverse()*(balcony.TARGET-world_origin).normalized()
 var query=PhysicsRayQueryParameters3D.create(origin,origin+direction*80);query.exclude=[lab.player.get_rid()]
 var hit=space.intersect_ray(query)
 check(not hit.is_empty() and hit.collider.get_meta("interaction","")=="balcony_toggle","Closed glazed doors block shots")
 balcony.interact("balcony_toggle")
 for i in 40:await physics_frame
 hit=balcony.redirect_shot(origin,direction,space.intersect_ray(query))
 print("Target ray ",hit)
 check(not hit.is_empty() and hit.collider.has_meta("practice_target"),"Open balcony sightline hits rear garden target")
 if not hit.is_empty() and hit.collider.has_meta("practice_target"):balcony.score_hit(hit.position)
 check(balcony.total==10,"Bullseye awards 10 hit points")
 var miss_direction=(direction+Vector3(0,.08,.02)).normalized()
 var miss=balcony.redirect_shot(origin,miss_direction,{})
 check(miss.is_empty() or not miss.collider.has_meta("practice_target"),"Miss does not score")
 balcony.interact("balcony_toggle")
 for i in 40:await physics_frame
 check(not balcony.opened and balcony.blockers[0].collision_layer==1,"Doors close and restore collision")
 a.interact("home_leave")
 for car in lab.staff_exit.vehicles:
  car.body.position=Vector3(0,.30,-95);car.body.rotation=Vector3(0,PI,0);car.enter()
  for i in 120:await physics_frame
  var start=car.body.position
  Input.action_press("forward")
  for i in 180:await physics_frame
  Input.action_release("forward")
  print("Vehicle ",car.is250," start ",start," end ",car.body.position," speed ",car.speed," rpm ",car.rpm)
  check(car.position.z<start.z-8 and car.speed>3,"Vehicle accelerates forward on suspension")
  check(car.body.basis.y.dot(Vector3.UP)>.85,"Vehicle remains upright")
  Input.action_press("back")
  for i in 180:await physics_frame
  Input.action_release("back")
  check(car.speed<0,"Brake transitions into reverse")
  car.body.linear_velocity=Vector3.ZERO;car.speed=0;car.exit_car()
  car.body.position=Vector3(-30,0,-43)
 print("FEATURE FAILURES ",failures);quit(1 if failures else 0)
