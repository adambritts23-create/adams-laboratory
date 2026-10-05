extends SceneTree
var lab: Node3D
var camera: Camera3D
func _initialize() -> void:call_deferred("run")
func frames(n: int) -> void:
 for i in n:await process_frame
func shot(id: String,eye: Vector3,target: Vector3) -> void:
 camera.global_position=eye;camera.look_at(target)
 await frames(18);await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("res://validation/lower-environment/"+id+".png");print("CAPTURE "+id)
func run() -> void:
 root.size=Vector2i(1440,900)
 lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 camera=Camera3D.new();root.add_child(camera);camera.fov=78;camera.current=true
 await frames(60);lab.close_panel();lab.paused=true;lab.player.enabled=false;lab.player.set_physics_process(false);lab.game_ui.hide()
 camera.fov=95
 await shot("00-washing-and-interior-stairs-wide",Vector3(2.35,1.7,-6.5),Vector3(2.7,1.3,-9.2))
 camera.fov=78
 await shot("01-washing-area-secured-stair",Vector3(2.7,1.65,-9.1),Vector3(.6,.9,-7.2))
 lab.success_time=84;lab.advance_handoff();lab.room.facility.access.animate(3)
 lab.paused=false;lab.room.lower_lab._process(3);lab.paused=true
 await shot("02-washing-area-open-stair",Vector3(2.7,1.65,-9.1),Vector3(.6,.9,-7.2))
 await shot("03-stairs-looking-down",Vector3(.6,1.62,-8.6),Vector3(.6,-1.6,-3.3))
 await shot("04-second-flight-left-glazing",Vector3(4.8,-.65,-2.1),Vector3(4.8,-3,3.5))
 await shot("05-first-view-facing-forward",Vector3(4.8,-2.93,2.7),Vector3(4.8,-2.93,8))
 await shot("06-same-landing-look-left",Vector3(4.8,-2.93,2.7),Vector3(10.3,-2.8,3))
 await shot("07-lower-floor-wide",Vector3(3.6,-2.93,4.7),Vector3(-1.2,-2.7,-2.2))
 await shot("08-icp-through-glazing",Vector3(5.0,-2.93,5.5),Vector3(10.5,-2.7,0))
 await shot("09-gamma-weighing-gowning",Vector3(3.7,-2.93,2.8),Vector3(-.3,-2.7,8.5))
 await shot("10-preparation-and-fume-end",Vector3(2.3,-2.93,-4.7),Vector3(0,-2.8,-10.8))
 await shot("12-preparation-workstation",Vector3(2.0,-2.95,-5.4),Vector3(.2,-3.2,-6.8))
 await shot("13-weighing-detail",Vector3(-1.9,-2.95,3.4),Vector3(-3.9,-3.1,1.8))
 await shot("14-clean-preparation-through-glass",Vector3(5.9,-2.95,.3),Vector3(8,-3.1,0))
 var details=lab.room.lower_lab.get_node("LowerLabWorkingDetails")
 var stats=FileAccess.open("res://validation/lower-environment/dressing.json",FileAccess.WRITE)
 stats.store_string(JSON.stringify({"added_sample_vials":details.vial_count,"added_workstations":6,"layout":"unchanged"},"\t"));stats.close()
 # Architectural cutaway: actual engine scene, upper layer and roof hidden for review only.
 var fill:=DirectionalLight3D.new();root.add_child(fill);fill.rotation_degrees=Vector3(-85,0,0);fill.light_energy=.9;fill.light_cull_mask=2
 lab.find_children("*","WorldEnvironment",true,false)[0].environment.ambient_light_energy=2.5
 camera.cull_mask=2;camera.projection=Camera3D.PROJECTION_ORTHOGONAL;camera.size=22.5
 for node in lab.room.lower_lab.find_children("*","Node3D",true,false):
  if node.has_meta("review_roof"):node.hide()
 camera.global_position=Vector3(4,25,0);camera.look_at(Vector3(4,-4.55,0),Vector3(-1,0,0))
 await frames(18);await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("res://validation/lower-environment/11-plan-oriented-cutaway.png")
 print("CAPTURE 11-plan-oriented-cutaway")
 fill.queue_free();camera.queue_free();lab.queue_free();await frames(8);quit()

