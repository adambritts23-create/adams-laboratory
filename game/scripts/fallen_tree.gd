extends Node3D
func _ready():
 name="FallenTree"
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 var author=preload("res://scripts/tree_geometry.gd")
 author.tube_mesh(st,Vector3.ZERO,Vector3(8,.06,0),.32,.09)
 for i in 9:
  var p=Vector3(1+i*.72,.06,0);var side=1 if i%2 else -1
  author.tube_mesh(st,p,p+Vector3(.6,.20,side*(.35+(i%3)*.25)),.065,.012)
 st.generate_normals();var mesh=MeshInstance3D.new();add_child(mesh);mesh.mesh=st.commit();mesh.layers=2;mesh.visibility_range_end=100
 var bark=ShaderMaterial.new();bark.shader=preload("res://materials/nordic_bark.gdshader");bark.set_shader_parameter("species",1);mesh.material_override=bark
 var end=MeshInstance3D.new();add_child(end);var disk=CylinderMesh.new();disk.top_radius=.29;disk.bottom_radius=.29;disk.height=.015;disk.radial_segments=16;end.mesh=disk;end.rotation.z=PI/2;end.layers=2
 var wood=StandardMaterial3D.new();wood.albedo_color=Color(.47,.32,.16);wood.roughness=1;end.material_override=wood;end.visibility_range_end=100
