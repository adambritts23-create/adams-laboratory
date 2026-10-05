extends SceneTree
var lab
var failures:=0
func _initialize():call_deferred("run")
func check(ok:bool,label:String):
 print("PASS " if ok else "FAIL ",label)
 if not ok:failures+=1
func run():
 root.size=Vector2i(1440,900)
 lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 12:await process_frame
 lab.close_panel();lab.game_ui.hide()
 var route=lab.staff_exit
 var lake=route.grounds.get_node("DownhillRoadAndTown/TownLakeAndMeadow")
 check(lake.water.layers==8 and lake.reflection_camera.cull_mask==2,"Water excluded from its reflection capture")
 check(lake.LEVEL-lake.landscape.terrain_height(133,810)>4.5,"Lake has a sculpted basin")
 var ray=PhysicsRayQueryParameters3D.create(Vector3(75,-45,-810),Vector3(75,-52,-810))
 var hit=lab.get_world_3d().direct_space_state.intersect_ray(ray)
 check(not hit.is_empty() and absf(hit.position.y+47.94)<.15,"Pier has a walkable deck above water")
 var camera=Camera3D.new();lab.add_child(camera);camera.position=Vector3(75,-46.35,-810);camera.look_at(Vector3(145,-48.6,-825));camera.current=true;camera.fov=65;camera.environment=route.outdoor_environment
 for i in 40:await process_frame
 check(lake.water_material.get_shader_parameter("reflection_ready"),"Lakeside reflection activates")
 var start=Time.get_ticks_msec()
 for i in 120:await process_frame
 print("Lakeside average frame milliseconds: ",(Time.get_ticks_msec()-start)/120.0)
 camera.position=Vector3(0,2,9)
 for i in 10:await process_frame
 check(not lake.water_material.get_shader_parameter("reflection_ready"),"Reflection capture disabled at laboratory")
 print("LAKE VALIDATION FAILURES: ",failures)
 quit(1 if failures else 0)
