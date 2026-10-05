extends Node3D
# Shared illustrative liquid presentation. No chemistry quantities or endpoint logic.
var body: MeshInstance3D
var surface: MeshInstance3D
var meniscus: MeshInstance3D
var halo: MeshInstance3D
var sediment: MultiMeshInstance3D
var liquid_color:=Color(.12,.39,.008,.48)
var sediment_color:=Color(.85,.43,.045)
var fill_level:=1.0
var emission_strength:=.65
var cloudiness:=0.0
var surface_motion:=.15
var sediment_amount:=0.0
var radius:=.15
var height:=.18
var usable_vessel_depth:=.18
var settled_points: Array[Vector3]=[]
var suspension_points: Array[Vector3]=[]
var particle_sizes: Array[Vector3]=[]
var treatment:=0.0
var precipitation_progress:=0.0
var settling_progress:=0.0
var sediment_bed: MeshInstance3D
var materials: Array[ShaderMaterial]=[]
var motion_phase:=0.0

func animate_motion(delta: float) -> void:
	if treatment<=0 or treatment>=1: return
	motion_phase+=delta*(1-smoothstep(.60,.94,treatment))
	apply_visuals()

func configure(r: float, h: float, tint: Color, emission: float) -> void:
	set_meta("dynamic",true)
	radius=r; height=h; usable_vessel_depth=h*.96; liquid_color=tint; emission_strength=emission
	for is_surface in [false,true]:
		var mesh:=CylinderMesh.new()
		mesh.top_radius=r; mesh.bottom_radius=r; mesh.height=.002 if is_surface else h
		mesh.radial_segments=48
		if not is_surface:
			mesh.cap_top=false
			mesh.cap_bottom=false
		var node:=MeshInstance3D.new()
		node.mesh=mesh
		node.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		add_child(node)
		var mat:=ShaderMaterial.new()
		mat.shader=preload("res://materials/liquid.gdshader")
		mat.set_shader_parameter("surface",is_surface)
		node.material_override=mat
		materials.append(mat)
		if is_surface: surface=node
		else: body=node
	meniscus=MeshInstance3D.new()
	var rim:=TorusMesh.new()
	rim.inner_radius=r*.977;rim.outer_radius=r
	rim.rings=48;rim.ring_segments=6
	meniscus.mesh=rim
	meniscus.material_override=surface.material_override
	meniscus.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(meniscus)
	halo=MeshInstance3D.new()
	var quad:=QuadMesh.new();quad.size=Vector2(r*3.2,h*1.8)
	halo.mesh=quad
	halo.position.y=h*.5
	halo.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var halo_mat:=ShaderMaterial.new();halo_mat.shader=preload("res://materials/liquid_halo.gdshader")
	halo.material_override=halo_mat
	add_child(halo)
	var particles:=MultiMesh.new()
	particles.transform_format=MultiMesh.TRANSFORM_3D
	var floc:=PrismMesh.new()
	floc.size=Vector3(1.4,.7,1.0)
	floc.left_to_right=.37
	particles.mesh=floc
	particles.instance_count=1200
	var rng:=RandomNumberGenerator.new();rng.seed=853
	for i in particles.instance_count:
		var a:=rng.randf()*TAU
		var d:=sqrt(rng.randf())*r*.97
		var pos:=Vector3(cos(a)*d,h*.188+rng.randf()*h*.022,sin(a)*d)
		settled_points.append(pos)
		suspension_points.append(Vector3(pos.x,h*rng.randf_range(.10,.94),pos.z))
		var scale_value:=Vector3(r*.014,r*.006,r*.011)*rng.randf_range(.35,1.5)
		particle_sizes.append(scale_value)
		particles.set_instance_transform(i,Transform3D(Basis.IDENTITY.scaled(scale_value),pos))
	sediment=MultiMeshInstance3D.new()
	sediment.multimesh=particles
	var sediment_mat:=StandardMaterial3D.new()
	sediment_mat.albedo_color=sediment_color
	sediment_mat.emission_enabled=true
	sediment_mat.emission=sediment_color
	sediment_mat.emission_energy_multiplier=.06
	sediment_mat.roughness=.95
	sediment.material_override=sediment_mat
	add_child(sediment)
	build_sediment_bed(sediment_mat)
	apply_visuals()

