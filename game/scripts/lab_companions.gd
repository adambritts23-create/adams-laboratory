extends Node
var lab
var following=false
var patrol_goal=-5.0
var wait_time=3.0
var walking={}
func build(world):
 lab=world
 for actor in lab.room.actors:
  for mesh in actor.find_children("*","GeometryInstance3D",true,false):mesh.layers=256
 var fill=DirectionalLight3D.new();lab.room.add_child(fill);fill.name="StableWorkerFill";fill.rotation_degrees=Vector3(-65,-25,0);fill.light_color=Color(1,.92,.79);fill.light_energy=.75;fill.shadow_enabled=false;fill.light_cull_mask=256
 var a=lab.room.actors[0]
 var target=Area3D.new();a.add_child(target);target.collision_layer=4;target.collision_mask=0;target.set_meta("interaction","adam");target.set_meta("title","Adam · follow / wait")
 var c=CollisionShape3D.new();var shape=CapsuleShape3D.new();shape.radius=.34;shape.height=1.8;c.shape=shape;c.position.y=.9;target.add_child(c)
func toggle_follow():
 if int(lab.room.actors[0].get_meta("health",100))<=0:return
 following=not following
 lab.say("ADAM: I'll follow you around the lab." if following else "ADAM: I'll stay here for now.",4)
 wait_time=10
func _physics_process(dt):
 if lab==null or lab.paused or not lab.room.visible:return
 var player=lab.player.global_position
 for actor in lab.room.actors:
  if int(actor.get_meta("health",100))<=0:continue
  var offset=player-actor.global_position
  if offset.length_squared()>.05:actor.rotation.y=lerp_angle(actor.rotation.y,atan2(offset.x,offset.z),minf(1,dt*5))
 var adam=lab.room.actors[0]
 if int(adam.get_meta("health",100))<=0:return
 var goal=Vector3(-1.4,0,patrol_goal)
 if following:
  if absf(player.x)>5.5 or player.z< -10 or player.z>11 or absf(player.y)>.6:return
  goal=player
  if adam.position.distance_to(goal)<1.7:pose_walk(adam,0);return
 else:
  wait_time-=dt
  if wait_time>0:pose_walk(adam,0);return
  if adam.position.distance_to(goal)<.15:patrol_goal=1.0 if patrol_goal<0 else -5.0;wait_time=5;return
 var motion=goal-adam.position;motion.y=0;motion=motion.limit_length(dt*.85)
 var query=PhysicsShapeQueryParameters3D.new();var shape=CapsuleShape3D.new();shape.radius=.32;shape.height=1.65;query.shape=shape;query.transform.origin=adam.global_position+Vector3.UP*.9;query.motion=motion;query.collision_mask=1
 var result=lab.get_world_3d().direct_space_state.cast_motion(query)
 if result.size()==2 and result[0]>.98:
  adam.position+=motion;pose_walk(adam,sin(adam.age*7)*.28)
 else:pose_walk(adam,0)
func pose_walk(actor,angle):
 for spec in [["thigh_l",angle],["thigh_r",-angle],["calf_l",maxf(0,-angle)],["calf_r",maxf(0,angle)]]:
  var bone=actor.rig.find_bone(spec[0])
  if bone>=0:actor.rig.set_bone_pose_rotation(bone,actor.base_rotations[spec[0]]*Quaternion(Vector3.RIGHT,spec[1]))
func hit(actor,fatal):
 if actor.has_meta("reaction_tween"):
  var previous=actor.get_meta("reaction_tween")
  if previous.is_valid():previous.kill()
 var tween=create_tween();actor.set_meta("reaction_tween",tween)
 if fatal:
  if actor.identity=="adam":following=false
  pose_walk(actor,.6)
  tween.tween_property(actor.model,"rotation:x",-.35,.18)
  tween.tween_property(actor.model,"rotation:z",1.5,.65).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN)
  tween.parallel().tween_property(actor.model,"position:y",.24,.65)
 else:
  tween.tween_property(actor.model,"rotation:x",-.15,.09)
  tween.tween_property(actor.model,"rotation:x",0,.32)
