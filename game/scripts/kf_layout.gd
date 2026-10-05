extends RefCounted
# One layout transform shared by inspection and the walk-around model.
static func apply(model: Node3D) -> void:
	var computer=model.find_child("computer",true,false)
	if computer:
		computer.scale=Vector3.ONE*1.7
		computer.position=Vector3(10.2,3.8,.2)-Vector3(6.4,3.2,-2.8)*1.7

	# Continue the exported data cable to the relocated computer stand.
	var curve=Curve3D.new()
	for point in [Vector3(6.4,1.6,-2.8),Vector3(7.4,1.0,-2.8),Vector3(9.4,.9,-1.5),Vector3(10.2,.995,.2)]:curve.add_point(point)
	var mat=StandardMaterial3D.new();mat.albedo_color=Color(.25,.36,.37)
	for i in 40:
		var a=curve.sample_baked(curve.get_baked_length()*i/40.0);var b=curve.sample_baked(curve.get_baked_length()*(i+1)/40.0)
		var wire=MeshInstance3D.new();var cylinder=CylinderMesh.new();cylinder.top_radius=.025;cylinder.bottom_radius=.025;cylinder.height=a.distance_to(b);wire.mesh=cylinder;wire.material_override=mat;wire.position=(a+b)/2;wire.quaternion=Quaternion(Vector3.UP,(b-a).normalized());model.add_child(wire)
