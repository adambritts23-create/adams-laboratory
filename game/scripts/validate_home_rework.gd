extends "res://scripts/validate_lake_views.gd"
func check(ok:bool,title:String):
 print("PASS " if ok else "FAIL ",title)
 if not ok:failures+=1
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await physics_frame
 lab.close_panel();lab.game_ui.hide();route=lab.staff_exit
 var garage=route.garage
 check(garage!=null and garage.glasses.size()==3,"Garage and three carryable beakers built")
 var a=route.apartment
 check(a.has_node("EntranceWeaponDisplay") and route.find_children("EntranceWeaponDisplay","",true,false).size()==1,"Single weapon display located in apartment")
 lab.player.global_position=garage.to_global(Vector3(-2,.1,-3.6));lab.player.velocity=Vector3.ZERO
 garage.interact("garage_calculation");check(lab.calculations.visible,"Garage opens existing calculations UI");lab.calculations.close()
 garage.interact("garage_wet");check(lab.workbench.visible and lab.workbench.bench_camera.global_position.distance_to(garage.global_position)<10,"Garage titration UI uses local bench camera");lab.workbench.close()
 var fixture=JSON.parse_string(FileAccess.get_file_as_string("res://validation/inventory-titration.json"));var w=lab.workbench
 w.setup=fixture.setup;w.points=fixture.points;w.diagrams=fixture.diagrams;w.chosen=w.points.size()-1;w.apply_vessel()
 garage.interact("garage_sample");check(lab.glassware.holding(),"Garage titration sample can be carried")
 var saved_count=w.points.size()
 garage.interact("garage_wet");check(not lab.glassware.holding() and w.points.size()>0,"Garage accepts and restores carried titration record")
 garage.interact("garage_sample")
 garage.interact("garage_sink");check(lab.glassware.held!=null and not lab.accounting.has_contents(lab.glassware.held),"Garage basin empties sample into local sink")
 garage.interact("garage_put");check(not lab.glassware.holding(),"Garage worktop accepts carried beaker")
 var b=garage.glasses[0];lab.glassware.pickup(b.get_meta("glass_target").get_meta("interaction").trim_prefix("glass_"));check(lab.glassware.held==b,"Empty garage beaker can be carried");garage.interact("garage_put")
 garage.interact("garage_door")
 for i in 50:await physics_frame
 var q=PhysicsRayQueryParameters3D.create(garage.to_global(Vector3(10,1,-.5)),garage.to_global(Vector3(2,1,-.5)),1)
 check(lab.get_world_3d().direct_space_state.intersect_ray(q).is_empty(),"Open garage doorway is unobstructed")
 for car in route.vehicles:
  check(car.suspension_wheels[0].suspension_stiffness==65,"Stiffer Lexus suspension")
  for cycle in 10:
   car.body.position=Vector3(-6 if car.is250 else 6,.1,-80);car.body.rotation=Vector3(0,PI,0);car.body.linear_velocity=Vector3.ZERO;car.body.angular_velocity=Vector3.ZERO;car.enter()
   Input.action_press("forward")
   for i in 40:await physics_frame
   Input.action_release("forward");car.body.linear_velocity=Vector3.ZERO;car.body.angular_velocity=Vector3.ZERO;car.speed=0;car.exit_car()
   for i in 4:await physics_frame
   check(not car.driving and car.body.valid_state() and lab.player.global_transform.is_finite(),"Finite state after drive/exit cycle "+str(cycle))
  check(car.body.recovery_count==0,"No physics recovery needed during repeated driving")
 lab.player.global_position=garage.to_global(Vector3(3,.1,-.5));lab.player.velocity=Vector3.ZERO
 # await shot("garage-outside",Vector3(-45,-44.5,-988),Vector3(-62,-46.5,-996))
 var outdoor=route.outdoor_environment;route.outdoor_environment=garage.environment
 # await shot("garage-lab",garage.to_global(Vector3(3,2.1,3)),garage.to_global(Vector3(-4,1.2,-2)))
 route.outdoor_environment=outdoor
 a.interact("home_enter")
 route.outdoor_environment=a.interior_environment
 # await shot("apartment-rack",a.to_global(Vector3(.25,1.65,-.70)),a.to_global(Vector3(-1.4,1.5,-1.45)))
 a.interact("home_leave");route.outdoor_environment=outdoor
 # await shot("dalarna-quarter",Vector3(4,-32,-983),Vector3(47,-44,-1018))
 print("HOME REWORK FAILURES ",failures);quit(1 if failures else 0)
