extends "res://scripts/lab_props.gd"
var economy
var guard
var buyer
var health=100
var player_health=100
var hostile=false
var shot_wait=0.0
var age=0.0
var call_wait=0.0
func build(e):
 economy=e;init_materials();name="GateSentryAndContact"
 # Compact booth, clear of the eight-metre traffic opening.
 box(Vector3(7.5,.06,-60),Vector3(3,.12,3.5),concrete,true)
 box(Vector3(7.5,1.5,-61.7),Vector3(3,3,.12),painted,true)
 box(Vector3(9,1.5,-60),Vector3(.12,3,3.5),painted,true)
 box(Vector3(7.5,3,-60),Vector3(3.3,.15,3.8),dark,true)
 for x in [6,9]:box(Vector3(x,.5,-60),Vector3(.12,1,3.5),painted,true)
 box(Vector3(7.5,.8,-58.3),Vector3(3,1.6,.12),painted,true)
 box(Vector3(7.5,2,-58.3),Vector3(2.8,.8,.02),material(Color(.25,.40,.43,.25)))
 plaque("SECURITY / VAKT",Vector3(7.5,2.8,-58.18),Vector2(2.6,.32))
 guard=preload("res://scripts/town_resident.gd").new();add_child(guard);guard.position=Vector3(5.3,0,-64.8);guard.build(1)
 var rifle=economy.lab.expansion.rifle();rifle.reparent(guard,false);rifle.position=Vector3(.22,1.05,.25);rifle.rotation.y=PI;rifle.scale=Vector3.ONE*.8
 var hitbox=Area3D.new();guard.add_child(hitbox);hitbox.collision_layer=8;hitbox.collision_mask=0;hitbox.set_meta("sentry",self)
 var c=CollisionShape3D.new();c.shape=CapsuleShape3D.new();c.shape.radius=.4;c.shape.height=1.85;c.position.y=.95;hitbox.add_child(c)
 buyer=preload("res://scripts/town_resident.gd").new();add_child(buyer);buyer.position=Vector3(-4.8,-.09,-72);buyer.build(0)
 economy.target(buyer,"gate_buyer","Your contact · speak / present green chunk [4]",Vector3(0,1,0),Vector3(.85,1.9,.85))
 box(Vector3(-4.5,1.42,-71.95),Vector3(.075,.15,.02),dark)
 for mesh in find_children("*","GeometryInstance3D",true,false):mesh.layers=2
func take_hit():
 if health<=0:return
 health-=34;hostile=true
 if health<=0:
  hostile=false
  create_tween().tween_property(guard,"rotation:z",1.5,.65)
  economy.lab.say("The sentry is down.",3)
 else:economy.lab.say("SENTRY: Drop the weapon!",3)
func _process(dt):
 if economy==null or economy.lab.paused:return
 age+=dt;shot_wait-=dt;call_wait-=dt
 var player=economy.lab.player
 var distance=player.global_position.distance_to(buyer.global_position)
 if distance<20 and distance>3 and call_wait<=0 and not economy.green_sold:
  call_wait=14;economy.lab.say("CONTACT: Adam! Over here! I've got an offer for you!",5)
 if distance<30:
  buyer.rotation.y=atan2(player.position.x-buyer.position.x,player.position.z-buyer.position.z)
  var bone=buyer.rig.find_bone("lowerarm_r")
  if bone>=0:buyer.rig.set_bone_pose_rotation(bone,Quaternion(Vector3.RIGHT,-1.5)*Quaternion(Vector3.UP,sin(age*5)*.35))
 if health<=0:return
 var offset=player.global_position-guard.global_position;guard.rotation.y=atan2(offset.x,offset.z)
 if not hostile or offset.length()>35 or shot_wait>0:return
 shot_wait=1.2
 var origin=guard.global_position+Vector3(0,1.35,0);var aim=player.global_position+Vector3(0,1.1,0)
 var q=PhysicsRayQueryParameters3D.create(origin,aim);q.collision_mask=1
 var excludes=[]
 for body in guard.find_children("*","CollisionObject3D",true,false):excludes.append(body.get_rid())
 q.exclude=excludes
 var hit=get_world_3d().direct_space_state.intersect_ray(q)
 if not hit.is_empty() and hit.collider!=player:return
 if not economy.lab.sound.muted:economy.lab.expansion.shot.play()
 var tracer=tube(origin,aim,.008,material(Color(1,.75,.25),0,.5,2));tracer.layers=2;get_tree().create_timer(.08).timeout.connect(tracer.queue_free)
 player_health-=12;economy.lab.say("Sentry return fire · Health %d/100" % maxi(0,player_health),2)
 if player_health<=0:
  hostile=false;player_health=100;player.position=Vector3(0,.05,8);player.reset_motion();economy.lab.staff_exit.doffed=false;economy.lab.staff_exit.dressed=false;economy.lab.say("You were incapacitated. Back in Lab B.",5)
