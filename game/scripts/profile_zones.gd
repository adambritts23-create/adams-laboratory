extends SceneTree
var lab
func _initialize():call_deferred("run")
func sample(title,p,yaw):
 lab.player.global_position=p;lab.player.rotation.y=yaw;lab.player.camera.rotation.x=0;lab.player.enabled=false;lab.player.set_physics_process(false)
 for i in 20:await process_frame
 var started=Time.get_ticks_usec()
 for i in 90:await process_frame
 print("PROFILE ",title," ms/frame=",(Time.get_ticks_usec()-started)/90000.0," draws=",Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)," objects=",Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME))
func run():
 root.size=Vector2i(1280,720);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await process_frame
 lab.close_panel();var a=lab.staff_exit.apartment
 await sample("apartment_windows",a.global_position+Vector3(3,1,2),-PI/2)
 await sample("apartment_inward",a.global_position+Vector3(3,1,2),PI/2)
 a.interact("home_leave")
 await sample("town",Vector3(0,-47.8,-730),-PI/2)
 await sample("lab",Vector3(0,.05,8),0)
 quit()
