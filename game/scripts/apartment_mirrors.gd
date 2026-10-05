extends "res://scripts/lab_props.gd"
var apartment
var mirrors:Array=[]
func build(a):
 apartment=a;init_materials();name="MirrorsAndWildlife"
 add_mirror(Vector3(.105,1.22,3.55),PI/2,Vector3.RIGHT,64)
 add_mirror(Vector3(4.05,1.94,4.90),PI,Vector3.FORWARD,128)
 var atlas=load("res://art/wildlife_triptych.png")
 for i in 3:
  var p=Vector3(.13,2.10,2.87+i*.68)
  box(p,Vector3(.06,.75,.55),dark)
  var mesh=QuadMesh.new();mesh.size=Vector2(.49,.69)
  var photo=MeshInstance3D.new();photo.mesh=mesh;add_child(photo);photo.position=p+Vector3(.035,0,0);photo.rotation.y=PI/2
  var mat=StandardMaterial3D.new();mat.albedo_texture=atlas;mat.uv1_scale=Vector3(1.0/3.0,1,1);mat.uv1_offset=Vector3(i/3.0,0,0);mat.roughness=.85;photo.material_override=mat
 for n in find_children("*","GeometryInstance3D",true,false):
  n.layers=32 if n.has_meta("mirror_surface") else 4
func add_mirror(p:Vector3,yaw:float,normal:Vector3,wall_layer:int):
 var frame=Node3D.new();add_child(frame);frame.position=p;frame.rotation.y=yaw
 var before=get_child_count()
 for x in [-1.015,1.015]:box(Vector3(x,0,0),Vector3(.03,1.06,.045),metal)
 for y in [-.515,.515]:box(Vector3(0,y,0),Vector3(2.06,.03,.045),metal)
 var pieces=[]
 for i in range(before,get_child_count()):pieces.append(get_child(i))
 for piece in pieces:remove_child(piece);frame.add_child(piece)
 var view=SubViewport.new();view.size=Vector2i(720,450);view.world_3d=get_viewport().world_3d;view.render_target_update_mode=SubViewport.UPDATE_DISABLED;add_child(view)
 var camera=Camera3D.new();view.add_child(camera);camera.current=true;camera.cull_mask=4|(128 if wall_layer==64 else 64);camera.environment=apartment.interior_environment
 var surface=MeshInstance3D.new();var mesh=QuadMesh.new();mesh.size=Vector2(2,1);surface.mesh=mesh;frame.add_child(surface);surface.position.z=.026;surface.set_meta("mirror_surface",true)
 var mat=ShaderMaterial.new();mat.shader=load("res://materials/apartment_mirror.gdshader");mat.set_shader_parameter("reflection_view",view.get_texture());surface.material_override=mat
 mirrors.append({"view":view,"camera":camera,"p":p,"n":normal})
func _process(_dt):
 var main=get_viewport().get_camera_3d()
 for m in mirrors:
  var active=main!=null and main.global_position.distance_to(apartment.global_position)<20
  if active:
   var centre=apartment.global_position+m.p
   active=main.is_position_in_frustum(centre) or main.is_position_in_frustum(centre+Vector3(0,.5,.8)) or main.is_position_in_frustum(centre-Vector3(0,.5,.8))
  m.view.render_target_update_mode=SubViewport.UPDATE_ALWAYS if active else SubViewport.UPDATE_DISABLED
  if not active:continue
  var p=apartment.global_position+m.p;var n:Vector3=m.n
  var offset=main.global_position-p
  m.camera.global_position=main.global_position-2*n*offset.dot(n)
  var forward=-main.global_basis.z;forward-=2*n*forward.dot(n)
  var up=main.global_basis.y;up-=2*n*up.dot(n)
  m.camera.look_at(m.camera.global_position+forward,up)
  m.camera.fov=main.fov
  var screen=get_viewport().get_visible_rect().size
  m.view.size=Vector2i(720,int(720*screen.y/screen.x))
