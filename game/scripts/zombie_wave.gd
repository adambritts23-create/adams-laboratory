extends Node3D
# Local authored humanoid assets; a single door-triggered, non-graphic wave.
var lab: Node3D
var started:=false
var walkers: Array=[]
func begin() -> void:
	if started:return
	started=true
	for i in 3:spawn_walker(i)
func spawn_walker(index: int) -> void:
	var body:=CharacterBody3D.new();body.name="FacilityZombie"+str(index+1);body.position=Vector3(-8.0-index*2.2,.03,9.5);body.collision_layer=0;body.collision_mask=1;add_child(body)
	var shape:=CapsuleShape3D.new();shape.height=1.72;shape.radius=.24
	var collision:=CollisionShape3D.new();collision.shape=shape;collision.position.y=.88;body.add_child(collision)
	var model: Node3D=load("res://art/characters/rigged/axel.glb").instantiate();body.add_child(model)
	var rig: Skeleton3D=model.find_children("*","Skeleton3D",true,false)[0]
	for mesh in model.find_children("*","MeshInstance3D",true,false):
		for surface in mesh.mesh.get_surface_count():
			var original: Material=mesh.mesh.surface_get_material(surface);var title: String=original.resource_name.to_lower() if original else ""
			var mat:=StandardMaterial3D.new();mat.roughness=.94
			mat.albedo_color=Color(.35,.40,.29) if title.contains("skin") else Color(.20,.24,.19) if title.contains("coverall") else Color(.07,.08,.06)
			if title.contains("skin") or title.contains("coverall"):
				var decay:=ShaderMaterial.new();decay.shader=preload("res://materials/zombie_decay.gdshader");decay.set_shader_parameter("base_color",mat.albedo_color);mesh.set_surface_override_material(surface,decay)
			else:mesh.set_surface_override_material(surface,mat)
	var hit:=Area3D.new();hit.collision_layer=8;hit.collision_mask=0;hit.set_meta("zombie",body);body.add_child(hit)
	var target:=CollisionShape3D.new();target.shape=shape;target.position.y=.88;hit.add_child(target)
	var rest: Dictionary={}
	for i in rig.get_bone_count():rest[rig.get_bone_name(i)]=rig.get_bone_pose_rotation(i)
	body.set_meta("down",false)
	walkers.append({"body":body,"model":model,"rig":rig,"rest":rest,"target":hit,"phase":float(index),"swings":0,"attack":0.0,"step":0,"route":[Vector3(-4.5,0,9.5),Vector3(0,0,9.5),Vector3(0,0,4-index*.9)]})
func hit(body: Node3D) -> void:
	if body.get_meta("down",false):return
	body.set_meta("down",true)
	for walker in walkers:
		if walker.body==body:
			walker.target.collision_layer=0
			var tween:=create_tween();tween.tween_property(walker.model,"rotation:x",-PI/2,.32)
			return
func _physics_process(delta: float) -> void:
	if lab==null or lab.paused or not lab.player.enabled:return
	for walker in walkers:
		var body: CharacterBody3D=walker.body
		if body.get_meta("down",false):continue
		var near: bool=body.global_position.distance_to(lab.player.global_position)<1.65
		walker.attack=maxf(0,float(walker.attack)-delta)
		if near and walker.attack<=0:walker.attack=1.35;walker.swings+=1
		var swing: float=sin(clampf((1.35-float(walker.attack))/.65,0,1)*PI) if walker.attack>.70 else 0.0
		var moving: bool=walker.step<walker.route.size() and not near
		var direction:=Vector3.ZERO
		if moving:
			direction=walker.route[walker.step]-body.position;direction.y=0
			if direction.length()<.22:walker.step+=1;direction=Vector3.ZERO
			else:direction=direction.normalized()
		body.velocity.x=direction.x*.85;body.velocity.z=direction.z*.85
		body.velocity.y=0 if body.is_on_floor() else body.velocity.y-9.8*delta
		body.move_and_slide()
		if near:
			var toward: Vector3=lab.player.global_position-body.global_position;body.rotation.y=atan2(toward.x,toward.z)
		elif direction.length_squared()>.01:body.rotation.y=atan2(direction.x,direction.z)
		walker.phase+=delta*3.3
		var rig: Skeleton3D=walker.rig
		for side in ["l","r"]:
			var sign_value:=1.0 if side=="l" else -1.0
			var stride: float=sin(walker.phase)*.30*sign_value if moving else 0.0
			for item in [["thigh_"+side,stride],["calf_"+side,maxf(0,-stride)*1.4]]:
				var bone:=rig.find_bone(item[0])
				if bone>=0:rig.set_bone_pose_rotation(bone,walker.rest[item[0]]*Quaternion(Vector3.RIGHT,item[1]))
			var arm:=rig.find_bone("upperarm_"+side)
			if arm>=0:
				var parent:=rig.get_bone_parent(arm);var basis:=rig.get_bone_global_rest(parent).basis.get_rotation_quaternion()
				rig.set_bone_pose_rotation(arm,basis.inverse()*Quaternion(Vector3.BACK,-sign_value*1.0)*basis*walker.rest["upperarm_"+side]*Quaternion(Vector3.RIGHT,.35+swing*1.3))
