extends SceneTree
class Route extends Node3D:
 var home_entry=Vector3.ZERO
 var grounds=Node3D.new()
 var lab={}
func _initialize():call_deferred("run")
func run():
 var route=Route.new();root.add_child(route);route.add_child(route.grounds)
 var display=load("res://scripts/export_display.gd").new();route.add_child(display);display.init_materials();route.lab={"expansion":display}
 var a=load("res://scripts/apartment_5c.gd").new();a.process_mode=Node.PROCESS_MODE_DISABLED;route.add_child(a);a.build(route);a.position=Vector3.ZERO
 var flat=Node3D.new();flat.name="OriginalApartment5C";root.add_child(flat)
 var collisions=[];var lamps=[];var count=0
 for n in a.find_children("*","Node3D",true,false):
  if n.get_parent().get_meta("interaction","")=="home_leave":continue
  if n is MeshInstance3D and n.mesh!=null:
   var m=MeshInstance3D.new();m.mesh=n.mesh;m.transform=n.global_transform;m.name="ApartmentPart"+str(count);count+=1
   var material=n.material_override
   if material is ShaderMaterial:
    var shader_path=material.shader.resource_path
    var replacement=StandardMaterial3D.new()
    if "mirror" in shader_path:
     replacement.albedo_color=Color(.78,.83,.82);replacement.metallic=1;replacement.roughness=.06;m.name="Mirror"+str(count)
    else:
     replacement.albedo_color=Color(.70,.84,.86,.08);replacement.transparency=BaseMaterial3D.TRANSPARENCY_ALPHA;replacement.roughness=.12;replacement.cull_mode=BaseMaterial3D.CULL_DISABLED
    material=replacement
   m.material_override=material;flat.add_child(m)
  elif n is CollisionShape3D and n.shape is BoxShape3D:
   var tr=n.global_transform;var size=n.shape.size
   if tr.origin.y+size.y*.5<.15 or tr.origin.y-size.y*.5>1.8:continue
   collisions.append({"position":[tr.origin.x,tr.origin.y,tr.origin.z],"size":[size.x,size.y,size.z],"yaw":tr.basis.get_euler().y})
  elif n is OmniLight3D:
   var p=n.global_position;var c=n.light_color
   lamps.append({"position":[p.x,p.y,p.z],"color":[c.r,c.g,c.b],"energy":n.light_energy,"range":n.omni_range})
 var gltf=GLTFDocument.new();var state=GLTFState.new();var err=gltf.append_from_scene(flat,state)
 if err==OK:err=gltf.write_to_filesystem(state,"res://apartment.glb")
 var f=FileAccess.open("res://apartment.json",FileAccess.WRITE);f.store_string(JSON.stringify({"colliders":collisions,"lights":lamps,"meshCount":count}));f.close()
 print("APARTMENT_EXPORT ",err," meshes ",count," colliders ",collisions.size());quit(err)
