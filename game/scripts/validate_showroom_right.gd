extends SceneTree
var failures=0
func _initialize():call_deferred("run")
func check(ok,title):
 print("PASS " if ok else "FAIL ",title)
 if not ok:failures+=1
func run():
 var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 lab.staff_exit.apartment.interact("home_leave")
 for i in 15:await physics_frame
 check(lab.find_child("LexusShowroom",true,false)==null,"Showroom removed")
 var sand=lab.find_child("PlaygroundSand",true,false)
 check(sand.global_position.distance_to(Vector3(59,-47.98,-853))<.1,"Playground retained beside shopping block")
 var space=lab.get_world_3d().direct_space_state
 var paths=[[Vector3(20,-47.1,-853),Vector3(40,-47.1,-853)],[Vector3(33,-47.1,-838.5),Vector3(51,-47.1,-838.5)],[Vector3(51,-47.1,-838.5),Vector3(51,-47.1,-853)],[Vector3(51,-47.1,-853),Vector3(59,-47.1,-853)]]
 for index in paths.size():
  var clear=true
  for i in 61:
   var q=PhysicsShapeQueryParameters3D.new();q.shape=BoxShape3D.new();q.shape.size=Vector3(.55,1.6,.55);q.transform.origin=paths[index][0].lerp(paths[index][1],i/60.0)
   if not space.intersect_shape(q).is_empty():clear=false;print("BLOCKED ",index," ",q.transform.origin," ",space.intersect_shape(q)[0].collider.get_path());break
  check(clear,"Clear access route %d" % index)
 if "--preview" in OS.get_cmdline_user_args():
  lab.game_ui.hide();var cam=Camera3D.new();lab.add_child(cam);cam.position=Vector3(-35,-18,-865);cam.look_at(Vector3(48,-43,-858));cam.environment=lab.staff_exit.outdoor_environment;cam.make_current()
  for i in 8:await process_frame
  await RenderingServer.frame_post_draw
  root.get_texture().get_image().save_png("res://validation/lexus-right.png")
 print("RIGHT SIDE FAILURES ",failures)
 lab.free();await process_frame;quit(failures)
