extends SceneTree
var lab
var failures:=0
func _initialize():call_deferred("run")
func check(ok:bool,title:String):
 print(("PASS " if ok else "FAIL ")+title)
 if not ok:failures+=1
func shot(id:String,p:Vector3,target:Vector3,outside:bool=true):
 var cam=Camera3D.new();lab.add_child(cam);cam.position=p;cam.look_at(target);cam.current=true;cam.fov=62
 if outside:cam.environment=lab.staff_exit.outdoor_environment
 for i in 8:await process_frame
 await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("res://validation/restored-"+id+".png");cam.queue_free()
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 10:await process_frame
 var route=lab.staff_exit
 check(lab.player.position.distance_to(Vector3(0,.05,9.4))<.1,"New game starts inside Lab B")
 check(not route.outside and not route.doffed and not route.dressed,"Lab clothing and lighting state restored")
 check(route.vehicles.size()==2,"Two separate vehicles")
 for car in route.vehicles:
  check(absf(car.position.z+43)<.1,"Car parked at workplace: "+car.plate_text)
  check(car.road_wheels.size()==4,"Four animated wheels: "+car.plate_text)
 check(route.vehicles[1].plate_text=="HWN 279","IS250 registration")
 check(route.grounds.has_node("DownhillRoadAndTown"),"Original downhill village active")
 check(route.grounds.get_node("DownhillRoadAndTown").points[-1].z< -1160,"Road extended beyond old village")
 check(route.apartment.home==Vector3(-54.4,-48,-975),"Apartment entry moved to right end of facade")
 lab.close_panel();lab.game_ui.hide()
 await shot("lab",Vector3(.3,1.7,7),Vector3(-3.8,1.5,5.8),false)
 await shot("parking",Vector3(-11,3,-50),Vector3(0,.8,-43))
 var red=route.vehicles[1];var p=red.position
 await shot("is250-front",p+Vector3(3.0,1.65,-4.7),p+Vector3(0,.73,0))
 await shot("is250-rear",p+Vector3(3.1,1.65,3.7),p+Vector3(0,.73,0))
 await shot("village",Vector3(13,-23,-897),Vector3(-20,-43,-1010))
 await shot("home",Vector3(-12,-37,-950),Vector3(-57,-36,-955))
 await shot("home-entry",route.home_entry+Vector3(9,2.1,5),route.home_entry+Vector3(0,1.4,0))
 route.interact("home_enter");check(route.apartment.inside,"Apartment can be entered")
 route.interact("home_leave");check(not route.apartment.inside and lab.player.position.distance_to(route.home_entry)<3,"Apartment returns to relocated door")
 red.enter();check(route.vehicle==red and red.driving,"Red car becomes active vehicle")
 for i in 10:await process_frame
 await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png("res://validation/restored-is250-cockpit.png")
 red.exit_car();check(not red.driving and lab.player.enabled,"Exit red car restores walking")
 route.vehicles[0].enter();check(route.vehicle==route.vehicles[0],"Can switch back to gold IS200")
 print("RESTORED VILLAGE FAILURES: ",failures);quit(1 if failures else 0)
