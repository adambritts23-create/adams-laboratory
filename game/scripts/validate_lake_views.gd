extends SceneTree
var lab
var route
var failures:=0
func _initialize():call_deferred("run")
func shot(id:String,p:Vector3,target:Vector3):
 var camera=Camera3D.new();lab.add_child(camera);camera.position=p;camera.look_at(target);camera.current=true;camera.fov=65;camera.environment=route.outdoor_environment
 for i in 40:await process_frame
 await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("res://validation/lake-"+id+".png")
 if id=="pier":route.grounds.get_node("DownhillRoadAndTown/TownLakeAndMeadow").reflection_view.get_texture().get_image().save_png("res://validation/lake-reflection.png")
 camera.queue_free()
func run():
 root.size=Vector2i(1440,900);lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 for i in 10:await process_frame
 lab.close_panel();lab.game_ui.hide();route=lab.staff_exit
 await shot("pier",Vector3(75,-46.35,-810),Vector3(145,-48.6,-825))
 await shot("town-bank",Vector3(63,-45.3,-767),Vector3(135,-49,-818))
 await shot("reflected-town",Vector3(179,-46.7,-803),Vector3(52,-47.5,-810))
 await shot("aerial",Vector3(40,7,-645),Vector3(88,-46,-810))
 await shot("town",Vector3(4,-46.3,-715),Vector3(29,-44,-771))
 await shot("forest",Vector3(20,0,-236),Vector3(0,-38,-570))
 print("LAKE VIEWS COMPLETE");quit()
