extends Node
# Separate visual/animation activation while preserving chemistry, interactions and saved state.
var lab
var active_zone=""
var monitor_views=[]
var exterior_lights=[]
func initialize(world):
 lab=world
 for view in lab.polish.find_children("*","SubViewport",true,false):monitor_views.append(view)
 for light in lab.staff_exit.get_children():
  if light is DirectionalLight3D:exterior_lights.append(light)
 # Keep workstation illumination, but avoid six shadow-map faces per ceiling bulb.
 for light in lab.room.find_children("*","OmniLight3D",true,false):
  light.shadow_enabled=false
 for light in lab.find_children("*","Light3D",true,false):
  if light.name!="StableWorkerFill":light.light_cull_mask=light.light_cull_mask & ~256
 # Native distance culling also excludes distant small dressing from shadow passes.
 for mesh in lab.staff_exit.grounds.find_children("*","GeometryInstance3D",true,false):
  if mesh is MeshInstance3D and mesh.mesh!=null and mesh.visibility_range_end==0:
   var size=mesh.get_aabb().size*mesh.global_basis.get_scale().abs()
   var extent=maxf(size.x,maxf(size.y,size.z))
   if extent<20:
    mesh.visibility_range_end=55 if extent<2 else 160
    mesh.visibility_range_end_margin=8
 call_deferred("_process",0)
func _process(_dt):
 if lab==null:return
 var p=lab.player.global_position
 var apartment=lab.staff_exit.apartment.inside
 var workplace=not apartment and p.z> -36
 var zone="apartment" if apartment else "exit" if workplace and p.z< -22 else "workplace" if workplace else "outside"
 if zone==active_zone:return
 active_zone=zone
 # Keep the exterior ready before reaching the exit; views through apartment windows still work.
 var exterior_active=not workplace or p.z< -22
 var grounds=lab.staff_exit.grounds
 if exterior_active and grounds.get_parent()==null:lab.staff_exit.add_child(grounds)
 elif not exterior_active and grounds.get_parent()!=null:lab.staff_exit.remove_child(grounds)
 lab.staff_exit.grounds.visible=exterior_active
 lab.staff_exit.grounds.process_mode=Node.PROCESS_MODE_INHERIT if exterior_active else Node.PROCESS_MODE_DISABLED
 lab.staff_exit.grounds.birds.stream_paused=not exterior_active or lab.paused or lab.sound.muted
 lab.staff_exit.grounds.bird_chorus.stream_paused=not exterior_active or lab.paused or lab.sound.muted
 lab.staff_exit.apartment.visible=apartment
 lab.staff_exit.apartment.process_mode=Node.PROCESS_MODE_INHERIT if apartment else Node.PROCESS_MODE_DISABLED
 if not apartment:
  for view in lab.staff_exit.apartment.find_children("*","SubViewport",true,false):view.render_target_update_mode=SubViewport.UPDATE_DISABLED
 for light in exterior_lights:light.visible=not workplace or p.z< -22
 lab.room.visible=workplace
 lab.room.process_mode=Node.PROCESS_MODE_INHERIT if workplace else Node.PROCESS_MODE_DISABLED
 # Shared chemistry/rifle controllers stay active; only the remote room is suspended.
 for view in monitor_views:view.render_target_update_mode=SubViewport.UPDATE_ONCE if workplace else SubViewport.UPDATE_DISABLED
 print("ACTIVE AREA ",zone)

func _exit_tree():
 if lab!=null and is_instance_valid(lab.staff_exit) and is_instance_valid(lab.staff_exit.grounds):
  if lab.staff_exit.grounds.get_parent()==null:lab.staff_exit.grounds.free()
