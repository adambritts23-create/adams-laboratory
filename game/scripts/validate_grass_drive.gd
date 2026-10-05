extends SceneTree
var lab
var failures=0
func _initialize():call_deferred("run")
func check(ok:bool,label:String):
 print("PASS " if ok else "FAIL ",label)
 if not ok:failures+=1
func drive(car,p:Vector3,heading:float,frames:int):
 car.speed=0;car.body.velocity=Vector3.ZERO;car.body.position=p;car.body.rotation=Vector3(0,heading,0);car.global_transform=car.body.global_transform
 Input.action_press("forward")
 for i in frames:await physics_frame
 Input.action_release("forward");print("Grass drive ",car.position," floor ",car.body.is_on_floor())
func run():
 lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 12:await physics_frame
 lab.close_panel()
 for car in lab.staff_exit.vehicles:
  car.enter()
  await drive(car,Vector3(4.5,.1,-43),PI/2,150)
  check(car.position.x>15 and car.position.y> -1,"Parking to grass: "+car.plate_text)
  await drive(car,Vector3(190,-47.8,-1050),PI/2,220)
  check(car.position.x>210 and car.position.y> -51,"Cross former meadow boundary onto hills: "+car.plate_text)
  await drive(car,Vector3(10,-47.8,-1000),-PI/2,130)
  check(car.position.x<2 and car.position.y> -49,"Grass to pavement and road: "+car.plate_text)
  car.speed=0;car.exit_car();car.body.position=Vector3(-20,0,-40);car.global_transform=car.body.global_transform
 print("GRASS FAILURES: ",failures);quit(1 if failures else 0)
