extends Node3D
# Reusable low-poly prop construction. Static opaque meshes share resources and are
# spatially batched after dressing; glass and animated presentation stay separate.
var meshes := {}
var materials := {}
var metal: StandardMaterial3D
var dark: StandardMaterial3D
var green: StandardMaterial3D
var red: StandardMaterial3D
var glass: Material
var worn: StandardMaterial3D
var concrete: StandardMaterial3D
var cream: Material
var rubber: StandardMaterial3D
var brass: StandardMaterial3D
var paper: StandardMaterial3D
var amber: StandardMaterial3D
var wine: StandardMaterial3D
var plastic: StandardMaterial3D
var clear_liquid: StandardMaterial3D
var floor_surface: StandardMaterial3D
var painted: StandardMaterial3D
var worktop: ShaderMaterial

func material(color: Color, metallic: float = 0, rough: float = 0.5, glow: float = 0) -> StandardMaterial3D:
	var key := str([color, metallic, rough, glow])
	if materials.has(key): return materials[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.metallic = metallic
	m.roughness = rough
	if glow > 0:
		m.emission_enabled = true
		m.emission = color
		m.emission_energy_multiplier = glow
	if color.a < 1:
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		m.cull_mode = BaseMaterial3D.CULL_DISABLED
	materials[key] = m
	return m

func aged(base: Color, stain: Color, metallic: float, scale_value: float) -> StandardMaterial3D:
	# Browser: avoid hundreds of asynchronous procedural texture generators at startup.
	var m := material(base.lerp(stain, 0.28), metallic, 0.72)
	return m

func init_materials() -> void:
	metal = material(Color(0.57,0.60,0.61),0.78,0.24)
	dark = material(Color(0.12,0.145,0.14),0.18,0.48)
	green = material(Color(0.20,0.46,0.018,.77),0.0,0.19,0.35)
	red = material(Color(0.78,0.025,0.008),0,0.35,2.4)
	glass = ShaderMaterial.new()
	glass.shader=preload("res://materials/lab_glass.gdshader")
	worn = aged(Color(0.24,0.28,0.26),Color(0.16,0.18,0.17),0.38,0.65)
	worn.roughness=0.43
	worn.normal_scale=0.12
	concrete = aged(Color(0.30,0.29,0.265),Color(0.19,0.185,0.17),0,0.45)
	concrete.roughness=0.95
	concrete.normal_scale=0.35
	cream=ShaderMaterial.new()
	cream.shader=preload("res://materials/coverall.gdshader")
	plastic=material(Color(0.45,0.48,0.45),0,0.43)
	rubber = material(Color(0.035,0.044,0.04),0,0.78)
	brass = material(Color(0.40,0.27,0.065),0.7,0.4)
	paper = material(Color(0.63,0.57,0.38),0,0.95)
	amber = material(Color(0.20,0.085,0.024),0.2,0.22)
	wine = material(Color(0.21,0.012,0.018),0.1,0.24)
	clear_liquid = material(Color(0.20,0.32,0.29,0.24),0.0,0.16)
	concrete = pbr_surface("concrete_floor_02",Color(.52,.52,.48),0,.90,.5)
	floor_surface = pbr_surface("concrete_floor_02",Color(.66,.64,.58),.04,.82,.5)
	worn = pbr_surface("rusty_metal_02",Color(.40,.43,.39),.52,.65,1.0)
	painted = pbr_surface("blue_metal_plate",Color(.43,.49,.46),.38,.64,.4)
	worktop=ShaderMaterial.new()
	worktop.shader=preload("res://materials/brushed_steel.gdshader")

func pbr_surface(id: String, tint: Color, metallic: float, rough: float, tiling: float) -> StandardMaterial3D:
	var m:=StandardMaterial3D.new()
	m.albedo_texture=load("res://art/environment/"+id+"_diff_1k.jpg")
	m.normal_texture=load("res://art/environment/"+id+"_nor_gl_1k.jpg")
	m.roughness_texture=load("res://art/environment/"+id+"_rough_1k.jpg")
	m.normal_enabled=true
	m.normal_scale=.12
	m.albedo_color=tint
	m.metallic=metallic
	m.roughness=rough
	m.uv1_triplanar=true
	m.uv1_world_triplanar=true
	m.uv1_scale=Vector3.ONE*tiling
	m.texture_filter=BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	return m

func imported_prop(id: String, pos: Vector3, size: float=1.0, override_mat: Material=null) -> Node3D:
	var scene: PackedScene=load("res://art/environment/props/"+id+".glb")
	var prop:=scene.instantiate() as Node3D
	add_child(prop)
	prop.position=pos
	prop.scale=Vector3.ONE*size
	prop.set_meta("asset_source",id)
	for n in prop.find_children("*","MeshInstance3D",true,false):
		if override_mat!=null: n.material_override=override_mat
		else:
			for i in n.mesh.get_surface_count():
				var original: Material=n.mesh.surface_get_material(i)
				if original is StandardMaterial3D:
					var m:=original.duplicate() as StandardMaterial3D
					m.roughness=.43
					m.metallic=.22
					m.albedo_color=Color(.63,.65,.60)
					n.set_surface_override_material(i,m)
	return prop

func liquid_visual(pos: Vector3, radius: float, height: float, color: Color, emission: float=.0) -> Node3D:
	var v:=preload("res://scripts/liquid_visual.gd").new()
	add_child(v)
	v.position=pos
	v.configure(radius,height,color,emission)
	v.set_meta("sample_contents",true)
	return v

func mesh_node(mesh: Mesh, pos: Vector3, size: Vector3, mat: Material, parent: Node3D = null) -> MeshInstance3D:
	if parent == null: parent = self
	var n := MeshInstance3D.new()
	n.mesh = mesh
	n.position = pos
	n.scale = size
	n.material_override = mat
	parent.add_child(n)
	n.add_to_group("static_dressing")
	return n

func box(pos: Vector3, size: Vector3, mat: Material, solid: bool = false, id: String = "", title: String = "") -> Node3D:
	if not meshes.has("box"): meshes.box = BoxMesh.new()
	var parent: Node3D = null
	if solid:
		parent = StaticBody3D.new()
		parent.position = pos
		add_child(parent)
		var col := CollisionShape3D.new()
		var shape := BoxShape3D.new()
		shape.size = size
		col.shape = shape
		parent.add_child(col)
		if not id.is_empty():
			parent.set_meta("interaction",id)
			parent.set_meta("title",title)
	mesh_node(meshes.box,Vector3.ZERO if solid else pos,size,mat,parent)
	return parent if solid else get_child(get_child_count()-1)

func cylinder(pos: Vector3, radius: float, height: float, mat: Material, top: float = -1) -> MeshInstance3D:
	var ratio := 1.0 if top < 0 else top/radius
	var key := "cyl" + str(ratio)
	if not meshes.has(key):
		var m := CylinderMesh.new()
		m.bottom_radius = 1
		m.top_radius = ratio
		m.height = 1
		m.radial_segments = 20
		meshes[key] = m
	return mesh_node(meshes[key],pos,Vector3(radius,height,radius),mat)

func ellipsoid(pos: Vector3, size: Vector3, mat: Material) -> MeshInstance3D:
	if not meshes.has("sphere"):
		var m := SphereMesh.new()
		m.radius = 1
		m.height = 2
		m.radial_segments = 20
		m.rings = 10
		meshes.sphere = m
	return mesh_node(meshes.sphere,pos,size,mat)

func tube(a: Vector3, b: Vector3, radius: float, mat: Material) -> MeshInstance3D:
	var n := cylinder((a+b)*0.5,radius,a.distance_to(b),mat)
	var direction := (b-a).normalized()
	n.quaternion = Quaternion(Vector3.UP,direction)
	return n

func ring(pos: Vector3, radius: float, thickness: float, mat: Material) -> MeshInstance3D:
	var key := "ring"+str(thickness/radius)
	if not meshes.has(key):
		var m := TorusMesh.new()
		m.inner_radius = 1-thickness/radius
		m.outer_radius = 1+thickness/radius
		m.rings = 20
		m.ring_segments = 6
		meshes[key] = m
	return mesh_node(meshes[key],pos,Vector3.ONE*radius,mat)

func lathe(profile: Array[Vector2], key: String) -> ArrayMesh:
	if meshes.has(key): return meshes[key]
	var surface := SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in range(profile.size()-1):
		for j in 24:
			var a := TAU*j/24.0
			var b := TAU*(j+1)/24.0
			var p := profile[i]
			var q := profile[i+1]
			var v := [Vector3(p.x*cos(a),p.y,p.x*sin(a)),Vector3(p.x*cos(b),p.y,p.x*sin(b)),Vector3(q.x*cos(a),q.y,q.x*sin(a)),Vector3(q.x*cos(b),q.y,q.x*sin(b))]
			for index in [0,1,2,1,3,2]: surface.add_vertex(v[index])
	surface.generate_normals()
	var result := surface.commit()
	meshes[key] = result
	return result

func label_at(text: String, pos: Vector3, size: int = 30, color: Color = Color(0.86,0.80,0.63), pixel: float = 0.0028) -> Label3D:
	var label := Label3D.new()
	label.text = text
	label.position = pos
	label.font_size = size
	label.pixel_size = pixel
	label.modulate = color
	label.outline_size = 0
	label.no_depth_test = false
	add_child(label)
	return label

func plaque(text: String, pos: Vector3, size: Vector2, angle: float = 0, warning: bool = false) -> void:
	var body := box(pos,Vector3(size.x,size.y,0.035),paper if warning else rubber)
	body.rotation.y = angle
	var normal := Vector3(sin(angle),0,cos(angle))
	label_at(text,pos+normal*0.024,28,Color(0.08,0.06,0.03) if warning else Color(0.88,0.82,0.64),minf(size.x/(maxi(text.length(),1)*17.0),size.y/70.0)).rotation.y = angle
	for x in [-1,1]:
		for y in [-1,1]:
			ellipsoid(pos+Vector3(x*size.x*0.44,y*size.y*0.37,0).rotated(Vector3.UP,angle)+normal*0.025,Vector3.ONE*minf(0.013,size.y*0.045),metal)

func vessel(kind: String, pos: Vector3, s: float = 1, liquid: Material = null, caption: String = "") -> Node3D:
	var root := Node3D.new()
	add_child(root)
	var before := get_child_count()
	var profile: Array[Vector2]
	var r := 0.16
	var h := 0.38
	match kind:
		"flask":
			profile = [Vector2(0,0),Vector2(0.19,0.02),Vector2(0.19,0.08),Vector2(0.06,0.34),Vector2(0.05,0.53),Vector2(0.06,0.54)]
			r = 0.055; h = 0.54
		"volumetric":
			profile = [Vector2(0,0),Vector2(0.11,0.02),Vector2(0.19,0.14),Vector2(0.16,0.28),Vector2(0.045,0.36),Vector2(0.04,0.66),Vector2(0.05,0.67)]
			r = 0.045; h = 0.67
		"tube":
			profile = [Vector2(0,0),Vector2(0.045,0.03),Vector2(0.052,0.07),Vector2(0.052,0.4)]
			r = 0.052; h = 0.4
		"bottle":
			profile = [Vector2(0,0),Vector2(0.14,0.015),Vector2(0.14,0.35),Vector2(0.07,0.40),Vector2(0.06,0.5)]
			r = 0.06; h = 0.5
		_:
			profile = [Vector2(0,0),Vector2(0.17,0),Vector2(0.18,0.025),Vector2(0.18,0.36),Vector2(0.19,0.38)]
			r = 0.19; h = 0.38
	var authored: String={"beaker":"bottle_glassware_beaker_large","flask":"bottle_glassware_erlenmeyer_flask_large","volumetric":"bottle_glassware_volumetric_flask_large"}.get(kind,"")
	if not authored.is_empty(): imported_prop(authored,pos,s,glass)
	else: mesh_node(lathe(profile,"vessel_"+kind),pos,Vector3.ONE*s,amber if kind=="bottle" else glass)
	ring(pos+Vector3(0,h*s,0),r*s,0.007*s,metal if kind=="bottle" else material(Color(0.5,0.64,0.61,0.45),0.35,0.14))
	if liquid != null:
		var body_radius := 0.042 if kind=="tube" else (0.13 if kind=="bottle" else 0.15)
		if liquid==green and kind in ["beaker","tube"]:
			liquid_visual(pos+Vector3(0,.012*s,0),body_radius*s,.18*s,Color(.12,.39,.008,.48),.65)
		else: cylinder(pos+Vector3(0,0.10*s,0),body_radius*s,0.18*s,liquid,body_radius*s*(0.65 if kind=="flask" else 1.0)).set_meta("sample_contents",true)
		ring(pos+Vector3(0,.19*s,0),body_radius*s*(.65 if kind=="flask" else 1.0),.0025*s,material(Color(.61,.69,.60,.36),.05,.12)).set_meta("sample_contents",true)
	if kind=="bottle":
		cylinder(pos+Vector3(0,0.53*s,0),0.066*s,0.06*s,rubber)
		box(pos+Vector3(0,0.22*s,0.141*s),Vector3(0.19,0.17,0.008)*s,paper)
		if not caption.is_empty(): label_at(caption,pos+Vector3(0,0.22*s,0.15*s),22,Color(0.12,0.1,0.06),0.0016*s)
	elif kind=="beaker":
		for k in 4:
			box(pos+Vector3(0.09*s,(0.10+k*0.055)*s,0.162*s),Vector3(0.065,0.006,0.003)*s,paper)
	root.position=pos
	for child in get_children().slice(before): child.reparent(root)
	root.set_meta("dynamic",true);root.set_meta("glass_kind",kind);root.set_meta("glass_scale",s);root.set_meta("glass_height",h*s);root.add_to_group("laboratory_glass")
	return root

func cable(points: Array[Vector3], mat: Material, radius: float = 0.012) -> void:
	for i in range(points.size()-1): tube(points[i],points[i+1],radius,mat)

func gauge(pos: Vector3, radius: float = 0.1) -> void:
	var dial := cylinder(pos,radius,0.05,metal)
	dial.rotation.x = PI/2
	var face := cylinder(pos+Vector3(0,0,0.03),radius*0.84,0.007,paper)
	face.rotation.x = PI/2
	tube(pos+Vector3(0,0,0.04),pos+Vector3(radius*0.43,radius*0.38,0.04),0.005,rubber)

func batch_static() -> void:
	var groups := {}
	for item in get_tree().get_nodes_in_group("static_dressing"):
		if not is_ancestor_of(item) or item.is_queued_for_deletion(): continue
		var dynamic := false
		var p: Node = item
		while p != self:
			if p.has_meta("dynamic"): dynamic = true
			p = p.get_parent()
		if dynamic: continue
		var mat: Material = item.material_override
		if not mat is StandardMaterial3D or mat.transparency != BaseMaterial3D.TRANSPARENCY_DISABLED: continue
		var cell := Vector2i(floori(item.global_position.x/float(get_meta("batch_cell_size",4))),floori(item.global_position.z/float(get_meta("batch_cell_size",4))))
		var key := str([item.mesh.get_instance_id(),mat.get_instance_id(),cell,item.layers,item.cast_shadow,item.visibility_range_begin,item.visibility_range_end])
		if not groups.has(key): groups[key] = []
		groups[key].append(item)
	for nodes in groups.values():
		if nodes.size()<3: continue
		var multi := MultiMesh.new()
		multi.transform_format = MultiMesh.TRANSFORM_3D
		multi.mesh = nodes[0].mesh
		multi.instance_count = nodes.size()
		var instance := MultiMeshInstance3D.new()
		instance.multimesh = multi
		instance.material_override = nodes[0].material_override
		instance.layers = nodes[0].layers
		instance.cast_shadow = nodes[0].cast_shadow
		instance.visibility_range_begin=nodes[0].visibility_range_begin
		instance.visibility_range_end=nodes[0].visibility_range_end
		add_child(instance)
		for i in nodes.size():
			multi.set_instance_transform(i,global_transform.affine_inverse()*nodes[i].global_transform)
			nodes[i].queue_free()



func sediment(pos: Vector3, radius: float, depth: float) -> Node3D:
	var root:=Node3D.new()
	root.position=pos
	root.set_meta("dynamic",true)
	add_child(root)
	var st:=SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var grid: Array[PackedVector3Array]=[]
	for ring_index in 17:
		var row:=PackedVector3Array()
		var r:=radius*ring_index/16.0
		for j in 64:
			var a:=TAU*j/64.0
			var x:=cos(a)*r
			var z:=sin(a)*r
			var fine:=sin(x/radius*77.0+z/radius*41.0)*sin(z/radius*99.0)
			var y:=depth*(.66+.10*sin(a*3+r*9)+.06*fine+.1*(1-r/radius))
			row.append(Vector3(x,y,z))
		grid.append(row)
	for k in 16:
		for j in 64:
			var n: int=(j+1)%64
			for v in [grid[k][j],grid[k+1][j],grid[k][n],grid[k][n],grid[k+1][j],grid[k+1][n]]: st.add_vertex(v)
	st.index()
	st.generate_normals()
	var mat:=aged(Color(.67,.40,.085),Color(.49,.28,.065),0,45)
	mat.roughness=.99
	mat.cull_mode=BaseMaterial3D.CULL_DISABLED
	mesh_node(st.commit(),Vector3.ZERO,Vector3.ONE,mat,root)
	return root

