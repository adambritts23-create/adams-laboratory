extends SceneTree
var lab
var failures=0
func _initialize():call_deferred("run")
func check(ok:bool,title:String):
 print("PASS " if ok else "FAIL ",title)
 if not ok:failures+=1
func run():
 lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await physics_frame
 lab.close_panel();lab.staff_exit.apartment.interact("home_leave");var car=lab.staff_exit.vehicle;car.enter();car.body.position=Vector3(29,-45.7,-1010);car.body.rotation=Vector3(0,PI,0);car.body.linear_velocity=Vector3.ZERO
 for i in 120:await physics_frame
 for i in 1500:
  if car.speed<7:Input.action_press("forward")
  else:Input.action_release("forward")
  await physics_frame
  if car.position.z< -1120:break
 Input.action_release("forward")
 print("Terrace car ",car.position)
 check(car.position.z< -1120 and absf(car.position.y+40)<.3,"Connected lane reaches upper terrace")
 car.body.linear_velocity=Vector3.ZERO;car.speed=0;car.exit_car()
 lab.player.position=Vector3(33.7,-45.8,-1020);lab.player.rotation.y=0;lab.player.velocity=Vector3.ZERO
 Input.action_press("forward")
 for i in 550:
  await physics_frame
  if lab.player.position.z< -1050:break
 Input.action_release("forward")
 check(lab.player.position.z< -1050,"Player walks up terraced stair route")
 var a=lab.staff_exit.apartment;a.interact("home_enter");a.balcony.interact("balcony_toggle")
 for i in 40:await physics_frame
 var p=Vector3(5.6,1.65,1.125);var world_origin=a.REAR_ORIGIN+Basis(Vector3.UP,PI)*p
 var direction=Basis(Vector3.UP,PI).inverse()*(a.balcony.TARGET-world_origin).normalized()
 lab.player.global_position=a.global_position+p-Vector3(0,1.62,0);lab.player.rotation.y=0;lab.player.camera.look_at(a.global_position+p+direction);lab.player.camera.rotation.x-=.018
 lab.expansion.owns_rifle=true;lab.expansion.set_equipped(true);lab.expansion.chambered=true;lab.expansion.rounds=5
 check(lab.expansion.fire(),"Existing rifle fires from apartment")
 check(a.balcony.total==10,"Actual rifle shot scores bullseye through moved balcony")
 print("TERRACE AND SHOOTING FAILURES ",failures);quit(1 if failures else 0)
