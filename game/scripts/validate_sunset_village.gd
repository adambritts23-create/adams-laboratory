extends "res://scripts/validate_lake_views.gd"
func check(ok:bool,title:String):
 print("PASS " if ok else "FAIL ",title)
 if not ok:failures+=1
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await physics_frame
 lab.close_panel();lab.game_ui.hide();route=lab.staff_exit
 var a=route.apartment;var e=lab.expansion;var p=lab.player
 a.interact("apartment_rifle");check(e.owns_rifle and e.equipped,"Apartment AK47 is usable and equips existing weapon")
 e.chamber()
 for i in 45:await physics_frame
 var rounds=e.rounds;p.rotation.y=0;p.camera.rotation.x=0
 check(e.fire() and e.rounds==rounds-1,"Apartment AK47 chambers and fires")
 e.rounds=0;a.interact("apartment_ammo");check(e.rounds==30 and not e.chambered,"Apartment ammo reloads a magazine")
 check(e.rack_model.visible,"Apartment pickup leaves laboratory rifle display in place")
 e.set_equipped(false)
 var balcony=a.balcony
 balcony.interact("balcony_toggle")
 for i in 35:await physics_frame
 check(balcony.opened and balcony.blockers[0].collision_layer==4,"Open balcony doors remain selectable")
 balcony.interact("balcony_toggle")
 for i in 35:await physics_frame
 check(not balcony.opened and balcony.blockers[0].collision_layer==1 and absf(balcony.pivots[0].rotation.y)<.001,"Balcony closes and restores glass collision")
 var space=lab.get_world_3d().direct_space_state
 for qpos in [Vector3(5,.94,-.15),Vector3(4.6,.94,-1.0),Vector3(4.6,.94,-2.3),Vector3(5.65,.94,-2.9)]:
  var query=PhysicsShapeQueryParameters3D.new();query.shape=CapsuleShape3D.new();query.shape.radius=.28;query.shape.height=1.75;query.transform.origin=a.to_global(qpos);query.exclude=[p.get_rid()]
  check(space.intersect_shape(query).is_empty(),"Kitchen walkway clear "+str(qpos))
 if DisplayServer.get_name()!="headless":
  var outdoor=route.outdoor_environment;route.outdoor_environment=a.interior_environment
  await shot("kitchen-wider-table",a.to_global(Vector3(4.9,1.65,-.1)),a.to_global(Vector3(5.65,.8,-1.8)))
  route.outdoor_environment=outdoor
 a.interact("home_leave")
 var land=route.grounds.get_node("DownhillRoadAndTown")
 check(land.has_node("GeneratedForestRoad"),"Road Generator baked roadway loaded")
 check(land.has_node("MedievalWaterfront/MidsummerGreen"),"Midsummer green replaces central houses")
 check(land.get_node("MedievalWaterfront").find_children("DalarnaTimberHouse*","Node3D",false,false).size()<31,"Removed houses from symmetric rows")
 # Walk across road and pavement without jumping, in both directions.
 for side in [-1,1]:
  p.global_position=Vector3(side*8,-47.8,-702);p.rotation.y=0;p.reset_motion()
  for i in 25:await physics_frame
  Input.action_press("right" if side<0 else "left")
  for i in 220:await physics_frame
  Input.action_release("right" if side<0 else "left")
  check(p.position.x*side< -3,"Walk across sloped pavement edge, side "+str(side))
 var car=route.vehicles[0]
 for side in [-1,1]:
  car.body.global_position=Vector3(side*10,-47.7,-702);car.body.rotation=Vector3(0,-side*PI/2,0);car.global_transform=car.body.global_transform;car.speed=0;car.body.linear_velocity=Vector3.ZERO;car.enter()
  for i in 50:await physics_frame
  Input.action_press("forward")
  for i in 200:await physics_frame
  Input.action_release("forward")
  print("CROSSING CAR ",car.position)
  check(car.position.x*side< -7,"Lexus crosses pavement from grass, side "+str(side))
  car.body.linear_velocity=Vector3.ZERO;car.body.angular_velocity=Vector3.ZERO;car.speed=0;car.exit_car()
 if DisplayServer.get_name()!="headless":
  await shot("sunset-green",Vector3(58,-30,-1015),Vector3(38,-33,-1043))
  await shot("sunset-village",Vector3(5,-32,-999),Vector3(55,-42,-1060))
  await shot("sunset-road",Vector3(13,-45.9,-713),Vector3(-2,-47.5,-732))
 print("SUNSET VILLAGE FAILURES ",failures);quit(1 if failures else 0)
