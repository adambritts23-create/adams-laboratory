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
 var shops=lab.find_child("VillageShops",true,false);var plaza=lab.find_child("ShoppingPlaza",true,false)
 check(shops.global_basis.z.dot(Vector3.LEFT)>.99,"ICA frontage faces main road")
 check(plaza.parked.size()==3,"Three parked cars")
 check(plaza.find_children("ParkingLotLight*","SpotLight3D",true,false).size()==3,"Three parking floodlights")
 var space=lab.get_world_3d().direct_space_state
 var clear=true
 for x in range(8,38):
  var q=PhysicsShapeQueryParameters3D.new();q.shape=BoxShape3D.new();q.shape.size=Vector3(.55,1.6,.55);q.transform.origin=Vector3(x,-47.1,-892)
  if not space.intersect_shape(q).is_empty():clear=false;print("BLOCKED entrance ",x)
 check(clear,"Walk from road through supermarket entrance")
 var pawn=lab.find_children("*","Area3D",true,false).filter(func(n):return n.get_meta("interaction","")=="pawn_sell")
 check(pawn.size()==1 and pawn[0].global_position.distance_to(Vector3(55.3,-46.8,-920.6))<.1,"Pawn interaction follows shop")
 check(lab.find_child("LexusShowroom",true,false)==null,"Showroom removed")
 if "--preview" in OS.get_cmdline_user_args():
  lab.game_ui.hide();lab.staff_exit.grounds.set_time_of_day("Dusk")
  var cam=Camera3D.new();lab.add_child(cam);cam.position=Vector3(-5,-39,-878);cam.look_at(Vector3(44,-41,-892));cam.environment=lab.staff_exit.outdoor_environment;cam.make_current()
  for i in 8:await process_frame
  await RenderingServer.frame_post_draw
  root.get_texture().get_image().save_png("res://validation/ica-road-facing.png")
 print("SHOPPING FAILURES ",failures)
 lab.free();await process_frame;quit(failures)
