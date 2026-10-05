extends SceneTree
var lab
var failures:=0
func _initialize():call_deferred("run")
func check(ok:bool,title:String):
 print(("PASS " if ok else "FAIL ")+title)
 if not ok:failures+=1
func shot(id:String):
 await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("res://validation/home-"+id+".png")
func run():
 root.size=Vector2i(1440,900)
 lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 10:await process_frame
 lab.close_panel()
 var r=lab.staff_exit;var a=r.apartment;var car=r.vehicle
 check(lab.player.position.distance_to(a.home)<12,"Starts outside home")
 for i in 50:await physics_frame
 check(absf(lab.player.position.y)<.5,"Home spawn supported by ground")
 if not "--physics" in OS.get_cmdline_user_args():await shot("outside")
 check(a.interact("home_enter") and a.inside,"Entrance opens third-floor apartment")
 for i in 40:await physics_frame
 check(absf(lab.player.position.y-a.global_position.y)<.5,"Apartment has solid floor")
 if not "--physics" in OS.get_cmdline_user_args():
  await shot("apartment")
  lab.player.position=a.global_position+Vector3(2.5,.1,-1.95);lab.player.rotation.y=.6
  for i in 6:await process_frame
  await shot("kitchen")
 check(a.interact("home_leave") and not a.inside,"Apartment exit returns to entrance")
 for i in 40:await physics_frame
 check(lab.player.position.distance_to(a.home)<4,"Returns outside with stable position")
 car.enter()
 for i in 15:await process_frame
 if not "--physics" in OS.get_cmdline_user_args():await shot("cockpit")
 Input.action_press("forward")
 for i in 100:await physics_frame
 Input.action_release("forward")
 check(car.speed>2,"Lexus moves from home parking")
 check(car.rpm<4000,"Engine revs rise gradually")
 car.speed=0
 print("HOME FAILURES: ",failures)
 quit(1 if failures else 0)
