extends SceneTree
var lab
var failures=0
func _initialize():call_deferred("run")
func check(ok:bool,title:String):
 print("PASS " if ok else "FAIL ",title)
 if not ok:failures+=1
func run():
 lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 30:await physics_frame
 var route=lab.staff_exit;var a=route.apartment;var p=lab.player;var car=route.vehicles[0]
 check(a.inside and p.global_position.distance_to(a.global_position)<5,"Starts inside third-floor apartment")
 check(p.camera.environment==a.interior_environment,"Apartment lighting active at start menu")
 check(car.position.distance_to(route.home_entry)<12 and car.body.global_transform==car.global_transform,"Yellow Lexus parked outside 5C with matching collision")
 check(p.platform_floor_layers==0 and p.platform_wall_layers==0,"Player does not inherit vehicle platform motion")
 lab.close_panel()
 if DisplayServer.get_name()!="headless":
  for i in 12:await process_frame
  await RenderingServer.frame_post_draw
  root.get_texture().get_image().save_png("res://validation/apartment-new-start.png")
 a.interact("home_leave")
 for i in 10:await physics_frame
 check(not a.inside and p.position.distance_to(route.home_entry)<3,"Apartment exit reaches home entrance")
 if DisplayServer.get_name()!="headless":
  p.camera.look_at(car.position+Vector3.UP*.8)
  for i in 12:await process_frame
  await RenderingServer.frame_post_draw
  root.get_texture().get_image().save_png("res://validation/apartment-yellow-lexus.png")
  p.camera.rotation.x=0
 for cycle in 12:
  car.enter()
  Input.action_press("forward")
  for i in 20:await physics_frame
  Input.action_release("forward");car.body.linear_velocity=Vector3.ZERO;car.body.angular_velocity=Vector3.ZERO;car.speed=0;car.exit_car()
  Input.action_press("right")
  for i in 40:await physics_frame
  Input.action_release("right")
  check(not car.driving and p.velocity.is_finite() and p.global_transform.is_finite() and not p.reset_motion_pending,"Drive, exit, walk cycle "+str(cycle))
 a.interact("home_enter")
 for i in 40:await physics_frame
 check(a.inside and p.global_transform.is_finite(),"Can return home after driving")
 print("APARTMENT START FAILURES ",failures);quit(1 if failures else 0)
