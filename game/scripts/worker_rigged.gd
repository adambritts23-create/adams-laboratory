extends "res://scripts/lab_props.gd"
# Imported authored meshes + one weighted humanoid skeleton. No runtime anatomy construction.
var identity := ""
var rig: Skeleton3D
var model: Node3D
var age := 0.0
var height := 2.0
var head_height := 1.85
var shoulder_width := .70
var rest_rotations: Dictionary = {}
var base_rotations: Dictionary = {}
var head_yaw := 0.0

func build(id: String, origin: Vector3, room: Node3D) -> void:
 identity=id
 position=origin
 set_meta("dynamic",true)
 init_materials()
 height=1.88 if id=="adam" else 1.75
 head_height=height-.15
 shoulder_width=.70 if id=="adam" else .61
 model=load("res://art/characters/rigged/"+id+".glb").instantiate()
 add_child(model)
 model.scale=Vector3((2.0 if id=="adam" else 1.88)/1.819586,height/1.819586,height/1.819586)
 model.position.y=.0105
 rig=model.find_children("*","Skeleton3D",true,false)[0]
 rig.name="HumanoidSkeleton"
 # Bone names remain standard and weighted fingers remain available for future animation.
 for i in rig.get_bone_count():
  rest_rotations[rig.get_bone_name(i)]=rig.get_bone_pose_rotation(i)
 # Rotate authored T-pose arms to a relaxed stance in skeleton space.
 for side in ["l","r"]:
  var sign_value:=1.0 if side=="l" else -1.0
  rotate_global_rest("upperarm_"+side,Quaternion(Vector3.BACK,-sign_value*deg_to_rad(78)))
  var forearm:=rig.find_bone("lowerarm_"+side)
  rig.set_bone_pose_rotation(forearm,rig.get_bone_pose_rotation(forearm)*Quaternion(Vector3.RIGHT,deg_to_rad(-8)))
  for finger in ["index","middle","ring","pinky"]:
   for joint in ["01","02","03"]:
    var bone:=rig.find_bone(finger+"_"+joint+"_"+side)
    if bone>=0:rig.set_bone_pose_rotation(bone,rig.get_bone_pose_rotation(bone)*Quaternion(Vector3.RIGHT,.13))
 for i in rig.get_bone_count(): base_rotations[rig.get_bone_name(i)]=rig.get_bone_pose_rotation(i)
 for n in model.find_children("*","MeshInstance3D",true,false):
  for surface in n.mesh.get_surface_count():
   var original: Material=n.mesh.surface_get_material(surface)
   var title:=original.resource_name.to_lower() if original else ""
   if title.contains("skin"):
    var skin:=ShaderMaterial.new()
    skin.shader=preload("res://materials/adam_skin_refined.gdshader") if id=="adam" else preload("res://materials/portrait_skin.gdshader")
    skin.set_shader_parameter("adam",id=="adam")
    skin.set_shader_parameter("neutral_portrait",load("res://art/reference/phase6/adam-neutral-three-quarter.png"))
    skin.set_shader_parameter("portrait",load("res://art/reference/phase4/adam-portrait.png" if id=="adam" else "res://art/characters/axel-face.png"))
    skin.set_shader_parameter("skin_color",Color(.72,.53,.42) if id=="adam" else Color(.68,.49,.37))
    n.set_surface_override_material(surface,skin)
   elif title.contains("eyes"):
    var eyes:=ShaderMaterial.new()
    eyes.shader=preload("res://materials/worker_eyes.gdshader")
    eyes.set_shader_parameter("iris_color",Color(.16,.19,.20) if id=="adam" else Color(.19,.16,.12))
    eyes.set_shader_parameter("eye_texture",load("res://art/characters/rigged/textures/T_Eye_Brown.png"))
    n.set_surface_override_material(surface,eyes)
   elif title=="hair" or title.begins_with("hair."):
    var hair:=StandardMaterial3D.new()
    hair.albedo_color=Color(.22,.15,.10) if id=="adam" else Color(.25,.20,.16)
    hair.albedo_texture=load("res://art/characters/rigged/textures/T_Hair_1_BaseColor.png")
    hair.roughness=.86
    hair.normal_enabled=true
    hair.normal_texture=load("res://art/characters/rigged/textures/T_Hair_1_Normal.png")
    hair.normal_scale=.28
    n.set_surface_override_material(surface,hair)
    if id=="axel":
     var stubble:=ShaderMaterial.new()
     stubble.shader=preload("res://materials/worker_stubble.gdshader")
     stubble.set_shader_parameter("hair_texture",load("res://art/characters/rigged/textures/T_Hair_1_BaseColor.png"))
     n.set_surface_override_material(surface,stubble)
   elif title.contains("coverall"):
    n.set_surface_override_material(surface,room.cream)
 # Accessories follow actual bones, never static world positions.
 var chest:=attachment("spine_03")
 var details:=Node3D.new()
 chest.add_child(details)
 details.transform=rig.get_bone_global_rest(rig.find_bone("spine_03")).affine_inverse()
 var before:=get_child_count()
 box(Vector3(.11,1.36,.13),Vector3(.11,.045,.004),rubber)
 label_at(id.to_upper(),Vector3(.11,1.36,.133),22,Color(.8,.8,.7),.001)
 var patch:=StandardMaterial3D.new()
 patch.albedo_texture=load("res://art/characters/rigged/textures/radiation-patch.svg")
 patch.roughness=.95
 var patch_mesh:=QuadMesh.new()
 patch_mesh.size=Vector2(.065,.065)
 mesh_node(patch_mesh,Vector3(-.105,1.40,.129),Vector3.ONE,patch)
 for i in 3: tube(Vector3(.09+i*.014,1.40,.124),Vector3(.09+i*.014,1.465,.112),.004,rubber)
 # The zipper is clothing trim, not anatomy; everything underneath is an authored garment.
 tube(Vector3(0,1.025,.10),Vector3(0,1.43,.125),.0035,rubber)
 for child in get_children().slice(before):child.reparent(details,false)
 if id=="adam":
  var wrist:=attachment("hand_l")
  var watch:=Node3D.new()
  wrist.add_child(watch)
  watch.rotation.z=PI/2
  watch.position.y=-.025
  watch.scale=Vector3.ONE*.65
  var count:=room.get_child_count()
  room.breitling(Vector3.ZERO)
  for child in room.get_children().slice(count):child.reparent(watch,false)

