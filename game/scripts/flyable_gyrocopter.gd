extends "res://scripts/lab_props.gd"
# Arcade autogyro: forward-speed lift, gravity, swept collisions, no hovering.
var lab
var route
var body:CharacterBody3D
var camera:Camera3D
var rotor:Node3D
var propeller:Node3D
var engine:AudioStreamPlayer3D
var driving=false
var interaction_id=""
var throttle=0.0
var speed=0.0
var rotor_speed=0.0
var yaw=0.0
var look_yaw=0.0
var look_pitch=-.18
var chase=true
var spawn=Vector3.ZERO
var last_ground_y=0.0
func build(world,r,p:Vector3,id:String,color:Color):
 lab=world;route=r;spawn=p;interaction_id=id;name=id;init_materials()
 body=CharacterBody3D.new();lab.add_child(body);body.name=id+"Body";body.position=p;body.collision_layer=1;body.collision_mask=1;body.floor_snap_length=.2
 var shape=CollisionShape3D.new();body.add_child(shape);shape.shape=BoxShape3D.new();shape.shape.size=Vector3(1.75,1.8,3.5);shape.position.y=1.1
 body.set_meta("interaction",id);body.set_meta("title","Pilot gyrocopter")
 var access=Area3D.new();body.add_child(access);access.collision_layer=4;access.collision_mask=0;access.set_meta("interaction",id);access.set_meta("title","Pilot gyrocopter")
 var hit=CollisionShape3D.new();access.add_child(hit);hit.shape=BoxShape3D.new();hit.shape.size=Vector3(2.6,2.1,3.8);hit.position.y=1.05
 var paint=material(color,.35,.35)
 ellipsoid(Vector3(0,.88,-.7),Vector3(.85,.52,1.35),paint)
 box(Vector3(0,.78,.32),Vector3(1.5,.16,1.35),paint)
 for side in [-1,1]:
  box(Vector3(side*.39,1,.25),Vector3(.59,.13,.68),dark)
  var back=box(Vector3(side*.39,1.35,.58),Vector3(.59,.70,.12),rubber);back.rotation.x=.12
  tube(Vector3(side*.72,.8,-1.45),Vector3(side*.72,1.65,-.8),.035,metal)
  tube(Vector3(side*.72,1.65,-.8),Vector3(side*.72,1.05,.15),.035,metal)
  tube(Vector3(side*.38,.8,.25),Vector3(side*.44,.3,.72),.05,metal)
  tube(Vector3(side*.44,.3,.72),Vector3(side*1.03,.3,.72),.065,metal)
  var tire=cylinder(Vector3(side*1.05,.27,.72),.27,.16,rubber);tire.rotation.z=PI/2
  var hub=cylinder(Vector3(side*1.15,.27,.72),.12,.025,metal);hub.rotation.z=PI/2
 tube(Vector3(0,.72,-1.25),Vector3(0,.22,-1.65),.045,metal)
 var front=cylinder(Vector3(0,.22,-1.65),.22,.15,rubber);front.rotation.z=PI/2
 var wind=box(Vector3(0,1.34,-1.02),Vector3(1.34,.62,.025),material(Color(.4,.7,.8,.28),.1,.2));wind.rotation.x=-.35
 box(Vector3(0,1.14,-.62),Vector3(1.26,.22,.10),dark)
 for side in [-1,1]:
  var dial=cylinder(Vector3(side*.3,1.16,-.56),.085,.025,paper);dial.rotation.x=PI/2
  tube(Vector3(side*.3,.95,-.1),Vector3(side*.3,1.17,-.18),.024,dark)
 tube(Vector3(0,.7,.9),Vector3(0,.65,3.15),.095,metal)
 box(Vector3(0,.72,2.9),Vector3(2.15,.065,.72),paint)
 box(Vector3(0,1.18,3.05),Vector3(.08,1.12,.8),paint)
 tube(Vector3(-.48,.8,.7),Vector3(0,2.72,.7),.06,metal)
 tube(Vector3(.48,.8,.7),Vector3(0,2.72,.7),.06,metal)
 box(Vector3(0,1.22,1.12),Vector3(.72,.64,.57),dark)
 for side in [-1,1]:
  for i in 5:box(Vector3(side*.4,.99+i*.09,1.12),Vector3(.15,.035,.5),metal)
 var first=get_child_count()
 cylinder(Vector3(0,0,0),.18,.16,metal)
 for side in [-1,1]:
  var blade=box(Vector3(side*1.72,0,0),Vector3(3.28,.035,.19),dark);blade.rotation.z=side*.025
  box(Vector3(side*3.24,.015,0),Vector3(.23,.04,.20),amber)
 rotor=Node3D.new();add_child(rotor);rotor.position=Vector3(0,2.8,.65)
 for node in get_children().slice(first):
  if node!=rotor:node.reparent(rotor,false)
 first=get_child_count()
 box(Vector3.ZERO,Vector3(.13,1.72,.055),dark);box(Vector3.ZERO,Vector3(1.72,.13,.055),dark)
 propeller=Node3D.new();add_child(propeller);propeller.position=Vector3(0,1.42,1.54)
 for node in get_children().slice(first):
  if node!=propeller:node.reparent(propeller,false)
 label_at("BJÖRKDAL · GYRO",Vector3(0,1.03,-1.95),23,Color.WHITE,.003).rotation.y=PI
 for mesh in find_children("*","GeometryInstance3D",true,false):mesh.layers=2
 camera=Camera3D.new();add_child(camera);camera.fov=76;camera.near=.15;camera.far=300;camera.environment=route.outdoor_environment
 engine=AudioStreamPlayer3D.new();add_child(engine);engine.stream=load("res://audio/exterior/steady_hum.wav").duplicate();engine.stream.loop_mode=AudioStreamWAV.LOOP_FORWARD;engine.stream.loop_end=int(engine.stream.mix_rate*engine.stream.get_length());engine.volume_db=-22;engine.max_distance=60;engine.unit_size=5
 position=p;last_ground_y=p.y;update_camera()
