extends "res://scripts/validate_lake_views.gd"
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 15:await process_frame
 lab.close_panel();lab.game_ui.hide();route=lab.staff_exit
 var car=route.vehicle;car.enter()
 for i in 120:await physics_frame
 print("RIDE HEIGHT ",car.body.position," wheel ",car.suspension_wheels[0].global_position)
 await shot("suspension-car",car.position+Vector3(4,1.3,5),car.position+Vector3(0,.65,0))
 car.speed=0;car.body.linear_velocity=Vector3.ZERO;car.exit_car()
 await shot("medieval-final",Vector3(29,-38.3,-1110),Vector3(31,-42,-1040))
 await shot("canal-final",Vector3(49,-44.2,-1010),Vector3(48,-44,-1080))
 var a=route.apartment;a.interact("home_enter")
 var cam=Camera3D.new();lab.add_child(cam);cam.current=true;cam.fov=70;cam.environment=a.interior_environment
 cam.global_position=a.global_position+Vector3(4.8,1.65,1.125);cam.look_at(a.global_position+Vector3(6.58,1.2,1.125))
 a.balcony.interact("balcony_toggle")
 for i in 60:await process_frame
 await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("res://validation/balcony-left-final.png")
 cam.global_position=a.global_position+Vector3(5,1.65,-.2);cam.look_at(a.global_position+Vector3(5.8,1,-2))
 for i in 30:await process_frame
 await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("res://validation/kitchen-final.png")
 print("FINAL VIEWS COMPLETE");quit()
