extends CharacterBody3D
var lab
var route
var camera:Camera3D
var driving=false
var speed=0.0
var title=""
var vehicle_id=""
var interaction_id=""
var engine:AudioStreamPlayer
func build(world,r,id,display):
 lab=world;route=r;vehicle_id=id;title=display.get_meta("car_title",id);name="Owned_"+id;set_meta("dynamic",true)
 collision_layer=1;collision_mask=1;floor_snap_length=.55;floor_max_angle=deg_to_rad(40)
 var shape=CollisionShape3D.new();var box=BoxShape3D.new();box.size=Vector3(1.8,1.45,4.6);shape.shape=box;shape.position.y=.74;add_child(shape)
 var model=display.duplicate();add_child(model);model.position=Vector3.ZERO;model.rotation=Vector3.ZERO
 for collider in model.find_children("*","CollisionObject3D",true,false):collider.collision_layer=0;collider.collision_mask=0
 interaction_id="owned_car_"+id;set_meta("interaction",interaction_id);set_meta("title","Drive "+title)
 camera=Camera3D.new();add_child(camera);camera.position=Vector3(0,3.4,-7);camera.rotation=Vector3(-.22,PI,0);camera.fov=70
 engine=AudioStreamPlayer.new();add_child(engine);engine.stream=load("res://audio/exterior/steady_hum.wav");engine.stream.loop_mode=AudioStreamWAV.LOOP_FORWARD;engine.stream.loop_end=int(engine.stream.mix_rate*engine.stream.get_length());engine.volume_db=-29
func enter():
 if lab.glassware.holding():lab.say("Put the beaker down before driving.");return
 if driving:return
 set_physics_process(true);velocity=Vector3.ZERO;speed=0
 driving=true;route.vehicle=self;lab.player.enabled=false;lab.player.set_physics_process(false);lab.player.shape_node.disabled=true;camera.environment=route.outdoor_environment;camera.current=true;engine.play()
func exit_car():
 if absf(speed)>.5:lab.say("Stop before leaving the car.");return
 var target=Vector3.ZERO;var clear=false
 for side in [-1,1]:
  var p=global_transform*Vector3(side*1.65,.1,0)
  var q=PhysicsShapeQueryParameters3D.new();q.shape=lab.player.shape_node.shape;q.transform.origin=p+Vector3.UP*.875;q.exclude=[get_rid(),lab.player.get_rid()]
  if get_world_3d().direct_space_state.intersect_shape(q).is_empty():target=p;clear=true;break
 if not clear:lab.say("The doors are obstructed.");return
 driving=false;engine.stop();speed=0;velocity=Vector3.ZERO
 lab.player.global_position=target;lab.player.reset_motion();lab.player.shape_node.disabled=false;lab.player.enabled=true;lab.player.set_physics_process(true);lab.player.camera.current=true
func handle(event):
 if not driving:return false
 if event.is_action_pressed("ui_cancel"):return false
 if lab.paused:return true
 if event is InputEventKey and event.pressed and not event.echo and event.physical_keycode==KEY_E:
  if absf(global_position.z+63)<9 and absf(global_position.x)<8:route.grounds.toggle_gate()
  else:exit_car()
 return true
func driving_hint():return title+"\nW/S drive · A/D steer · Space brake · E gate / exit"
func _physics_process(dt):
 if lab==null or not driving:return
 engine.stream_paused=lab.paused or lab.sound.muted
 if lab.paused:return
 var throttle=Input.get_axis("back","forward")
 speed=move_toward(speed,throttle*(26 if throttle>0 else 6),dt*(14 if Input.is_key_pressed(KEY_SPACE) else 3.2)) if not Input.is_key_pressed(KEY_SPACE) else move_toward(speed,0,dt*14)
 rotation.y+=Input.get_axis("right","left")*clampf(speed/6,-1,1)*dt*.7
 var forward=global_basis.z;velocity.x=forward.x*speed;velocity.z=forward.z*speed
 if not is_on_floor():velocity.y-=9.8*dt
 else:velocity.y=0
 move_and_slide()
 if is_on_wall():speed=move_toward(speed,0,dt*22)
 lab.player.global_position=global_position;engine.pitch_scale=lerpf(engine.pitch_scale,.85+absf(speed)*.025,1-exp(-dt*2))
