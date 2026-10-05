extends SceneTree
var lab
var route
var car
var failures:=0
func _initialize():call_deferred("run")
func check(ok:bool,title:String):
 print(("PASS " if ok else "FAIL ")+title)
 if not ok:failures+=1
func frames(n:int):
 for i in n:await process_frame
func physics(n:int):
 for i in n:await physics_frame
func shot(id:String,pos:Vector3,target:Vector3,outside:bool):
 lab.game_ui.hide();var cam=Camera3D.new();lab.add_child(cam);cam.position=pos;cam.look_at(target);cam.fov=72;cam.current=true
 cam.environment=route.outdoor_environment if outside else route.staff_environment
 await frames(10);await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png("res://validation/outdoor-drive/"+id+".png");cam.queue_free();lab.player.camera.current=true;lab.game_ui.show()
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab;await frames(15);lab.close_panel();route=lab.staff_exit;car=route.vehicle
 lab.player.position=Vector3(0,.05,-29.0);lab.player.rotation.y=0
 Input.action_press("right");var steps=0
 while lab.player.position.x<14.0 and steps<400:
  await physics_frame;steps+=1
 Input.action_release("right");lab.player.velocity=Vector3.ZERO
 check(lab.player.position.x>13.5,"Lunch room and office are physically reachable from clean corridor")
 await shot("01-lunch",Vector3(3.4,1.65,-28.4),Vector3(8,1.15,-25),false)
 await shot("02-office",Vector3(11.4,1.65,-28.4),Vector3(16,1.15,-25),false)
 await shot("03-exterior",Vector3(10,2,-49),Vector3(4.5,.8,-43),true)
 lab.player.position=Vector3(3,.1,-43);car.enter();await physics(5)
 check(car.road_wheels.size()==4 and car.road_wheels[0][1].get_child_count()>0,"Wheel geometry is attached to animated axles")
 check(car.driving and not lab.player.enabled and car.camera.current,"Entering switches to cockpit and disables walking")
 lab.game_ui.hide();car.camera.current=true;await frames(10);await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png("res://validation/outdoor-drive/04-cockpit.png");lab.game_ui.show()
 lab.open_pause();var paused_position=car.position;await physics(8);check(car.position.distance_to(paused_position)<.001,"Pause freezes vehicle motion");lab.close_panel()
 check(not lab.player.enabled and car.driving,"Resume retains vehicle input ownership")
 var start=car.position
 Input.action_press("forward");await physics(100);Input.action_release("forward")
 check(car.position.distance_to(start)>2,"Throttle moves the collision body")
 car.exit_car();check(car.driving,"Cannot exit moving vehicle")
 Input.action_press("left");Input.action_press("forward");var yaw=car.rotation.y;await physics(35);Input.action_release("left");Input.action_release("forward")
 check(absf(car.rotation.y-yaw)>.05,"Steering changes heading")
 car.speed=0;car.body.global_position=Vector3(0,.02,-57);car.body.rotation=Vector3(0,PI,0);car.global_transform=car.body.global_transform;car.steering=0
 Input.action_press("forward");await physics(140);Input.action_release("forward")
 check(car.position.z> -62,"Closed gate blocks car")
 car.speed=0;route.grounds.toggle_gate();await create_timer(1.7).timeout
 Input.action_press("forward");await physics(230);Input.action_release("forward")
 check(car.position.z< -70,"Can drive through opened gate onto woodland road")
 car.speed=0;car.exit_car();await physics(3)
 check(not car.driving and lab.player.enabled and lab.player.camera.current,"Stopped car permits safe return to walking")
 await shot("05-woodland-road",Vector3(5,2,-79),Vector3(0,1,-120),true)
 print("DRIVING FAILURES: ",failures)
 lab.queue_free();await frames(3);quit(1 if failures else 0)
