extends SceneTree
func _initialize():call_deferred("run")
func run():
 var scene=Node3D.new();root.add_child(scene)
 var land=load("res://scripts/valley_landscape.gd").new();scene.add_child(land);land.init_materials()
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 for x in range(-150,-70,2):
  for s in range(910,980,2):
   for v in [Vector2(x,s),Vector2(x+2,s+2),Vector2(x+2,s),Vector2(x,s),Vector2(x,s+2),Vector2(x+2,s+2)]:st.add_vertex(Vector3(v.x,land.terrain_height(v.x,v.y),-v.y))
 st.generate_normals();var ground=MeshInstance3D.new();scene.add_child(ground);ground.mesh=st.commit();ground.material_override=land.material(Color(.18,.25,.085),0,1);ground.layers=2
 var trial=load("res://scripts/woodland_trial.gd").new();scene.add_child(trial);trial.build(land)
 var sun=DirectionalLight3D.new();scene.add_child(sun);sun.rotation_degrees=Vector3(-32,-45,0);sun.light_color=Color(1,.86,.66);sun.light_energy=1.2;sun.light_cull_mask=2;sun.layers=2;sun.shadow_enabled=true
 var env=WorldEnvironment.new();scene.add_child(env);env.environment=Environment.new();env.environment.background_mode=Environment.BG_SKY;env.environment.sky=Sky.new();env.environment.sky.sky_material=ProceduralSkyMaterial.new();env.environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;env.environment.ambient_light_color=Color(.68,.76,.84);env.environment.ambient_light_energy=.6
 var camera=Camera3D.new();scene.add_child(camera);camera.cull_mask=3;camera.position=Vector3(-96,land.terrain_height(-96,944)+1.8,-943);camera.look_at(Vector3(-112,camera.position.y+2,-944));camera.make_current()
 for i in 8:await process_frame
 await RenderingServer.frame_post_draw
 root.get_texture().get_image().save_png("res://validation/woodland-trial.png")
 print("FOREST PREVIEW ",trial.tree_count," trees; ",trial.grass_count," grass clumps")
 quit()


