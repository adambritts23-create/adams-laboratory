extends SceneTree
func _initialize():call_deferred("run")
func run():
 root.size=Vector2i(1440,900)
 var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 30:await process_frame
 lab.close_panel();lab.paused=true;lab.player.enabled=false;lab.player.set_physics_process(false);lab.game_ui.hide()
 var actor=lab.room.actors[0]
 var cam=Camera3D.new();root.add_child(cam);cam.current=true;cam.fov=45
 var target=actor.global_position+Vector3(0,1.77,0)
 for pair in [["front",Vector3(0,0,1)],["quarter",Vector3(.7,0,.7)],["profile",Vector3(1,0,.02)],["conversation",Vector3(0,0,2)]]:
  cam.position=target+pair[1]*.85;cam.look_at(target)
  for i in 10:await process_frame
  await RenderingServer.frame_post_draw
  root.get_texture().get_image().save_png("res://validation/adam-likeness/lab-"+pair[0]+".png")
 print("PASS Adam imported in Lab B; front, quarter, profile and conversation captured")
 lab.queue_free();await process_frame;quit()
