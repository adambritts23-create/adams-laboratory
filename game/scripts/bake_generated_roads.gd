extends SceneTree
const Landscape=preload("res://scripts/valley_landscape.gd")
func _initialize():call_deferred("run")
func run():
 var manager=RoadManager.new();manager.auto_refresh=false;root.add_child(manager)
 var container=RoadContainer.new();container.name="ForestRoadAuthoring";container._auto_refresh=false;container.density=1;container.render_layers=2;container.underside_thickness=-1;container.flatten_terrain=false;manager.add_child(container)
 var material=StandardMaterial3D.new();material.albedo_texture=load("res://art/environment/exterior/pbr/clean_asphalt_diff.jpg");material.roughness=.95;material.uv1_triplanar=true;material.uv1_world_triplanar=true;material.uv1_scale=Vector3.ONE*.32;container.material_resource=material
 var stations=[]
 for s in range(58,1170,16):stations.append(float(s))
 stations.append(1170.0)
 var directions:Array[RoadPoint.LaneDir]=[RoadPoint.LaneDir.REVERSE,RoadPoint.LaneDir.FORWARD]
 var lane_types:Array[RoadPoint.LaneType]=[RoadPoint.LaneType.NO_MARKING,RoadPoint.LaneType.NO_MARKING]
 var previous
 for i in stations.size():
  var s=stations[i];var point=RoadPoint.new();point.name="P"+str(i);point.auto_lanes=false;point.traffic_dir=directions;point.lanes=lane_types
  point.lane_width=6;point.shoulder_width_l=0;point.shoulder_width_r=0;point.gutter_profile=Vector2(.65,-.09);point.underside_thickness=-1;point.flatten_terrain=false;point.prior_mag=5.333;point.next_mag=5.333
  point.position=Vector3(Landscape.road_x(s),Landscape.road_height(s),-s)
  var forward=Vector3(Landscape.road_x(s+.1)-Landscape.road_x(s-.1),Landscape.road_height(s+.1)-Landscape.road_height(s-.1),-.2).normalized()
  point.basis=Basis.looking_at(-forward,Vector3.UP)
  container.add_child(point)
  if previous!=null:previous.connect_roadpoint(RoadPoint.PointInit.NEXT,point,RoadPoint.PointInit.PRIOR)
  previous=point
 container.rebuild_segments()
 for i in 4:await process_frame
 var baked=Node3D.new();root.add_child(baked);baked.name="GeneratedForestRoad"
 var count=0
 for source in container.find_children("*","MeshInstance3D",true,false):
  if source.mesh==null:continue
  var mesh=MeshInstance3D.new();baked.add_child(mesh);mesh.owner=baked;mesh.mesh=source.mesh;mesh.material_override=material;mesh.global_transform=source.global_transform;mesh.layers=2;mesh.create_trimesh_collision()
  for child in mesh.find_children("*","",true,false):child.owner=baked
  count+=1
 DirAccess.make_dir_recursive_absolute("res://art/environment/roads")
 var packed=PackedScene.new();packed.pack(baked);var err=ResourceSaver.save(packed,"res://art/environment/roads/forest_road.res")
 print("BAKED ROAD GENERATOR MESHES ",count," SAVE ",err)
 quit(0 if count>0 and err==OK else 1)
