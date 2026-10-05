extends Node3D
var model: Node3D
var height:=1.54
func build() -> void:
	name="LabVisitor";set_meta("dynamic",true)
	model=load("res://art/characters/rigged/lab_visitor.glb").instantiate();add_child(model)
	var skeleton: Skeleton3D=model.find_children("*","Skeleton3D",true,false)[0]
	for side in ["l","r"]:
		var index:=skeleton.find_bone("upperarm_"+side)
		var parent:=skeleton.get_bone_parent(index)
		var basis:=skeleton.get_bone_global_rest(parent).basis.get_rotation_quaternion()
		var turn:=Quaternion(Vector3.BACK,deg_to_rad(-78 if side=="l" else 78))
		skeleton.set_bone_pose_rotation(index,basis.inverse()*turn*basis*skeleton.get_bone_pose_rotation(index))
	var bounds:=AABB()
	var first:=true
	for mesh in model.find_children("*","MeshInstance3D",true,false):
		var box: AABB=mesh.transform*mesh.get_aabb()
		if first: bounds=box;first=false
		else: bounds=bounds.merge(box)
		for i in mesh.mesh.get_surface_count():
			var material: Material=mesh.mesh.surface_get_material(i)
			if material and material.resource_name.contains("visitor_skin"):
				var skin:=ShaderMaterial.new();skin.shader=preload("res://materials/visitor_skin.gdshader")
				skin.set_shader_parameter("reference",load("res://art/reference/coherence/lab-visitor.png"))
				mesh.set_surface_override_material(i,skin)
	# Source female topology has its crown at 1.767; authored hair sets final height.
	model.scale=Vector3.ONE*(height/maxf(1.767,bounds.size.y))
	model.position.y=-bounds.position.y*model.scale.y
	var body:=StaticBody3D.new();var shape:=CollisionShape3D.new();var capsule:=CapsuleShape3D.new()
	capsule.radius=.24;capsule.height=height;shape.shape=capsule;shape.position.y=height*.5
	add_child(body);body.add_child(shape)
