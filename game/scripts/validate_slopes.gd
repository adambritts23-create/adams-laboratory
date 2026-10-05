extends SceneTree
var failures=0
func check(ok,label):
 print("PASS " if ok else "FAIL ",label)
 if not ok:failures+=1
func _initialize():call_deferred("run")
func run():
 var world=Node3D.new();root.add_child(world)
 var ramp=StaticBody3D.new();world.add_child(ramp);ramp.rotation.x=.20
 var floor_shape=CollisionShape3D.new();ramp.add_child(floor_shape);floor_shape.shape=BoxShape3D.new();floor_shape.shape.size=Vector3(20,1,100);floor_shape.position.y=-.5
 var body=load("res://scripts/stable_vehicle_body.gd").new();world.add_child(body)
 var shape=CollisionShape3D.new();body.add_child(shape);shape.shape=BoxShape3D.new();shape.shape.size=Vector3(1.8,1.35,4.4);shape.position.y=.74
 body.position=Vector3(0,4,-10);body.freeze=false;body.brake=60
 for i in 120:await physics_frame
 check(body.is_on_floor(),"Car settles on 11-degree ramp")
 body.brake=0;var before=body.position
 for i in 120:await physics_frame
 print("COAST ",body.position-before," velocity ",body.velocity," normal ",body.get_floor_normal())
 check(body.position.z>before.z+1 and body.velocity.z>2,"Gravity accelerates downhill coasting")
 check(body.is_on_floor() and body.surface_up.dot(Vector3.UP)<.99,"Ground contact and slope normal follow ramp")
 body.brake=45
 for i in 100:await physics_frame
 check(body.velocity.length()<.2,"Brakes stop and hold car on slope")
 body.brake=0;body.rotation.y=PI;body.linear_velocity=body.global_basis.z.slide(body.get_floor_normal()).normalized()*5
 var uphill_speed=body.velocity.length()
 for i in 60:await physics_frame
 check(body.velocity.length()<uphill_speed-1,"Gravity slows uphill coasting")
 print("SLOPE FAILURES ",failures);world.free();quit(1 if failures else 0)
