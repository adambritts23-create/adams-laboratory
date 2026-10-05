extends SceneTree
var failures=0
class Player extends CharacterBody3D:
 var enabled=true
 var camera=Camera3D.new()
 var shape_node=CollisionShape3D.new()
 func reset_motion():velocity=Vector3.ZERO
class Hands extends Node:
 func holding():return false
class Route extends Node3D:
 var garage=null
 var outdoor_environment=Environment.new()
 var vehicle
 var lab
class World extends Node3D:
 var player=Player.new()
 var glassware=Hands.new()
 var sound={"muted":true}
 var hud=Label.new()
 var paused=false
 func say(_text,_duration=4):pass
func check(ok,title):
 print("PASS " if ok else "FAIL ",title)
 if not ok:failures+=1
func _initialize():call_deferred("run")
func run():
 var world=World.new();root.add_child(world)
 for node in [world.player,world.glassware,world.hud]:world.add_child(node)
 world.player.add_child(world.player.camera);world.player.add_child(world.player.shape_node);world.player.shape_node.shape=CapsuleShape3D.new();world.player.shape_node.shape.height=1.75;world.player.shape_node.shape.radius=.28;world.player.shape_node.position.y=.875
 var route=Route.new();world.add_child(route);route.lab=world
 var land=load("res://scripts/valley_landscape.gd").new();world.add_child(land);land.init_materials();land.route=route;land.asphalt=land.material(Color(.14,.15,.15))
 land.box(Vector3(0,-48.15,-765),Vector3(180,.2,170),land.material(Color(.2,.32,.10)),true)
 land.box(Vector3(0,-48.025,-765),Vector3(12,.05,160),land.asphalt,true)
 land.box(Vector3(31,-48.02,-753),Vector3(42,.16,48),land.concrete,true)
 land.cottage(Vector3(52,-48,-748),15,19,Color(.78,.72,.55),2)
 var civic=load("res://scripts/civic_square.gd").new();land.add_child(civic);civic.build(land)
 for p in [Vector3(-18,-48,-744),Vector3(-18,-48,-775),Vector3(18,-48,-713)]:land.cottage(p,9,12,Color(.62,.11,.06),2)
 var gardens=load("res://scripts/village_gardens.gd").new();land.add_child(gardens);gardens.land=land;gardens.init_materials();gardens.timber=gardens.material(Color(.4,.26,.13));gardens.flower_mesh=SphereMesh.new();gardens.shrub_mesh=gardens.leaf_cluster();gardens.garden(Vector3(-18,-48,-775),9,12);gardens.flush_batches()
 check(civic.find_children("kingPanel*","MeshInstance3D",true,false).size()==4,"Four illuminated portrait faces")
 check(civic.find_children("emblemPanel*","MeshInstance3D",true,false).size()==4 and civic.find_children("crownsPanel*","MeshInstance3D",true,false).size()==4,"Both supplied emblems crown the monument")
 check(civic.residents.actors.size()==30,"Square has walkers, standing residents and a seated visitor")
 await physics_frame
 var space=world.get_world_3d().direct_space_state
 var lane_clear=true
 for i in 48:
  var a=i*TAU/48;var p=Vector3(cos(a)*9.2,-47.0,-765+sin(a)*9.2)
  var q=PhysicsShapeQueryParameters3D.new();q.shape=BoxShape3D.new();q.shape.size=Vector3(2,1.4,4.5);q.transform=Transform3D(Basis(Vector3.UP,-a),p);q.collision_mask=1
  if not space.intersect_shape(q).is_empty():lane_clear=false
 check(lane_clear,"Complete roundabout lane clears car-sized collision envelope")
 var surface=space.intersect_ray(PhysicsRayQueryParameters3D.create(Vector3(9.2,-46,-765),Vector3(9.2,-49,-765),1))
 check(not surface.is_empty() and absf(surface.position.y+47.945)<.02,"Roundabout lane joins road without a raised slab edge")
 if "--preview" in OS.get_cmdline_user_args():
  var sun=DirectionalLight3D.new();world.add_child(sun);sun.rotation_degrees=Vector3(-30,-40,0);sun.light_cull_mask=3
  var env=WorldEnvironment.new();world.add_child(env);env.environment=Environment.new();env.environment.background_mode=Environment.BG_COLOR;env.environment.background_color=Color(.24,.32,.43);env.environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;env.environment.ambient_light_color=Color(.8,.8,.85);env.environment.ambient_light_energy=.65
  var cam=world.player.camera;cam.position=Vector3(-27,-29,-792);cam.look_at(Vector3(13,-43,-757));cam.make_current()
  if "--close" in OS.get_cmdline_user_args():cam.position=Vector3(-12,-41,-778);cam.look_at(Vector3(1,-43,-765))
  for i in 8:await process_frame
  await RenderingServer.frame_post_draw
  root.get_texture().get_image().save_png("res://validation/civic-square.png")
 else:
  for action in ["forward","back","left","right"]:
   if not InputMap.has_action(action):InputMap.add_action(action)
  for variant in [false,true]:
   var car=load("res://scripts/driveable_is200.gd").new();world.add_child(car);car.is250=variant;car.build(world,route);car.body.global_position=Vector3(-55,-47.7,-770);car.body.rotation=Vector3.ZERO;car.global_transform=car.body.global_transform
   var dispatch=load("res://scripts/staff_exit.gd").new();world.add_child(dispatch);dispatch.lab=world;dispatch.set_process(false);dispatch.vehicles.append(car)
   for cycle in 3:
    dispatch.interact(car.interaction_id)
    for i in 45:await physics_frame
    car.body.sleeping=true
    var start=car.body.global_position
    Input.action_press("forward")
    for i in 100:await physics_frame
    Input.action_release("forward")
    check(car.body.global_position.distance_to(start)>1,"Lexus "+str(variant)+" restarts after sleeping; cycle "+str(cycle))
    car.body.linear_velocity=Vector3.ZERO;car.body.angular_velocity=Vector3.ZERO;car.speed=0;car.exit_car()
    check(not car.driving,"Lexus exits in repeated parking cycle")
    await physics_frame
    var eye=world.player.global_position+Vector3.UP*1.65
    var toward=car.body.global_position+Vector3.UP*1.65
    var query=PhysicsRayQueryParameters3D.create(eye,eye+(toward-eye).normalized()*3,5,[world.player.get_rid()]);query.collide_with_areas=true
    var hit=space.intersect_ray(query)
    check(not hit.is_empty() and hit.collider.get_meta("interaction","")==car.interaction_id,"Parked Lexus entry is targetable at standing eye level")
    if not hit.is_empty():dispatch.interact(str(hit.collider.get_meta("interaction","")))
    check(car.driving,"Ray-selected entry routes through actual staff interaction handler")
    car.body.linear_velocity=Vector3.ZERO;car.body.angular_velocity=Vector3.ZERO;car.speed=0;car.exit_car()
   for audio in [car.engine,car.loaded,car.radio]:audio.stop();audio.stream=null
   await create_timer(.15).timeout
   dispatch.free();car.body.free();car.free()
 world.free();await create_timer(.15).timeout
 print("CIVIC FAILURES ",failures);quit(1 if failures else 0)
