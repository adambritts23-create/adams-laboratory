extends SceneTree
func _initialize():call_deferred("run")
func run():
 var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 lab.staff_exit.apartment.interact("home_leave");lab.game_ui.hide()
 var cam=Camera3D.new();lab.add_child(cam);cam.position=Vector3(-42,-45,-977);cam.look_at(cam.position+Vector3(-.45,.28,-.75));cam.environment=lab.staff_exit.outdoor_environment;cam.make_current()
 for period in ["Dusk","Night","Day"]:
  lab.staff_exit.grounds.set_time_of_day(period)
  for i in 5:await process_frame
  await RenderingServer.frame_post_draw
  root.get_texture().get_image().save_png("res://validation/sky-"+period.to_lower()+".png")
 lab.free();await process_frame;quit()
