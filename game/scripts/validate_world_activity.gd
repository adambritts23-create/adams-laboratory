extends "res://scripts/validate_lake_views.gd"
func require(ok,title):
 print("PASS " if ok else "FAIL ",title)
 if not ok:failures+=1
func run():
 root.size=Vector2i(1280,720);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await process_frame
 lab.close_panel();route=lab.staff_exit;var a=route.apartment
 require(not lab.room.visible,"Remote laboratory hidden in apartment")
 require(route.grounds.visible,"Outdoor window scenery remains available")
 a.interact("home_leave");lab.player.position=Vector3(0,.05,8)
 for i in 5:await process_frame
 require(lab.room.visible and not route.grounds.visible,"Workplace separately activates and exterior sleeps")
 await shot("performance-lab",Vector3(0,1.65,8),Vector3(0,1.3,-5))
 lab.player.position=Vector3(0,.05,-25)
 for i in 5:await process_frame
 require(lab.room.visible and route.grounds.visible,"Exit transition overlaps both areas")
 lab.player.position=Vector3(0,.05,-40)
 for i in 5:await process_frame
 require(not lab.room.visible and route.grounds.visible,"Outside suspends laboratory")
 var car=route.vehicles[0];car.enter()
 require(car.get_node("DashboardViewport").render_target_update_mode==SubViewport.UPDATE_ALWAYS,"Driven dashboard stays live")
 car.speed=10;car.exit_car()
 require(car.get_node("DashboardViewport").render_target_update_mode==SubViewport.UPDATE_ALWAYS,"Blocked exit does not freeze dashboard")
 car.speed=0;car.body.linear_velocity=Vector3.ZERO;car.exit_car()
 a.interact("home_enter")
 lab.player.rotation.y=PI/2
 for i in 8:await process_frame
 require(a.rear_view.render_target_update_mode==SubViewport.UPDATE_DISABLED,"Looking away stops window rendering")
 lab.player.rotation.y=-PI/2
 for i in 8:await process_frame
 require(a.rear_view.render_target_update_mode!=SubViewport.UPDATE_DISABLED,"Looking toward windows restores view")
 print("ACTIVITY FAILURES ",failures);quit(1 if failures else 0)
