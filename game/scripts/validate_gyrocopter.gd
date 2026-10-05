extends SceneTree
var failures=0
func _initialize():call_deferred("run")
func check(ok,title):
 print("PASS " if ok else "FAIL ",title)
 if not ok:failures+=1
func run():
 var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 lab.staff_exit.apartment.interact("home_leave");lab.close_panel()
 for i in 20:await physics_frame
 check(lab.staff_exit.gyrocopters.size()==2,"Two aircraft placed")
 for gyro in lab.staff_exit.gyrocopters:
  check(gyro.body.is_on_floor(),gyro.name+" parked on ground")
  gyro.enter();check(gyro.driving and not lab.player.enabled and gyro.camera.current,gyro.name+" enter")
  gyro.set_physics_process(false)
  var start=gyro.body.position
  for i in 300:
   gyro.simulate(1.0/60,1,0,1)
   await physics_frame
  print("FLIGHT ",gyro.name," from ",start," to ",gyro.body.position," speed ",gyro.speed)
  check(gyro.body.position.y>start.y+3,gyro.name+" takeoff from parking spot")
  gyro.exit_car();check(gyro.driving,gyro.name+" cannot exit airborne")
  var heading=gyro.yaw
  for i in 30:gyro.simulate(1.0/60,0,1,0);await physics_frame
  check(absf(gyro.yaw-heading)>.1,gyro.name+" steering")
  # Return above its clear parking spot to exercise descent and exit repeatedly.
  gyro.body.position=start+Vector3.UP*3;gyro.body.velocity=Vector3.ZERO;gyro.speed=0;gyro.throttle=0;gyro.yaw=0
  for i in 150:gyro.simulate(1.0/60,-1,0,-1);await physics_frame
  check(gyro.body.is_on_floor(),gyro.name+" lands")
  gyro.exit_car();check(not gyro.driving and lab.player.enabled,gyro.name+" safe exit")
  gyro.enter();check(gyro.driving,gyro.name+" reentry")
  lab.paused=true;var before=gyro.body.position;gyro._physics_process(.1)
  check(gyro.body.position==before,gyro.name+" pause freezes flight")
  lab.paused=false;gyro.exit_car()
 print("GYRO FAILURES ",failures)
 lab.free();await process_frame;quit(failures)
