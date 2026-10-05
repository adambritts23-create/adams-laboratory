extends "res://scripts/lab_props.gd"
var is250:=false
var plate_text:="TOL 981"
var interaction_id:="exit_car"
var lab
var route
var body: CharacterBody3D
var suspension_wheels:Array=[]
var camera: Camera3D
var driving:=false
var chase:=false
var speed:=0.0
var steering:=0.0
var rpm:=850.0
var gear:=0
var shift_cooldown:=0.0
var engine: AudioStreamPlayer
var loaded: AudioStreamPlayer
var radio: AudioStreamPlayer
var radio_channel=1
var wheel: Node3D
var cluster
var road_wheels:Array=[]
var look_yaw:=0.0
var look_pitch:=-.12
func build(world,r):
 lab=world;route=r;init_materials();name="DriveableIS250" if is250 else "DriveableIS200";position=Vector3(-4.5 if is250 else 4.5,.02,-43);rotation.y=PI
 # VehicleBody/VehicleWheel setup adapted from malik mohamed's MIT Car Physics Template.
 body=preload("res://scripts/stable_vehicle_body.gd").new();lab.add_child(body);body.top_level=true;body.global_transform=global_transform;body.last_safe=global_transform;body.initialized=true;body.collision_layer=1;body.collision_mask=1
 body.mass=1570 if is250 else 1360
 body.freeze=true
 for side in [-1,1]:
  for z in ([1.36,-1.37] if is250 else [1.30,-1.32]):
   var tyre=Node3D.new();tyre.position=Vector3(side*(.83 if is250 else .81),.35,z)
   body.add_child(tyre);suspension_wheels.append(tyre)
 body.set_meta("interaction",interaction_id);body.set_meta("title",("Enter red 2008 Lexus IS250 / " if is250 else "Enter gold Lexus IS200 / ")+plate_text)
 # Tall non-solid interaction volume remains reachable at standing eye level after parking.
 var access=Area3D.new();body.add_child(access);access.name="VehicleDoorAccess";access.collision_layer=4;access.collision_mask=0
 access.set_meta("interaction",interaction_id);access.set_meta("title","Enter Lexus · "+plate_text)
 var door_shape=CollisionShape3D.new();access.add_child(door_shape);door_shape.shape=BoxShape3D.new();door_shape.shape.size=Vector3(2.05,2.05,4.65);door_shape.position.y=1.05
 # A shallow bevel under the body lets the wheels climb small kerbs instead of
 # treating every road/grass transition as a vertical wall.
 var cs=CollisionShape3D.new();var shape=ConvexPolygonShape3D.new()
 var size_value=Vector3(1.82,1.35,4.57) if is250 else Vector3(1.78,1.35,4.4)
 var hull=PackedVector3Array()
 for ring in [Vector2(-.675,.36),Vector2(-.475,0),Vector2(.675,0)]:
  for x in [-1,1]:
   for z in [-1,1]:hull.append(Vector3(x*(size_value.x*.5-ring.y),ring.x,z*(size_value.z*.5-ring.y)))
 shape.points=hull;cs.shape=shape;cs.position.y=.74;body.add_child(cs)
 var model=load("res://art/environment/exterior/is250.glb" if is250 else "res://art/environment/exterior/is200.glb").instantiate();add_child(model)
 for n in model.find_children("*","MeshInstance3D",true,false):
  if "instrument" in str(n.name).to_lower():n.hide()
  for k in n.mesh.get_surface_count():
   var m=n.mesh.surface_get_material(k)
   if m and "Window glass" in m.resource_name:
    m=m.duplicate();m.transparency=BaseMaterial3D.TRANSPARENCY_ALPHA;m.albedo_color=Color(.57,.67,.70,.30);m.cull_mode=BaseMaterial3D.CULL_DISABLED;n.set_surface_override_material(k,m)
 for side in [-1,1]:
  for z in ([1.36,-1.37] if is250 else [1.30,-1.32]):
   var pivot=Node3D.new();model.add_child(pivot);pivot.position=Vector3(side*(.83 if is250 else .81),.35,z)
   var spin=Node3D.new();pivot.add_child(spin)
   for part in model.get_children():
    if part is MeshInstance3D and (str(part.name).begins_with("Tyre") or str(part.name).begins_with("Alloy") or str(part.name).begins_with("Recessed") or str(part.name).begins_with("Five") or str(part.name).begins_with("Hub")) and absf(part.position.x-side*.81)<.20 and absf(part.position.z-z)<.35:
     part.reparent(spin)
   road_wheels.append([pivot,spin,z>0])
 for s in [-1,1]:
  var p=Vector3(0,(.535 if s==1 else .68) if is250 else (.505 if s==1 else .63),s*(2.325 if is250 else 2.252))
  box(p,Vector3(.52,.115,.015),paper)
  label_at(plate_text,p+Vector3(0,0,s*.012),42,Color(.02,.025,.03),.0018).rotation.y=0 if s==1 else PI
 if not is250:label_at("L",Vector3(0,.67,2.24),34,Color(.8,.83,.84),.0015)
 label_at("LEXUS",Vector3(.50,.69,-2.305) if is250 else Vector3(.50,1.00,-2.23),22,Color(.8,.83,.84),.0012).rotation.y=PI
 label_at("IS 250" if is250 else "IS 200",Vector3(-.50,.69,-2.305) if is250 else Vector3(-.50,1.00,-2.23),22,Color(.8,.83,.84),.0012).rotation.y=PI
 label_at("L",Vector3(0,.94,-2.285) if is250 else Vector3(0,1.015,-2.23),28,Color(.8,.83,.84),.0014).rotation.y=PI
 # Three-spoke wheel, chronograph cluster, twin vents and three climate dials.
 wheel=Node3D.new();add_child(wheel);wheel.position=Vector3(.38,.89,.08);wheel.scale=Vector3.ONE*.78
 var torus=TorusMesh.new();torus.inner_radius=.161;torus.outer_radius=.209;torus.rings=48;torus.ring_segments=12
 var rim=mesh_node(torus,Vector3.ZERO,Vector3.ONE,rubber,wheel);rim.rotation.x=PI/2
 for a in [PI,1.25,-1.25]:
  var spoke=tube(Vector3.ZERO,Vector3(sin(a)*.16,cos(a)*.16,0),.022,dark);spoke.reparent(wheel,false)
 var hub=box(Vector3.ZERO,Vector3(.20,.13,.045),rubber);hub.reparent(wheel,false)
 var badge=label_at("L",Vector3(0,0,-.03),36,Color(.65,.68,.69),.001);badge.reparent(wheel,false);badge.rotation.y=PI
 var vp=SubViewport.new();vp.name="DashboardViewport";vp.size=Vector2i(1000,480);vp.transparent_bg=false;vp.render_target_update_mode=SubViewport.UPDATE_ONCE;add_child(vp)
 cluster=load("res://scripts/is250_instruments.gd" if is250 else "res://scripts/is200_instruments.gd").new();vp.add_child(cluster);cluster.size=Vector2(1000,480)
 box(Vector3(.38,.93,.24),Vector3(.48,.235,.065),rubber)
 var qm=QuadMesh.new();qm.size=Vector2(.44,.2112)
 var screen=MeshInstance3D.new();screen.mesh=qm;screen.position=Vector3(.38,.93,.20);screen.rotation.y=PI
 var sm=StandardMaterial3D.new();sm.shading_mode=BaseMaterial3D.SHADING_MODE_UNSHADED;sm.albedo_texture=vp.get_texture();screen.material_override=sm;add_child(screen)
 if is250:build_is250_console()
 else:
  for x in [-.095,.095]:
   box(Vector3(x,1.01,.50),Vector3(.17,.10,.06),rubber)
   for y in [.98,1.005,1.03]:box(Vector3(x,y,.463),Vector3(.15,.008,.008),metal)
  for x in [-.105,0,.105]:
   var knob=cylinder(Vector3(x,.86,.43),.035,.025,dark);knob.rotation.x=PI/2
   label_at("AUTO" if x==0 else "20",Vector3(x,.86,.405),14,Color(.8,.85,.76),.001).rotation.y=PI
  box(Vector3(0,.745,.41),Vector3(.29,.10,.025),dark)
  label_at("LEXUS AUDIO",Vector3(0,.755,.391),16,Color(.40,.72,.60),.001).rotation.y=PI
  tube(Vector3(0,.58,-.06),Vector3(0,.77,-.06),.012,metal);ellipsoid(Vector3(0,.78,-.06),Vector3(.043,.041,.037),rubber)
 camera=Camera3D.new();add_child(camera);camera.position=Vector3(.38,1.22,-.22);camera.rotation=Vector3(-.12,PI,0);camera.fov=76;camera.near=.025
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=2
 engine=loop_audio("steady_hum",-28);loaded=loop_audio("steady_hum",-80);radio=AudioStreamPlayer.new();add_child(radio);radio.stream=load("res://audio/dialogue/news.wav");radio.volume_db=-7
