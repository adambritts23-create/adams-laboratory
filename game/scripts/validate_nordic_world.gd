extends SceneTree
func _initialize():call_deferred("run")
func run():
 var world=load("res://scenes/lab_b.tscn").instantiate();root.add_child(world);current_scene=world
 for i in 25:await process_frame
 var count=0;var fallen=0;var lumps=0
 for node in world.find_children("*","Node3D",true,false):
  if node.has_meta("nordic_species"):
   count+=1
   assert(node.find_children("*","MeshInstance3D",true,false).size()==6)
  if node.get_script()==load("res://scripts/fallen_tree.gd"):fallen+=1
  if node.name=="SoftMossCarpets":lumps+=1
 print("NORDIC WORLD: trees=",count," fallen=",fallen," raised moss batches=",lumps)
 assert(count>400 and fallen>=1 and lumps==0)
 for kind in 3:
  var near_mesh=load("res://scripts/nordic_trees.gd").species(kind,1,0)[1]
  var far_mesh=load("res://scripts/nordic_trees.gd").species(kind,1,2)[1]
  assert(far_mesh.surface_get_array_len(0)<near_mesh.surface_get_array_len(0)/8)
 var expansion=world.find_child("ForestExpansion",true,false)
 var flowers=world.find_child("BotanicalTrial",true,false)
 assert(expansion!=null and expansion.roadside_count>500 and expansion.background_count>3000)
 assert(flowers!=null and flowers.plant_count==86)
 print("FOREST EXPANSION: roadside=",expansion.roadside_count," background=",expansion.background_count," trial plants=",flowers.plant_count)
 assert(expansion.home_forest_count>200)
 assert(world.staff_exit.apartment.inside)
 print("HOME FOREST trees=",expansion.home_forest_count," apartment start confirmed")
 print("NORDIC WORLD PASS")
 quit()
