extends SceneTree
func _initialize():call_deferred("run")
func run():
 var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 6:await process_frame
 lab.close_panel();var car=lab.staff_exit.vehicles[1] if "--red" in OS.get_cmdline_user_args() else lab.staff_exit.vehicle
 car.body.position=Vector3(-4.5 if car.is250 else 4.5,.08,-43);car.body.rotation=Vector3(0,PI,0);car.global_transform=car.body.global_transform;car.enter()
 Input.action_press("forward")
 for i in 190:await physics_frame
 Input.action_release("forward")
 var e=InputEventKey.new();e.keycode=KEY_E;e.pressed=true;car.handle(e)
 await create_timer(1.7).timeout
 Input.action_press("forward")
 for i in 240:await physics_frame
 Input.action_release("forward")
 print("PARKED EXIT position=",car.position," open=",lab.staff_exit.grounds.gate_open)
 for i in car.body.get_slide_collision_count():
  var c=car.body.get_slide_collision(i);print("BLOCKER ",c.get_collider().global_position," ",c.get_normal())
 var ok=car.position.z< -78
 print("PASS Parked car exits using E" if ok else "FAIL Parked car exits using E")
 car.speed=0
 Input.action_press("back")
 for i in 500:await physics_frame
 Input.action_release("back")
 var returned=car.position.z> -58
 print("PASS Reverse through open gate" if returned else "FAIL Reverse through open gate")
 quit(0 if ok and returned else 1)
