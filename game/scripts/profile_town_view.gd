extends SceneTree
func _initialize():call_deferred("run")
func run():
 var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 12:await process_frame
 lab.close_panel()
 if lab.staff_exit.apartment.inside:lab.staff_exit.apartment.interact("home_leave")
 lab.player.position=Vector3(10,-47.8,-903);lab.player.rotation.y=0;lab.player.camera.rotation.x=0
 var cam=Camera3D.new();lab.add_child(cam);cam.position=Vector3(12,-46.3,-900);cam.look_at(Vector3(0,-45,-770));cam.cull_mask=2|8;cam.current=true
 for i in 35:await process_frame
 var calls=0.0;var primitives=0.0;var elapsed=0.0
 for i in 45:
  var start=Time.get_ticks_usec();await process_frame;elapsed+=(Time.get_ticks_usec()-start)/1000.0
  calls+=Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME)
  primitives+=Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME)
 print("TOWN VIEW mean frame ms=",elapsed/45," draw calls=",calls/45," primitives=",primitives/45)
 quit()