func enter():
 if driving:return
 if lab.glassware.holding():lab.say("Put down the beaker before flying.");return
 driving=true;route.vehicle=self;throttle=0;body.velocity=Vector3.ZERO
 body.add_collision_exception_with(lab.player);lab.player.add_collision_exception_with(body)
 lab.player.enabled=false;lab.player.set_physics_process(false);lab.player.shape_node.disabled=true
 camera.current=true;engine.play();lab.say("W / S throttle · A / D turn · Space climb · Ctrl descend · V camera · E exit after landing",7)
func exit_car():
 if not body.is_on_floor() or Vector2(body.velocity.x,body.velocity.z).length()>1 or absf(body.velocity.y)>.8:
  lab.say("Land and stop before getting out.");return
 var found=false;var target=Vector3.ZERO
 for side in [-1,1]:
  var p=body.global_transform*Vector3(side*2,1,0)
  var ray=PhysicsRayQueryParameters3D.create(p+Vector3.UP*2,p-Vector3.UP*4,1,[body.get_rid(),lab.player.get_rid()])
  var ground=get_world_3d().direct_space_state.intersect_ray(ray)
  if ground.is_empty() or ground.normal.y<.7:continue
  p=ground.position+Vector3.UP*.06
  var q=PhysicsShapeQueryParameters3D.new();q.shape=lab.player.shape_node.shape;q.transform.origin=p+Vector3.UP*.875;q.exclude=[body.get_rid(),lab.player.get_rid()]
  if get_world_3d().direct_space_state.intersect_shape(q).is_empty():target=p;found=true;break
 if not found:lab.say("No clear place to step out. Taxi to open ground.");return
 driving=false;throttle=0;body.velocity=Vector3.ZERO;engine.stop()
 lab.player.global_position=target;lab.player.reset_motion();lab.player.shape_node.disabled=false;lab.player.set_physics_process(true);lab.player.enabled=true;lab.player.camera.current=true
 body.remove_collision_exception_with(lab.player);lab.player.remove_collision_exception_with(body);lab.say("Gyrocopter parked.")
