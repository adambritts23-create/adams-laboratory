extends SceneTree
var failures=0
func _initialize():call_deferred("run")
func check(ok,title):
 print("PASS " if ok else "FAIL ",title)
 if not ok:failures+=1
func run():
 var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 lab.staff_exit.apartment.interact("home_leave")
 for i in 15:await physics_frame
 check(lab.find_child("LexusShowroom",true,false)!=null,"Showroom restored")
 check(lab.economy.dealer.global_position.distance_to(Vector3(41,-48,-853))<.1,"Showroom beside Maxi")
 var sand=lab.find_child("PlaygroundSand",true,false)
 check(sand.global_position.distance_to(Vector3(59,-47.98,-853))<.1,"Playground retained")
 check(lab.find_child("SquareClocktower",true,false)==null,"Clocktower removed")
 var t=preload("res://scripts/shopping_orientation.gd").transform()
 var route=[Vector3(16,-48,-871),Vector3(16,-48,-872),Vector3(16,-44.45,-882),Vector3(16,-44.45,-883),Vector3(20,-44.45,-883),Vector3(20,-44.45,-884),Vector3(20,-40.9,-894),Vector3(20,-40.9,-900),Vector3(26,-40.9,-900)]
 var space=lab.get_world_3d().direct_space_state
 var clear=true
 for j in route.size()-1:
  for i in 31:
   var q=PhysicsShapeQueryParameters3D.new();q.shape=CapsuleShape3D.new();q.shape.radius=.2;q.shape.height=1.6;q.transform.origin=t*(route[j].lerp(route[j+1],i/30.0)+Vector3.UP*.96)
   var hits=space.intersect_shape(q)
   if not hits.is_empty():print("BLOCKED gym ",j," ",q.transform.origin," ",hits[0].collider.get_path());clear=false;break
 check(clear,"Continuous stair access from street to gym floor")
 for id in lab.economy.owned_cars:check(lab.economy.owned_vehicles.has(id),"Owned car retained: "+id)
 lab.paused=false
 var account=lab.accounting
 account.show_wallet();account.update_wallet(8.1)
 check(account.wallet.text=="Inventory · [I]","HUD collapses after inactivity")
 lab.economy.refresh(false);account.update_wallet(0)
 check(account.wallet.text=="Inventory · [I]","Passive stock updates do not reopen HUD")
 var event=InputEventKey.new();event.physical_keycode=KEY_I;event.pressed=true;lab.economy.handle(event);account.update_wallet(0)
 check(account.wallet.text.contains("Platinum"),"Inventory key reopens HUD")
 account.update_wallet(9);lab.economy.refresh();account.update_wallet(0)
 check(account.wallet.text.contains("Platinum"),"Economy activity reopens HUD")
 var stray=false
 for label in lab.find_children("*","Label3D",true,false):
  if label.text.contains("FLOWER & SHRUB TRIAL") or label.text.contains("E TO BUY") or label.text.contains("SHOWROOM"):stray=true
 check(not stray,"Informational boards removed")
 if "--preview" in OS.get_cmdline_user_args():
  lab.game_ui.hide();var cam=Camera3D.new();lab.add_child(cam);cam.environment=lab.staff_exit.outdoor_environment;cam.make_current()
  for shot in [["retail",Vector3(-24,-23,-875),Vector3(47,-43,-872)],["square",Vector3(5,-28,-778),Vector3(29,-43,-750)],["gym",t*Vector3(25,-38.6,-900),t*Vector3(49,-40,-888)]]:
   cam.position=shot[1];cam.look_at(shot[2])
   for i in 8:await process_frame
   await RenderingServer.frame_post_draw
   root.get_texture().get_image().save_png("res://validation/"+shot[0]+"-updated.png")
 print("RETAIL FAILURES ",failures)
 lab.free();await process_frame;quit(failures)