func set_treatment(t: float) -> void:
	t=clampf(t,0,1)
	treatment=t
	precipitation_progress=smoothstep(.025,.60,t)
	settling_progress=smoothstep(.60,1.0,t)
	liquid_color=Color(.12,.39,.008,.48).lerp(Color(.48,.34,.10,.28),precipitation_progress*(1-settling_progress)).lerp(Color(.30,.34,.19,.18),settling_progress)
	emission_strength=.65*(1-precipitation_progress)
	cloudiness=precipitation_progress*(1-settling_progress)
	surface_motion=.12+.88*(1-settling_progress)
	sediment_amount=precipitation_progress
	apply_visuals()

func apply_visuals() -> void:
	(body.mesh as CylinderMesh).height=height
	if sediment.material_override is StandardMaterial3D:
		sediment.material_override.albedo_color=sediment_color
		sediment.material_override.emission=sediment_color
	body.scale.y=maxf(.01,fill_level)
	body.position.y=height*fill_level*.5
	surface.position.y=height*fill_level
	meniscus.position.y=height*fill_level
	halo.visible=emission_strength>0.01
	halo.material_override.set_shader_parameter("strength",emission_strength*.065)
	for mat in materials:
		mat.set_shader_parameter("liquid_color",liquid_color)
		mat.set_shader_parameter("emission_strength",emission_strength)
		mat.set_shader_parameter("cloudiness",cloudiness)
		mat.set_shader_parameter("surface_motion",surface_motion)
		mat.set_shader_parameter("sediment_amount",sediment_amount)
		mat.set_shader_parameter("sediment_color",sediment_color)
	sediment_bed.visible=settling_progress>0.001
	var depth_factor:=usable_vessel_depth/(height*.96)
	sediment_bed.scale.y=maxf(.01,settling_progress)*depth_factor
	sediment.visible=sediment_amount>0.0
	sediment.multimesh.visible_instance_count=int(1200*sediment_amount)
	for i in sediment.multimesh.visible_instance_count:
		var tx:=Transform3D.IDENTITY
		var settle:=settling_progress
		var suspended:=suspension_points[i]
		suspended.y*=fill_level
		suspended=suspended.rotated(Vector3.UP,motion_phase*.32*(1-settle))
		var final_point:=settled_points[i]
		final_point.y=minf(final_point.y*depth_factor,suspended.y)
		tx.origin=suspended.lerp(final_point,settle)
		var grow:=lerpf(.55,1.0,precipitation_progress)
		tx.basis=Basis.from_euler(Vector3(i*.73,i*1.37,i*.29)).scaled(particle_sizes[i]*grow)
		sediment.multimesh.set_instance_transform(i,tx)

func build_sediment_bed(mat: Material) -> void:
	var st:=SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var rows: Array[PackedVector3Array]=[]
	for k in 17:
		var row:=PackedVector3Array()
		for j in 64:
			var a:=TAU*j/64.0
			var d:=radius*.96*k/16.0
			var ripple:=sin(a*7+k*.9)*.25+sin(a*19-k*1.1)*.12
			row.append(Vector3(cos(a)*d,height*(.19+.010*ripple)+height*.012*(1-float(k)/16),sin(a)*d))
		rows.append(row)
	for k in 16:
		for j in 64:
			var n: int=(j+1)%64
			for v in [rows[k][j],rows[k+1][j],rows[k][n],rows[k][n],rows[k+1][j],rows[k+1][n]]:st.add_vertex(v)
	# Closed skirt makes the substantial deposit readable through the vessel side.
	for j in 64:
		var n: int=(j+1)%64
		var a: Vector3=rows[16][j];var b: Vector3=rows[16][n]
		var c:=Vector3(a.x,0,a.z);var d:=Vector3(b.x,0,b.z)
		for v in [a,c,b,b,c,d]:st.add_vertex(v)
	st.generate_normals()
	sediment_bed=MeshInstance3D.new()
	sediment_bed.mesh=st.commit()
	sediment_bed.material_override=mat
	add_child(sediment_bed)