func attachment(bone: String) -> BoneAttachment3D:
 var node:=BoneAttachment3D.new()
 rig.add_child(node)
 node.bone_name=bone
 return node

func rotate_global_rest(bone_name: String, rotation: Quaternion) -> void:
 var index:=rig.find_bone(bone_name)
 var parent:=rig.get_bone_parent(index)
 var parent_basis:=rig.get_bone_global_rest(parent).basis.get_rotation_quaternion()
 rig.set_bone_pose_rotation(index,parent_basis.inverse()*rotation*parent_basis*rig.get_bone_pose_rotation(index))

func animate(delta: float, viewer: Vector3, speaking: bool) -> void:
 age+=delta
 var spine:=rig.find_bone("spine_02")
 rig.set_bone_pose_rotation(spine,base_rotations["spine_02"]*Quaternion(Vector3.RIGHT,sin(age*1.22)*.006)*Quaternion(Vector3.BACK,sin(age*.23)*.007))
 var local_viewer:=to_local(viewer)
 var aim:=clampf(atan2(local_viewer.x,local_viewer.z),-.65,.65)
 head_yaw=lerpf(head_yaw,aim,minf(delta*1.8,1))
 var head:=rig.find_bone("Head")
 rig.set_bone_pose_rotation(head,base_rotations["Head"]*Quaternion(Vector3.UP,head_yaw)*Quaternion(Vector3.RIGHT,sin(age*.61)*.008))
