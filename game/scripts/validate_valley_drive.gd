extends SceneTree
var lab
var car
var route
var failures:=0
func _initialize():call_deferred("run")
func check(ok:bool,label:String):
 print(("PASS " if ok else "FAIL ")+label)
 if not ok:failures+=1
func shot(id:String,pos:Vector3,target:Vector3):
 if DisplayServer.get_name()=="headless":return
 lab.game_ui.hide();var cam=Camera3D.new();lab.add_child(cam);cam.position=pos;cam.look_at(target);cam.fov=65;cam.current=true;cam.environment=route.outdoor_environment
 for i in 5:await process_frame
 await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("res://validation/valley-"+id+".png");cam.queue_free();car.camera.current=true
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await process_frame
 lab.close_panel();route=lab.staff_exit;car=route.vehicle
 await shot("car-front",Vector3(1,1.5,-48),Vector3(4.5,.8,-43))
 await shot("car-rear",Vector3(8,1.6,-38),Vector3(4.5,.8,-43))
 await shot("overlook",Vector3(20,4,-225),Vector3(0,-43,-720))
 await shot("town",Vector3(7,-43,-655),Vector3(0,-46,-760))
 if "--views-only" in OS.get_cmdline_user_args():quit();return
 car.enter();car.body.global_position=Vector3(0,.1,-110);car.body.rotation=Vector3(0,PI,0);car.speed=0
 var Landscape=load("res://scripts/valley_landscape.gd")
 var max_error=0.0
 for i in 4400:
  var s=-car.body.position.z
  var target=Vector3(Landscape.road_x(s+12),Landscape.road_height(s+12),-s-12)
  var delta_target=target-car.body.position
  var heading=atan2(delta_target.x,delta_target.z)
  var forward=car.body.basis.z
  var error=wrapf(heading-atan2(forward.x,forward.z),-PI,PI)
  Input.action_release("left");Input.action_release("right")
  if error>0:Input.action_press("left",minf(error*3,1))
  else:Input.action_press("right",minf(-error*3,1))
  if car.speed<13:Input.action_press("forward")
  else:Input.action_release("forward")
  await physics_frame
  if s>120:max_error=maxf(max_error,absf(car.body.position.y-Landscape.road_height(s)))
  if s>650:break
 Input.action_release("forward");Input.action_release("left");Input.action_release("right")
 check(car.position.z< -650,"Physical drive reaches town from factory plateau")
 check(absf(car.position.y+48)<1,"Car descends to valley elevation")
 check(max_error<1.5,"Vehicle follows road surface through descent")
 print("Final car position ",car.position," max height error ",max_error)
 car.speed=0
 await shot("arrival",car.position+Vector3(5,3,7),car.position+Vector3(0,1,-10))
 # Deterministic rev-rate and shift-hysteresis checks on the actual controller.
 car.rpm=850;car.gear=0;car.speed=7;car.shift_cooldown=0
 car.update_engine(1.0,1)
 check(car.rpm<=1500.01,"Rev rise limited to 650 RPM per second")
 car.speed=8.2;car.update_engine(.1,1);var shifted=car.gear
 car.speed=7.9;car.update_engine(1.0,1)
 check(shifted==1 and car.gear==1,"Gear hysteresis prevents hunting around upshift speed")
 print("VALLEY FAILURES: ",failures);quit(1 if failures else 0)
