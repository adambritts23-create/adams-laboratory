extends SceneTree
func _initialize():call_deferred("run")
func run():
 var harness=load("res://scripts/validate_living_town.gd")
 var world=harness.TestWorld.new();root.add_child(world);world.add_child(world.staff_exit);world.add_child(world.player);world.player.add_child(world.player.camera)
 world.staff_exit.lab=world;world.staff_exit.add_child(world.staff_exit.grounds)
 world.player.add_child(world.player.shape_node)
 for node in [world.expansion,world.glassware,world.polish,world.game_ui]:world.add_child(node)
 world.expansion.add_child(world.expansion.output_solid);world.expansion.add_child(world.expansion.output_liquid)
 var economy=load("res://scripts/world_economy.gd").new();world.add_child(economy);economy.set_process(false);economy.lab=world;economy.init_materials();world.economy=economy
 var land=load("res://scripts/valley_landscape.gd").new();world.add_child(land);land.init_materials();land.asphalt=land.material(Color(.15,.15,.15));land.route=world.staff_exit
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 for x in range(-132,-89):
  for station in range(925,967):
   for q in [Vector2(x,station),Vector2(x+1,station+1),Vector2(x+1,station),Vector2(x,station),Vector2(x,station+1),Vector2(x+1,station+1)]:st.add_vertex(Vector3(q.x,land.terrain_height(q.x,q.y),-q.y))
 st.generate_normals();var ground=MeshInstance3D.new();land.add_child(ground);ground.mesh=st.commit();ground.material_override=land.material(Color(.22,.28,.08))
 var trial=load("res://scripts/botanical_trial.gd").new();land.add_child(trial);trial.build(land)
 var sun=DirectionalLight3D.new();world.add_child(sun);sun.rotation_degrees=Vector3(-42,-20,0);sun.light_energy=1.4;sun.light_cull_mask=3
 var env=WorldEnvironment.new();world.add_child(env);env.environment=Environment.new();env.environment.background_mode=Environment.BG_COLOR;env.environment.background_color=Color(.48,.66,.85);env.environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;env.environment.ambient_light_color=Color(.85,.9,1);env.environment.ambient_light_energy=.6
 var camera=world.player.camera;camera.position=Vector3(-97,-46.8,-940);camera.look_at(Vector3(-102,-47.35,-937));camera.make_current();camera.fov=70
 for i in 8:await process_frame
 await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("res://validation/botanical-preview.png")
 world.free()
 await process_frame
 quit()