func loop_audio(file:String,db:float)->AudioStreamPlayer:
 var a=AudioStreamPlayer.new();a.stream=load("res://audio/exterior/"+file+".wav");a.stream.loop_mode=AudioStreamWAV.LOOP_FORWARD;a.stream.loop_end=int(a.stream.mix_rate*a.stream.get_length());a.volume_db=db;add_child(a);return a
func enter():
 if lab.glassware.holding():lab.say("Put the beaker down before getting in.");return
 if driving:return
 get_node("DashboardViewport").render_target_update_mode=SubViewport.UPDATE_ALWAYS
 set_physics_process(true);body.brake=0;body.engine_force=0;body.steering=0;steering=0
 body.add_collision_exception_with(lab.player);lab.player.add_collision_exception_with(body)
 route.vehicle=self;driving=true;body.freeze=false;body.sleeping=false;lab.player.enabled=false;lab.player.set_physics_process(false);lab.player.shape_node.disabled=true;camera.environment=route.outdoor_environment;camera.current=true;engine.play();start_radio();lab.say("Engine started · E exits when stopped",4)
func start_radio():
 if radio_channel>0:radio.play()
func exit_car():
 if not body.valid_state():body.recover();speed=0
 if absf(speed)> .4:lab.say("Stop the car before getting out.");return
 # Only leave on a clear side, using the same capsule dimensions as the player.
 var target=Vector3.ZERO;var found=false
 for side in [-1,1]:
  var p=body.global_transform*Vector3(side*1.6,.1,0)
  var q=PhysicsShapeQueryParameters3D.new();q.shape=lab.player.shape_node.shape;q.transform=Transform3D(Basis.IDENTITY,p+Vector3(0,.875,0));q.exclude=[body.get_rid(),lab.player.get_rid()]
  if get_world_3d().direct_space_state.intersect_shape(q).is_empty():target=p;found=true;break
 if not found:lab.say("Both doors are obstructed. Move to a clear space.");return
 get_node("DashboardViewport").render_target_update_mode=SubViewport.UPDATE_ONCE
 driving=false;body.engine_force=0;body.brake=60;body.linear_velocity=Vector3.ZERO;body.angular_velocity=Vector3.ZERO;body.freeze=true;engine.stop();loaded.stop();radio.stop();lab.player.position=target;lab.player.reset_motion();lab.player.shape_node.disabled=false;lab.player.set_physics_process(true);lab.player.enabled=true;lab.player.camera.current=true;body.remove_collision_exception_with(lab.player);lab.player.remove_collision_exception_with(body);lab.say("Parked. "+plate_text+".")
