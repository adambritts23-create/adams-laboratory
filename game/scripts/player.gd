extends CharacterBody3D

var safe_transform:=Transform3D.IDENTITY
var reset_motion_pending:=false
var camera: Camera3D
var enabled := true
var crouched := false
var step_time := 0.0
var world: Node
var shape_node: CollisionShape3D
var ceiling_ray: RayCast3D

func _ready() -> void:
	world = get_parent()
	safe_transform=global_transform
	# Walking never inherits motion from the car or other rigid bodies.
	platform_floor_layers=0;platform_wall_layers=0
	platform_on_leave=CharacterBody3D.PLATFORM_ON_LEAVE_DO_NOTHING
	shape_node = CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.28
	capsule.height = 1.75
	shape_node.shape = capsule
	shape_node.position.y = 0.875
	add_child(shape_node)
	camera = Camera3D.new()
	camera.position.y = 1.62
	camera.fov = 78
	camera.near = 0.06
	camera.current = true
	add_child(camera)
	ceiling_ray = RayCast3D.new()
	ceiling_ray.position.y = 0.8
	ceiling_ray.target_position = Vector3(0, 1.1, 0)
	add_child(ceiling_ray)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and enabled and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		rotate_y(-event.relative.x * 0.0022)
		camera.rotation.x = clampf(camera.rotation.x - event.relative.y * 0.0022, -1.4, 1.4)

func reset_motion() -> void:
	velocity=Vector3.ZERO;safe_transform=global_transform;reset_motion_pending=true
	reset_physics_interpolation()

func _physics_process(delta: float) -> void:
	if reset_motion_pending:
		# Clear cached floor/platform contacts after teleporting or leaving a vehicle.
		var previous_mask=collision_mask
		collision_mask=0;velocity=Vector3.ZERO;move_and_slide();collision_mask=previous_mask
		reset_motion_pending=false
	if not global_transform.is_finite() or not velocity.is_finite():
		global_transform=safe_transform;velocity=Vector3.ZERO
		world.record("Recovered invalid player physics state")
		return
	safe_transform=global_transform
	var was_grounded := is_on_floor()
	if not is_on_floor():
		velocity.y -= 20.0 * delta
	var axis := Vector2.ZERO
	if enabled:
		axis = Input.get_vector("left", "right", "forward", "back")
	var want_crouch := enabled and Input.is_action_pressed("crouch")
	if not want_crouch and crouched and ceiling_ray.is_colliding():
		want_crouch = true
	crouched = want_crouch
	shape_node.shape.height = 1.0 if crouched else 1.75
	shape_node.position.y = 0.5 if crouched else 0.875
	camera.position.y = move_toward(camera.position.y, 0.9 if crouched else 1.62, delta * 5)
	var speed := 2.0 if crouched else (6.0 if enabled and Input.is_action_pressed("sprint") else 3.6)
	var direction := transform.basis * Vector3(axis.x, 0, axis.y)
	velocity.x = move_toward(velocity.x, direction.x * speed, 24 * delta)
	velocity.z = move_toward(velocity.z, direction.z * speed, 24 * delta)
	if enabled and Input.is_action_just_pressed("jump") and is_on_floor() and not crouched:
		velocity.y = 6.2
		world.sound.one_shot("step", -20.0, 0.8)
	move_and_slide()
	if not was_grounded and is_on_floor():
		world.sound.one_shot("step", -14.0, 0.65)
	if is_on_floor() and axis.length() > 0.1 and Vector2(velocity.x, velocity.z).length() > 0.5:
		step_time -= delta
		if step_time <= 0:
			world.sound.one_shot("step", -24.0 if crouched else -16.0, randf_range(0.9, 1.1))
			step_time = 0.65 if crouched else (0.28 if speed > 4 else 0.46)
	else:
		step_time = 0
