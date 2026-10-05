extends SceneTree
var failures=0
func _initialize():call_deferred("run")
func check(ok:bool,label:String):
 print("PASS " if ok else "FAIL ",label)
 if not ok:failures+=1
func run():
 var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await physics_frame
 lab.close_panel()
 var shops=lab.staff_exit.grounds.get_node("DownhillRoadAndTown/VillageShops")
 var residents=0
 for n in shops.get_children():
  if n.get_script()==load("res://scripts/town_resident.gd"):residents+=1
 check(residents==10,"Four outdoor residents and six shop occupants")
 var lights=lab.room.find_children("StationTaskLight*","SpotLight3D",true,false)
 check(lights.size()==6,"All six benches have fixed task spotlights")
 var car=lab.staff_exit.vehicle;car.enter();car.body.position=Vector3(0,-47.9,-855);car.body.rotation=Vector3(0,PI/2,0);car.global_transform=car.body.global_transform;car.speed=0
 Input.action_press("forward")
 for i in 300:await physics_frame
 Input.action_release("forward")
 print("Lake access position ",car.position)
 check(car.position.x>45 and car.position.y> -49,"Lake approach remains driveable past new shops")
 print("SHOPS CHECK FAILURES: ",failures);quit(1 if failures else 0)
