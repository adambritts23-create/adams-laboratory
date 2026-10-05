extends SceneTree
func _initialize():call_deferred("run")
func run():
 var lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 6:await process_frame
 lab.close_panel();var car=lab.staff_exit.vehicle
 car.body.position=Vector3(563.482,.1,-2458.165);car.body.rotation.y=atan2(538.447-563.482,-2270.034+2458.165);car.global_transform=car.body.global_transform;car.enter()
 Input.action_press("forward")
 for frame in 900:
  await physics_frame
  if frame%100==0:
   print("POSITION ",car.body.position," SPEED ",car.speed)
   for i in car.body.get_slide_collision_count():
    var h=car.body.get_slide_collision(i);print("HIT ",h.get_collider().get_path()," at ",h.get_position()," normal ",h.get_normal())
 Input.action_release("forward");quit()