func handle(event:InputEvent)->bool:
 if not driving:return false
 if event.is_action_pressed("ui_cancel"):return false
 if lab.paused:return true
 if event is InputEventMouseMotion:
  look_yaw=clampf(look_yaw-event.relative.x*.002,-1.3,1.3);look_pitch=clampf(look_pitch-event.relative.y*.002,-.8,.35)
 if event is InputEventKey and event.pressed and not event.echo:
  if event.physical_keycode==KEY_E:exit_car()
  if event.physical_keycode==KEY_V:chase=not chase
 return true
func _physics_process(dt):
 if body==null:return
 engine.stream_paused=lab.paused or lab.sound.muted
 if lab.paused:return
 if not driving and not route.grounds.is_inside_tree():
  hide();return
 show()
 if driving:
  simulate(dt,Input.get_axis("back","forward"),Input.get_axis("right","left"),float(Input.is_key_pressed(KEY_SPACE))-float(Input.is_key_pressed(KEY_CTRL)))
 else:
  body.velocity=Vector3(0,maxf(body.velocity.y-12*dt,-30),0);body.move_and_slide()
 position=body.position;rotation.y=yaw
 rotor_speed=move_toward(rotor_speed,26.0 if driving else 0.0,dt*8)
 rotor.rotate_y(rotor_speed*dt);propeller.rotate_z(rotor_speed*1.6*dt)
 if driving:
  lab.player.global_position=body.global_position;lab.player.enabled=false
  engine.pitch_scale=lerpf(.8,1.6,throttle);update_camera()
func simulate(dt:float,power:float,turn:float,lift:float):
 throttle=clampf(throttle+power*dt*.35,0,1)
 speed=move_toward(speed,throttle*32,dt*(4.0 if power>=0 else 7.0))
 yaw+=turn*dt*(.55 if body.is_on_floor() else .7)*clampf(speed/5,0,1)
 body.rotation.y=yaw
 var horizontal=-body.basis.z*speed
 body.velocity.x=horizontal.x;body.velocity.z=horizontal.z
 var airborne_lift=speed>=8 and (not body.is_on_floor() or lift>0)
 var vertical=lift*6.0 if airborne_lift else -minf(9,2+(8-speed)*.8)
 if airborne_lift and lift==0:vertical=-.6 if throttle<.3 else 0.0
 body.velocity.y=move_toward(body.velocity.y,vertical,dt*5)
 if body.global_position.y>15:body.velocity.y=minf(body.velocity.y,-3)
 # Keep the aircraft over the playable world rather than flying into empty space.
 var next=body.position+body.velocity*dt
 if next.x< -80 or next.x>80:body.velocity.x=0
 if next.z< -1025 or next.z> -40:body.velocity.z=0
 body.move_and_slide()
 body.position.x=clampf(body.position.x,-80,80)
 body.position.z=clampf(body.position.z,-1025,-40)
 if body.is_on_wall():speed=0;throttle=minf(throttle,.15)
 if body.is_on_floor():last_ground_y=body.position.y
 if body.position.y< -85 or not body.position.is_finite():
  body.position=spawn;body.velocity=Vector3.ZERO;speed=0;throttle=0;lab.say("Gyrocopter returned to its parking spot.")
func update_camera():
 camera.position=Vector3(0,3.8,7.8) if chase else Vector3(.38,1.65,-.12)
 camera.rotation=Vector3(look_pitch,look_yaw,0)
func driving_hint()->String:
 return "GYROCOPTER · %d km/h · Throttle %d%%\nW/S throttle · A/D turn · Space climb · Ctrl descend · V view · E exit when landed" % [roundi(speed*3.6),roundi(throttle*100)]
