extends SceneTree
var failures=0
func _initialize():call_deferred("run")
func check(ok,title):
 print("PASS " if ok else "FAIL ",title)
 if not ok:failures+=1
func run():
 var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 20:await physics_frame
 check(lab.staff_exit.apartment.inside,"Apartment start")
 var car=lab.staff_exit.vehicles[0]
 check(car.body.global_position.distance_to(lab.staff_exit.home_entry)<12,"Lexus immediately outside apartment")
 var d=lab.dialogue
 check(d.seen.is_empty(),"No speech before beginning shift")
 check(d.adam.stream.get_length()>2 and d.buyer.stream.get_length()>5 and car.radio.stream.get_length()>10,"Three nonempty imported speech clips")
 lab.close_panel();d.elapsed=2;d._process(.01)
 check(d.seen.has("adam") and d.adam.playing,"Adam opening speech starts")
 lab.paused=true;d._process(.01);check(d.adam.stream_paused,"Dialogue pauses with menu")
 lab.paused=false;d.adam.stop();d.speak("adam");check(not d.adam.playing,"Opening plays once")
 lab.staff_exit.apartment.interact("home_leave")
 lab.player.global_position=d.home_contact.global_position+Vector3(2,0,0);d._process(.01)
 check(d.seen.has("home_buyer") and d.buyer.playing,"Buyer speaks on approach")
 lab.sound.muted=true;d._process(.01);check(AudioServer.is_bus_mute(d.voice_bus),"Dialogue respects mute")
 lab.sound.muted=false;d.buyer.stop()
 var court=lab.find_child("PetrolForecourt",true,false)
 check(court.global_position.distance_to(Vector3(18,-48.05,-814))<.01,"Petrol station moved onto specified grass plot")
 for station in [803,825]:
  var clear=true
  for x in [6.5,8.0,10.0,12.0]:
   var q=PhysicsShapeQueryParameters3D.new();q.shape=BoxShape3D.new();q.shape.size=Vector3(1.8,1.4,2.5);q.transform.origin=Vector3(x,-47,-station)
   if not lab.get_world_3d().direct_space_state.intersect_shape(q).is_empty():clear=false
  check(clear,"Station driveway clear %d" % station)
 print("FAILURES ",failures)
 lab.free();await process_frame;quit(failures)
