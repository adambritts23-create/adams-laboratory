extends "res://scripts/validate_lake_views.gd"
func check(ok,title):
 print("PASS " if ok else "FAIL ",title)
 if not ok:failures+=1
func run():
 root.size=Vector2i(1280,720);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await physics_frame
 lab.close_panel();route=lab.staff_exit;route.apartment.interact("home_leave");lab.player.position=Vector3(-1.4,.05,5)
 for i in 10:await physics_frame
 check(lab.zombies==null,"No conversion zombies")
 lab.room.facility.unlock();check(not lab.room.facility.unlocked,"Conversion remains locked")
 var q=PhysicsRayQueryParameters3D.create(Vector3(-4,1.5,9.5),Vector3(-8,1.5,9.5));q.collision_mask=1
 check(not lab.get_world_3d().direct_space_state.intersect_ray(q).is_empty(),"Conversion entrance physically blocked")
 var adam=lab.room.actors[0];var axel=lab.room.actors[1];var start=adam.position
 lab.companions.toggle_follow()
 for i in 180:await physics_frame
 check(adam.position.distance_to(start)>.4,"Adam follows toward player")
 for actor in [adam,axel]:
  var desired=lab.player.position-actor.position
  check(actor.global_basis.z.dot(desired.normalized())>.8,"Faces player: "+actor.identity)
 lab.companions.toggle_follow();lab.companions.hit(axel,false)
 for i in 40:await physics_frame
 check(absf(axel.model.rotation.x)<.01,"Hit flinch recovers")
 var target=axel.find_children("*","Area3D",false,false).filter(func(n):return n.has_meta("actor"))[0]
 for i in 3:lab.polish.hit_target({"collider":target,"position":axel.global_position})
 for i in 70:await physics_frame
 check(int(axel.get_meta("health"))==0 and axel.model.rotation.z>1.4,"Shot actor animates collapse")
 if DisplayServer.get_name()!="headless":
  var env=route.outdoor_environment;route.outdoor_environment=null
  await shot("sealed-conversion",Vector3(-3.5,1.7,9.3),Vector3(-6,1.8,9.5))
  route.outdoor_environment=env
  await shot("brighter-outdoors",Vector3(13,-45.9,-713),Vector3(-2,-47.5,-732))
 print("COMPANION FAILURES ",failures);quit(1 if failures else 0)

