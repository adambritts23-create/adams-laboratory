extends SceneTree
var failures=0
func _initialize():call_deferred("run")
func run():
 var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 20:await physics_frame
 lab.close_panel();lab.player.position=Vector3(4,.1,-43)
 for car in lab.staff_exit.vehicles.slice(0,2):
  car.body.global_position=Vector3(-3.5 if car.is250 else 3.5,-47.7,-700);car.body.rotation.y=PI;car.global_transform=car.body.global_transform
  lab.player.global_position=Vector3(6,-47.7,-700)
  for i in 5:await physics_frame
  for cycle in 5:
   lab.current_target=car.body
   var interact=InputEventKey.new();interact.physical_keycode=KEY_E;interact.keycode=KEY_E;interact.pressed=true
   lab._unhandled_input(interact)
   if not car.driving:failures+=1;print("FAIL E input failed to enter")
   var start=car.body.position
   Input.action_press("forward")
   for i in 65:await physics_frame
   Input.action_release("forward")
   var distance=Vector2(car.body.position.x-start.x,car.body.position.z-start.z).length()
   if distance<1 or absf(car.body.position.y-start.y)>1:failures+=1;print("FAIL parked vehicle did not resume stable driving")
   print("FULL DRIVE ",car.is250," cycle ",cycle," distance ",car.body.position.distance_to(start)," driving ",car.driving," force ",car.body.engine_force," contact ",car.body.is_on_floor())
   car.body.linear_velocity=Vector3.ZERO;car.speed=0;lab._unhandled_input(interact)
   if car.driving:failures+=1;print("FAIL E input failed to exit")
   for i in 20:await physics_frame
 print("FULL REENTRY FAILURES ",failures)
 quit(1 if failures else 0)
