extends SceneTree
class Studio extends "res://scripts/room.gd":
 func _ready():init_materials()
 func _process(_delta):pass
func _initialize():call_deferred("run")
func run():
 root.size=Vector2i(1000,1000)
 var stage=Studio.new();root.add_child(stage);stage.init_materials()
 var actor=load("res://scripts/worker_rigged.gd").new();stage.add_child(actor);actor.build("adam",Vector3.ZERO,stage);actor.set_process(false)
 var env=WorldEnvironment.new();env.environment=Environment.new();env.environment.background_mode=Environment.BG_COLOR;env.environment.background_color=Color(.10,.12,.14);env.environment.ambient_light_source=Environment.AMBIENT_SOURCE_COLOR;env.environment.ambient_light_color=Color.WHITE;env.environment.ambient_light_energy=.65;stage.add_child(env)
 var light=DirectionalLight3D.new();light.rotation_degrees=Vector3(-25,-25,0);light.light_energy=.85;stage.add_child(light)
 var cam=Camera3D.new();stage.add_child(cam);cam.fov=35;cam.current=true
 var target=Vector3(0,1.78,0)
 for pair in [["front",Vector3(0,0,1)],["quarter",Vector3(.7,0,.7)],["profile",Vector3(1,0,0)]]:
  cam.position=target+pair[1]*.85;cam.look_at(target)
  for i in 12:await process_frame
  await RenderingServer.frame_post_draw
  root.get_texture().get_image().save_png("res://validation/adam-likeness/"+pair[0]+".png")
 quit()



