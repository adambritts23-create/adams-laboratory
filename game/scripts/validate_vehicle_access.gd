extends SceneTree
var lab
var car
var failures=0
func _initialize():call_deferred("run")
func check(ok:bool,title:String):
 print("PASS " if ok else "FAIL ",title)
 if not ok:failures+=1
func settle(p:Vector3,yaw:float):
 car.body.freeze=true;car.body.position=p;car.body.rotation=Vector3(0,yaw,0);car.body.linear_velocity=Vector3.ZERO;car.body.angular_velocity=Vector3.ZERO;car.steering=0;car.body.steering=0;car.speed=0
 car.global_transform=car.body.global_transform;car.body.freeze=false
 for i in 90:await physics_frame
func drive(frames:int):
 Input.action_press("forward")
 for i in frames:await physics_frame
 Input.action_release("forward")
func run():
 lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 12:await physics_frame
 lab.close_panel();var route=lab.staff_exit
 for v in route.vehicles:
  car=v;car.enter()
  await settle(Vector3(4.5 if not car.is250 else -4.5,.1,-55),PI)
  await drive(160)
  check(car.position.z> -63,"Closed gate blocks "+car.plate_text)
  if not route.grounds.gate_open:route.grounds.toggle_gate()
  for i in 110:await physics_frame
  await drive(220)
  check(car.position.z< -78,"Open gate clears "+car.plate_text)
  car.body.linear_velocity=Vector3.ZERO;car.body.angular_velocity=Vector3.ZERO;car.speed=0;car.exit_car()
  route.grounds.toggle_gate()
  for i in 110:await physics_frame
 car=route.vehicles[0];car.enter()
 await settle(Vector3(-165,-47.5,-970),PI)
 var start=car.position
 await drive(210)
 check(car.position.distance_to(start)>12 and car.body.basis.y.dot(Vector3.UP)>.8,"Grass remains driveable with suspension")
 for station in [1010,1060,1100]:
  await settle(Vector3(4,-47.7,-station) if station==1010 else Vector3(29,preload("res://scripts/medieval_layout.gd").level(station)+.3,-station),PI/2)
  await drive(600)
  print("Bridge ",station," car ",car.position)
  check(car.position.x>58 and absf(car.position.z+station)<3,"Car traverses bridge approach "+str(station))
 car.body.linear_velocity=Vector3.ZERO;car.speed=0;car.exit_car()
 var a=route.apartment;a.interact("home_enter")
 var space=lab.get_world_3d().direct_space_state
 for p in [Vector3(5,.95,-.3),Vector3(5,.95,-1.3),Vector3(5,.95,-2.4)]:
  var q=PhysicsShapeQueryParameters3D.new();q.shape=CapsuleShape3D.new();q.shape.radius=.23;q.shape.height=1.75;q.transform.origin=a.global_position+p;q.exclude=[lab.player.get_rid()]
  check(space.intersect_shape(q).is_empty(),"Kitchen aisle "+str(p))
 print("ACCESS FAILURES ",failures);quit(1 if failures else 0)
