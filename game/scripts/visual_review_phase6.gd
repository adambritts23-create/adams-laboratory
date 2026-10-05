extends SceneTree
var lab: Node3D
func _initialize() -> void: call_deferred("run")
func frames(n: int) -> void:
 for i in n: await process_frame
func shot(id: String,eye: Vector3,target: Vector3) -> void:
 lab.player.camera.global_position=eye
 lab.player.camera.look_at(target)
 await frames(8)
 await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("res://validation/phase6/"+id+".png")
func run() -> void:
 root.size=Vector2i(1280,720)
 Engine.max_fps=60
 lab=load("res://scenes/lab_b.tscn").instantiate();root.add_child(lab);current_scene=lab
 await frames(30)
 lab.close_panel();lab.paused=true;lab.player.enabled=false;lab.player.set_physics_process(false);lab.game_ui.hide()
 if "--clay" in OS.get_cmdline_user_args():
  for actor in lab.room.actors:
   for mesh in actor.model.find_children("*","MeshInstance3D",true,false):
    for surface in mesh.mesh.get_surface_count():
     var mat: Material=mesh.get_surface_override_material(surface)
     if mat is ShaderMaterial and mat.shader.resource_path.ends_with("portrait_skin.gdshader"):mat.set_shader_parameter("diagnostic",true)
 for id in ["adam","axel"]:
  var origin: Vector3=lab.room.npc_positions[id]
  var h: float=1.747 if id=="adam" else 1.626
  lab.player.camera.fov=48
  for entry in [["front",0.0],["three-quarter",PI/4],["side",PI/2],["rear-quarter",PI*.75],["back",PI]]:
   await shot(id+"-close-"+entry[0],origin+Vector3(sin(entry[1])*.75,h,cos(entry[1])*.75),origin+Vector3(0,h,0))
  lab.player.camera.fov=65
  await shot(id+"-full-body",origin+Vector3(0,1.1,2.4),origin+Vector3(0,1.0,0))
  await shot(id+"-conversation",origin+Vector3(0,1.62,1.5),origin+Vector3(0,h,0))
 lab.player.camera.fov=75
 await shot("both-in-lab",Vector3(0,1.62,4.2),Vector3(0,1.4,0))
 lab.queue_free();await frames(10);quit()
