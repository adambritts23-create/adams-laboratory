extends SceneTree
var lab
var route
var failed:=0
func _initialize():call_deferred("run")
func check(ok: bool,title: String):
 print(("PASS " if ok else "FAIL ")+title)
 if not ok:failed+=1
func frames(n: int):
 for i in n:await process_frame
func shot(id: String,pos: Vector3,target: Vector3,outdoor: bool=false):
 lab.game_ui.hide()
 var cam=Camera3D.new();lab.add_child(cam);cam.position=pos;cam.look_at(target);cam.fov=68;cam.current=true
 cam.environment=route.outdoor_environment if outdoor else null
 await frames(12);await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("res://validation/exit-route/"+id+".png")
 cam.queue_free();lab.player.camera.current=true;lab.game_ui.show()
func walk_to(z: float) -> bool:
 lab.player.rotation.y=0 if z<lab.player.position.z else PI
 Input.action_press("forward")
 var count:=0
 while absf(lab.player.position.z-z)>.16 and count<380:
  await physics_frame;count+=1
 Input.action_release("forward");lab.player.velocity=Vector3.ZERO
 print("WALK END ",lab.player.position," target ",z)
 for i in lab.player.get_slide_collision_count():print("COLLISION ",lab.player.get_slide_collision(i).get_collider().get_path())
 return absf(lab.player.position.z-z)<.22
func run():
 root.size=Vector2i(1440,900)
 lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 await frames(20);lab.close_panel();route=lab.staff_exit
 lab.player.position=Vector3(0,.05,-10.6);lab.player.velocity=Vector3.ZERO
 check(not route.opened.staff_entry,"Staff exit starts shut")
 route.interact("scanner_entry");check(not route.opened.scanner_entry,"Coveralls required before scanner room")
 route.interact("scanner_exit");check(not route.opened.scanner_exit,"Scan required before clean lockers")
 route.interact("parking_exit");check(not route.opened.parking_exit,"Normal clothes required before parking")
 route.interact("staff_entry");await create_timer(.8).timeout
 check(await walk_to(-15.5),"Player walks through actual rear-wall opening")
 route.interact("exit_hang");check(route.doffed and route.hanging.visible,"Coveralls appear on hook")
 route.interact("scanner_entry");await create_timer(.8).timeout
 check(await walk_to(-21.7),"Player enters scanner portal")
 route.interact("exit_scan");route._process(3.1)
 check(route.scanned,"Three-second stationary scan completes")
 route.interact("scanner_exit");await create_timer(.8).timeout
 check(await walk_to(-26.8),"Player enters clean locker room")
 route.interact("exit_clothes");check(route.dressed,"Normal clothing collected")
 route.interact("parking_exit");await create_timer(.8).timeout
 check(await walk_to(-33.4),"Player walks out to parking")
 check(route.outside and lab.player.camera.environment!=null,"Outdoor environment activates")
 check(await walk_to(-26.5),"Return route is walkable")
 check(not route.outside and lab.player.camera.environment==null,"Indoor environment restores")
 lab.player.position=Vector3(0,.05,-16);route.interact("exit_hang");check(not route.doffed and not route.scanned and not route.dressed,"Putting coveralls back resets exit sequence")
 print("EXIT ROUTE FAILURES: ",failed)
 lab.queue_free();await frames(3);quit(1 if failed else 0)
