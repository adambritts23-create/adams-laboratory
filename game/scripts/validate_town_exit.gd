extends SceneTree
var failures=0
func _initialize():call_deferred("run")
func check(ok:bool,title:String):
 print("PASS " if ok else "FAIL ",title)
 if not ok:failures+=1
func run():
 var world=load("res://scenes/lab_b.tscn").instantiate();root.add_child(world);current_scene=world
 if world.staff_exit.apartment.inside:world.staff_exit.apartment.interact("home_leave")
 for i in 25:await physics_frame
 var space=world.get_world_3d().direct_space_state
 var lane=true;var grounded=true
 for x in range(-20,-1060,-5):
  var query=PhysicsShapeQueryParameters3D.new();query.shape=BoxShape3D.new();query.shape.size=Vector3(3,1.4,2);query.transform.origin=Vector3(x,-47,-765);query.collision_mask=1
  if not space.intersect_shape(query).is_empty():lane=false;print("BLOCKED ",x)
  var hit=space.intersect_ray(PhysicsRayQueryParameters3D.create(Vector3(x,-47,-765),Vector3(x,-49,-765),1))
  if hit.is_empty() or absf(hit.position.y+48)>.08:grounded=false
 check(lane,"Outbound road clears a car-sized envelope")
 check(grounded,"Continuous driveable road reaches the map edge")
 var spur=true
 for s in range(720,756,3):
  var query=PhysicsShapeQueryParameters3D.new();query.shape=BoxShape3D.new();query.shape.size=Vector3(2,1.4,3);query.transform.origin=Vector3(-155,-47,-s);query.collision_mask=1
  if not space.intersect_shape(query).is_empty():spur=false
 check(spur,"Right turn and church approach clear")
 check(world.find_child("CentralArtwork",true,false).scale.x==1.25,"Roundabout artwork restored to previous size")
 # Closely spaced rays ensure the new shoulder is a slope, not a step.
 var last=-48.0;var smooth=true
 for i in 22:
  var hit=space.intersect_ray(PhysicsRayQueryParameters3D.create(Vector3(-300,-47,-765+5.5+i*.1),Vector3(-300,-49,-765+5.5+i*.1),1))
  if hit.is_empty():smooth=false;print("MISSING SHOULDER ",i);continue
  if absf(hit.position.y-last)>.04:smooth=false;print("SHOULDER STEP ",i," ",last," -> ",hit.position.y)
  last=hit.position.y
 check(smooth,"Grass-to-road shoulder has no jump-sized edge")
 world.close_panel();world.player.enabled=true
 for spec in [[Vector3(-300,-47.9,-757),0.0,0],[Vector3(9.5,-47.9,-890),-PI/2,1]]:
  world.player.position=spec[0];world.player.rotation.y=spec[1];world.player.reset_motion()
  for i in 12:await physics_frame
  Input.action_press("forward")
  for i in 85:await physics_frame
  Input.action_release("forward")
  check(world.player.position.z< -760 if spec[2]==0 else world.player.position.x>13,"Walk from grass onto "+("outbound road" if spec[2]==0 else "shopping pavement")+" without jumping")
 print("TOWN EXIT FAILURES ",failures)
 quit(1 if failures else 0)