func handle(event:InputEvent)->bool:
 if not driving:return false
 if event.is_action_pressed("ui_cancel"):return false
 if lab.paused:return true
 if event is InputEventMouseMotion:
  look_yaw=clampf(look_yaw-event.relative.x*.002,-1.2,1.2);look_pitch=clampf(look_pitch-event.relative.y*.002,-.5,.45)
 if event is InputEventKey and event.pressed and not event.echo:
  if event.physical_keycode in [KEY_0,KEY_1,KEY_2,KEY_3]:
   radio_channel=int(event.physical_keycode-KEY_0);radio.stop()
   if radio_channel>0:
    radio.stream=load("res://audio/dialogue/news.wav");radio.play()
  if event.keycode==KEY_V:chase=not chase;look_yaw=0;look_pitch=0
  if event.keycode==KEY_E:
   if absf(position.z+63)<9 and absf(position.x)<8:route.grounds.toggle_gate()
   else:exit_car()
 return true
func _physics_process(delta):
 if body==null:return
 if not body.valid_state():
  body.recover();speed=0;steering=0
  return
 if lab.paused:
  engine.stream_paused=true;loaded.stream_paused=true;radio.stream_paused=true;body.freeze=true;return
 engine.stream_paused=lab.sound.muted;loaded.stream_paused=lab.sound.muted;radio.stream_paused=lab.sound.muted
 if not driving:return
 body.freeze=false
 lab.player.enabled=false
 var throttle=Input.get_axis("back","forward");var steer=Input.get_axis("right","left")
 var braking=Input.is_key_pressed(KEY_SPACE)
 speed=body.linear_velocity.dot(body.global_basis.z)
 # Frame-rate independent steering, reduced lock at speed, and braking before reverse.
 var lock_angle=lerpf(.48,.16,clampf(absf(speed)/30,0,1))
 steering=move_toward(steering,steer*lock_angle,delta*1.15)
 body.steering=steering;body.brake=0;body.engine_force=0
 if braking or (throttle*speed<-.4):body.brake=45 if braking else 28
 elif throttle!=0:
  body.sleeping=false
  var limit=32.0 if throttle>0 else 6.0
  var force=3600.0 if is250 else 3000.0
  if absf(speed)<limit:body.engine_force=throttle*force*(1.0-.55*clampf(absf(speed)/32,0,1))
 elif absf(speed)<.3:body.brake=12
 # Rolling resistance and aerodynamic drag oppose actual motion, including downhill coasting.
 if body.linear_velocity.length()>.1:body.apply_central_force(-body.linear_velocity.normalized()*(100+body.linear_velocity.length_squared()*.42))
 global_transform=body.global_transform
 var up=body.surface_up
 var forward=body.global_basis.z.slide(up).normalized()
 global_basis=Basis(up.cross(forward).normalized(),up,forward)
 camera.environment=route.garage.environment if route.garage!=null and route.garage.contains(global_position) else route.outdoor_environment
 lab.player.global_position=global_position
 wheel.rotation.z=-steering*2.5
 for i in road_wheels.size():
  var item=road_wheels[i];var tyre=suspension_wheels[i]
  var wheel_y=to_local(tyre.global_position).y
  if is_finite(wheel_y):item[0].position.y=clampf(wheel_y,.22,.46)
  item[0].rotation.y=steering if item[2] else 0.0;item[1].rotate_x(speed*delta/.337)
 update_engine(delta,throttle)
 loaded.volume_db=-80
 cluster.speed=absf(speed)*3.6;cluster.rpm=rpm;cluster.queue_redraw()
 if chase:
  camera.position=Vector3(0,2.8,-6);camera.rotation=Vector3(-.18,PI+look_yaw,0)
 else:
  camera.position=Vector3(.38,1.22,-.22);camera.rotation=Vector3(look_pitch,PI+look_yaw,0)
 lab.hud.text=driving_hint()

