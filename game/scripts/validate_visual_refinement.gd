extends SceneTree
var lab
func _initialize():call_deferred("run")
func shot(id:String,p:Vector3,target:Vector3,outdoor:bool):
 var camera=Camera3D.new();lab.add_child(camera);camera.position=p;camera.look_at(target);camera.current=true;camera.fov=65
 if outdoor:camera.environment=lab.staff_exit.outdoor_environment
 for i in 12:await process_frame
 await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("res://validation/refine-"+id+".png");camera.queue_free()
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 10:await process_frame
 lab.close_panel();lab.game_ui.hide();lab.player.position=Vector3(0,.1,3)
 await shot("lab",Vector3(.3,1.7,7),Vector3(-3.8,1.5,5.8),false)
 await shot("stations",Vector3(-.5,1.7,4.7),Vector3(4,1.5,1.8),false)
 var car=lab.staff_exit.vehicle;var p=car.global_position
 await shot("car-front",p+Vector3(3,1.8,-4.5),p+Vector3(0,.72,0),true)
 await shot("car-rear",p+Vector3(-3,1.7,4.5),p+Vector3(0,.75,0),true)
 car.enter()
 for i in 12:await process_frame
 await RenderingServer.frame_post_draw;root.get_texture().get_image().save_png("res://validation/refine-cockpit.png")
 print("PASS Rendered lab, stations, car exterior and cockpit")
 print("PASS Wheel pivots ",car.road_wheels.size())
 quit()
