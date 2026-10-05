extends SceneTree
func _initialize():
 for id in ["sedan-sports","suv-luxury"]:
  var doc=GLTFDocument.new();var state=GLTFState.new()
  var err=doc.append_from_file("res://art/vehicles/kenney/"+id+".glb",state)
  if err!=OK:push_error("Car import failed: "+id);quit(1);return
  var scene=doc.generate_scene(state)
  var bounds=AABB();var first=true
  for mesh in scene.find_children("*","MeshInstance3D",true,false):
   var trans=mesh.transform;var p=mesh.get_parent()
   while p!=scene:trans=p.transform*trans;p=p.get_parent()
   var aabb=trans*mesh.get_aabb();bounds=aabb if first else bounds.merge(aabb);first=false
  var wrapper=Node3D.new();wrapper.name=id.replace("-","_");wrapper.add_child(scene);scene.owner=wrapper
  for n in scene.find_children("*","",true,false):n.owner=wrapper
  var factor=4.65/maxf(bounds.size.z,.01);scene.scale=Vector3.ONE*factor
  scene.position=Vector3(-(bounds.position.x+bounds.size.x*.5)*factor,-bounds.position.y*factor,-(bounds.position.z+bounds.size.z*.5)*factor)
  var packed=PackedScene.new();packed.pack(wrapper)
  if ResourceSaver.save(packed,"res://art/vehicles/kenney/"+id+".res")!=OK:quit(1);return
  print("Imported ",id," source bounds ",bounds," normalized scale ",factor)
  wrapper.free()
 quit()
