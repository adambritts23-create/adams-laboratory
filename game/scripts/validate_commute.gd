extends SceneTree
var lab
var route
var car
var landscape
var failures:=0
func _initialize():call_deferred("run")
func check(ok:bool,title:String):
 print(("PASS " if ok else "FAIL ")+title)
 if not ok:failures+=1
func shot(id:String,p:Vector3,t:Vector3):
 lab.game_ui.hide();landscape.navigation.hide();var c=Camera3D.new();lab.add_child(c);c.position=p;c.look_at(t);c.current=true;c.environment=route.outdoor_environment;c.far=4500
 for i in 4:await process_frame
 await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png("res://validation/commute-"+id+".png");c.queue_free()
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 5:await process_frame
 lab.close_panel();route=lab.staff_exit;car=route.vehicle;landscape=route.grounds.get_node("VasterasCommute")
 var line=landscape.route_line.duplicate()
 if "--to-work" in OS.get_cmdline_user_args():line.reverse()
 check(line.size()>100,"Full mapped route loaded")
 var gaps=0
 for p in line:
  var query=PhysicsRayQueryParameters3D.create(p+Vector3.UP*2,p-Vector3.UP*2)
  query.exclude=[route.grounds.gate.get_rid()]
  var hit=lab.get_world_3d().direct_space_state.intersect_ray(query)
  if hit.is_empty() or absf(hit.position.y-.035)>.07:gaps+=1;print("GAP ",p," hit ",hit)
 check(gaps==0,"Every route point has road collision; gaps="+str(gaps))
 if not "--headless-test" in OS.get_cmdline_user_args():
  await shot("industrial",Vector3(155,8,-175),Vector3(175,1,-220))
  await shot("roundabout",line[44]+Vector3(35,35,35),line[44])
  var entrance=landscape.point(landscape.data.entrance)
  await shot("5c",entrance+Vector3(15,2.3,4),entrance+Vector3(0,4,0))
 if "--views-only" in OS.get_cmdline_user_args():quit(1 if failures else 0);return
 car.enter();car.body.position=line[2]+Vector3.UP*.1;car.body.rotation=Vector3(0,atan2((line[3]-line[2]).x,(line[3]-line[2]).z),0);car.speed=0
 Engine.physics_ticks_per_second=240;Engine.time_scale=4
 var index=3;var worst=0.0;var stuck=0;var previous=car.body.position
 for frame in 45000:
  var pos=car.body.position
  while index<line.size()-1 and Vector2(pos.x-line[index].x,pos.z-line[index].z).length()<7:index+=1
  var target=line[index]-pos;var heading=atan2(target.x,target.z);var forward=car.body.basis.z
  var error=wrapf(heading-atan2(forward.x,forward.z),-PI,PI)
  Input.action_release("left");Input.action_release("right");Input.action_release("forward");Input.action_release("back")
  if error>0:Input.action_press("left",minf(error*3,1))
  else:Input.action_press("right",minf(-error*3,1))
  var desired=5.0 if absf(error)>.25 or target.length()<15 else 12.0
  if car.speed<desired:Input.action_press("forward")
  elif car.speed>desired+1:Input.action_press("back")
  await physics_frame
  worst=maxf(worst,absf(car.body.position.y))
  if frame%600==0:
   print("DRIVE waypoint ",index,"/",line.size()," position ",car.body.position)
   if car.body.is_on_wall():
    for n in car.body.get_slide_collision_count():
     var hit=car.body.get_slide_collision(n);print("CONTACT ",hit.get_collider()," at ",hit.get_position()," normal ",hit.get_normal())
   if previous.distance_to(car.body.position)<1:stuck+=1
   else:stuck=0
   previous=car.body.position
   if stuck>=3:break
  if index==line.size()-1 and target.length()<9:break
 Input.action_release("forward");Input.action_release("back");Input.action_release("left");Input.action_release("right");car.speed=0
 check(car.body.position.distance_to(line[-1])<15,"Physical drive reaches commute destination")
 check(worst<.5,"Vehicle stays on road level throughout commute")
 print("COMMUTE FAILURES: ",failures);quit(1 if failures else 0)

