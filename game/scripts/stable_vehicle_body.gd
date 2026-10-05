extends CharacterBody3D
# Deterministic car motion; parked state never depends on sleeping wheel contacts.
var last_safe=Transform3D.IDENTITY
var initialized=false
var mass=1400.0
var engine_force=0.0
var longitudinal_speed=0.0
var brake=0.0
var steering=0.0
var freeze=true
var sleeping=false
var surface_up=Vector3.UP
var angular_velocity=Vector3.ZERO
var linear_velocity:Vector3:
 get:return velocity
 set(value):velocity=value;longitudinal_speed=value.dot(global_basis.z.slide(surface_up).normalized())
func _ready():
 floor_snap_length=.65;floor_max_angle=deg_to_rad(42);floor_stop_on_slope=false;floor_constant_speed=true
 platform_floor_layers=0;platform_wall_layers=0
func valid_state():return global_transform.is_finite() and velocity.is_finite()
func recover():
 global_transform=last_safe;velocity=Vector3.ZERO;engine_force=0;steering=0
func apply_central_force(force:Vector3):longitudinal_speed+=force.dot(global_basis.z.slide(surface_up).normalized())/mass*get_physics_process_delta_time()
func _physics_process(dt):
 if freeze:longitudinal_speed=0;return
 if not valid_state():recover();return
 var grounded=is_on_floor()
 var normal=get_floor_normal() if grounded else Vector3.UP
 surface_up=surface_up.lerp(normal,1.0-exp(-dt*8)).normalized()
 var forward=global_basis.z.slide(normal).normalized()
 var speed=longitudinal_speed
 # Gravity acts along the road, so coasting accelerates downhill and slows uphill.
 speed+=(engine_force/mass+Vector3(0,-9.81,0).dot(forward) if grounded else engine_force/mass)*dt
 speed=move_toward(speed,0,brake*.26*dt)
 rotation.y+=speed/2.7*tan(steering)*dt
 forward=global_basis.z.slide(normal).normalized()
 if grounded:
  velocity=forward*speed-normal*.15
 else:
  velocity.x=forward.x*speed;velocity.z=forward.z*speed;velocity.y-=9.81*dt
 longitudinal_speed=speed
 move_and_slide()
 if is_on_wall():longitudinal_speed=velocity.dot(forward)
 if is_on_floor():last_safe=global_transform
