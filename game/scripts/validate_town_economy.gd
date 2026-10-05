extends SceneTree
var lab
var failures=0
func _initialize():call_deferred("run")
func check(ok,title):
 print("PASS " if ok else "FAIL ",title)
 if not ok:failures+=1
func run():
 var saved=FileAccess.get_file_as_string("user://town-economy-v2.json") if FileAccess.file_exists("user://town-economy-v2.json") else ""
 if FileAccess.file_exists("user://town-economy-v2.json"):DirAccess.remove_absolute("user://town-economy-v2.json")
 lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 12:await physics_frame
 lab.close_panel();var e=lab.economy;var r=lab.staff_exit;var a=r.apartment
 check(not a.inside and lab.player.position.z>0,"Starts in laboratory")
 check(r.grounds.get_parent()==null,"Outdoor scene detached while in lab")
 for i in 4:e.interact("platinum_"+str(i))
 check(e.platinum.size()==3 and not e.collected.has("platinum_3"),"Three-crucible capacity enforced")
 e.selected=5;e.interact("pawn_sell");check(e.cash==6000 and e.platinum.size()==2,"Pawn sale pays dollars once")
 e.interact("green_chunk");e.interact("pawn_sell");check(e.green_owned and e.cash==6000,"Pawn shop rejects green material")
 e.interact("gate_buyer");check(e.cash==206000 and e.green_sold,"Contact pays USD 200000")
 e.interact("gate_buyer");check(e.cash==206000,"Contact payout cannot repeat")
 e.interact("buy_piano");e.interact("buy_hall");check(e.cash==6000 and e.purchases.size()==2,"Two purchases cost USD 100000 each")
 e.interact("buy_piano");check(e.cash==6000,"Repeat purchase does not charge again")
 a.interact("home_enter")
 for i in 10:await physics_frame
 check(r.grounds.get_parent()!=null,"Exterior reattaches for apartment windows")
 for p in [Vector3(5.15,.9,3.5),Vector3(5.2,.9,4.1),Vector3(5.95,.9,4.5),Vector3(5.95,.9,5),Vector3(-2.35,.9,-1.6)]:
  var query=PhysicsShapeQueryParameters3D.new();query.shape=CapsuleShape3D.new();query.shape.radius=.28;query.shape.height=1.75;query.transform.origin=a.to_global(p);query.collision_mask=1
  check(lab.get_world_3d().direct_space_state.intersect_shape(query).is_empty(),"Purchased doorway is walkable "+str(p))
 a.interact("home_leave");lab.player.position=Vector3(0,.1,-29);r.dressed=true;r.doffed=true;r.outside=true
 for i in 5:await physics_frame
 r.interact("exit_hang");check(r.doffed,"Cannot put coveralls on over normal clothes")
 r.interact("exit_clothes");r.interact("exit_hang");check(not r.doffed and not r.dressed,"Incoming clothes routine completes")
 lab.player.position=Vector3(5.3,.05,-69)
 for i in 10:await physics_frame
 var guard=e.gate_people;guard.take_hit();check(guard.hostile,"Sentry reacts only after being shot")
 for i in 160:await physics_frame
 check(guard.player_health<100,"Sentry returns fire with line of sight")
 var data=JSON.parse_string(FileAccess.get_file_as_string(e.SAVE));check(data.purchases.size()==2 and data.green_sold,"Economy and purchases saved")
 if saved.is_empty():DirAccess.remove_absolute(e.SAVE)
 else:var f=FileAccess.open(e.SAVE,FileAccess.WRITE);f.store_string(saved)
 print("ECONOMY FAILURES ",failures);quit(1 if failures else 0)