# A steady periodic source, with pitch driven only by smoothed road speed.
func update_engine(delta:float,_throttle:float):
 var target=850.0+absf(speed)*65.0
 rpm=move_toward(rpm,clampf(target,850,3100),delta*380.0)
 engine.pitch_scale=.85+(rpm-850)/2400.0
 engine.volume_db=lerpf(engine.volume_db,-28.0+minf(absf(speed)/8,4),1.0-exp(-delta*2))

func driving_hint()->String:
 return ("LEXUS IS250 · " if is250 else "LEXUS IS200 · ")+plate_text+"\nW/S drive · A/D steer · Space brake · V view · E gate / exit"
func build_is250_console():
 # XE20 silver vertical centre stack and automatic selector, kept below the windscreen.
 var first_console_node=get_child_count()
 var silver=material(Color(.43,.46,.48),.72,.28)
 box(Vector3(0,.84,.445),Vector3(.35,.35,.055),silver)
 box(Vector3(0,.84,.41),Vector3(.30,.18,.016),rubber)
 box(Vector3(0,.845,.399),Vector3(.205,.13,.01),material(Color(.025,.055,.07),.1,.35,.25))
 label_at("LEXUS\nAUDIO",Vector3(0,.85,.39),17,Color(.73,.85,.91),.001).rotation.y=PI
 for x in [-.09,.09]:
  box(Vector3(x,1.005,.46),Vector3(.17,.09,.055),silver)
  box(Vector3(x,1.005,.429),Vector3(.147,.068,.008),rubber)
  for y in [.985,1.005,1.025]:box(Vector3(x,y,.421),Vector3(.14,.006,.008),silver)
 for x in [-.137,.137]:
  for y in [.78,.82,.86,.90]:box(Vector3(x,y,.396),Vector3(.036,.016,.012),dark)
 for x in [-.09,.09]:
  var knob=cylinder(Vector3(x,.715,.398),.025,.02,silver);knob.rotation.x=PI/2
 label_at("22.0   AUTO   22.0",Vector3(0,.73,.383),13,Color(.71,.83,.84),.001).rotation.y=PI
 var wood=material(Color(.15,.055,.027),.12,.29)
 box(Vector3(0,.637,-.01),Vector3(.27,.015,.40),wood)
 for i in 5:
  box(Vector3(.025 if i%2 else -.015,.648,.12-i*.052),Vector3(.065,.006,.026),rubber)
 tube(Vector3(-.015,.65,.12),Vector3(-.015,.78,.12),.011,silver)
 ellipsoid(Vector3(-.015,.79,.12),Vector3(.035,.033,.048),rubber)
 for i in 4:
  var gear_label=label_at(["P","R","N","D"][i],Vector3(-.09,.655,.12-i*.052),14,Color.WHITE,.001)
  gear_label.rotation=Vector3(-PI/2,PI,0)
 for n in get_children().slice(first_console_node):
  if n is Node3D and n.position.y>.67:n.position.z-=.17
 # Multi-function steering wheel buttons.
 for x in [-.07,.07]:
  var button=box(Vector3(x,0,-.028),Vector3(.05,.038,.012),silver);button.reparent(wheel,false)

