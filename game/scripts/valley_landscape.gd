extends "res://scripts/lab_props.gd"
# Metre-scale road and terrain share the same elevation functions, including collision.
var route
var points:PackedVector3Array=[]
var asphalt:Material
var verge:Material
const END:=1020.0
static func lake_radius(x:float,s:float)->float:
 var q=Vector2((x-133.0)/59.0,(810.0-s)/125.0)
 var a=atan2(q.y,q.x)
 return q.length()/(1.0+.06*sin(3*a)+.025*cos(5*a))
static func lake_cut(x:float,s:float)->float:
 return 6.0*(1.0-smoothstep(.5,1.12,lake_radius(x,s)))
func outdoor_material(color:Color,kind:int)->Material:
 var id=["clean_asphalt","wood_planks_grey","clay_roof_tiles_02","white_plaster_rough_02"][kind]
 var m=StandardMaterial3D.new();var root="res://art/environment/exterior/pbr/"+id
 m.albedo_texture=load(root+"_diff.jpg");m.normal_texture=load(root+"_nor_gl.jpg");m.roughness_texture=load(root+"_rough.jpg")
 m.normal_enabled=true;m.normal_scale=.55;m.roughness=.9;m.metallic=.0
 m.albedo_color=Color(.72,.75,.77) if kind==0 else (Color(.42,.31,.25) if kind==2 else color)
 m.uv1_triplanar=true;m.uv1_world_triplanar=true;m.uv1_scale=Vector3.ONE*(.32 if kind==0 else .45)
 m.texture_filter=BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
 return m
static func road_height(s:float)->float:
 var t=clampf((s-110.0)/490.0,0,1)
 return -48.0*t*t*(3.0-2.0*t)
static func road_x(s:float)->float:
 var t=clampf((s-110.0)/490.0,0,1)
 return 26.0*sin(t*TAU)*sin(t*PI)
static func terrain_height(x:float,s:float)->float:
 var h=road_height(s)-.09
 var distance=absf(x-road_x(s))
 var blend=smoothstep(8.0,35.0,distance)
 var town_fade=1.0-smoothstep(535.0,610.0,s)
 var result=h-lake_cut(x,s)+town_relief(x,s)+blend*town_fade*(2.6*sin(x*.054+s*.032)+1.7*cos(x*.081-s*.027)+maxf(0,distance-45)*.085)
 for station in [460.0,510.0,555.0]:
  var centre=Vector2(road_x(station)+28,station)
  var separation=Vector2(x,s).distance_to(centre)
  result=lerpf(road_height(station)+.02,result,smoothstep(16,24,separation))
 result=lerpf(-48.12,result,preload("res://scripts/town_exit.gd").terrain_blend(x,s))
 return preload("res://scripts/medieval_layout.gd").elevation(x,s,result)
# Shallow meadow swales between developed areas; roads, housing pads and lake stay level.
static func town_relief(x:float,s:float)->float:
 var fade=smoothstep(600.0,640.0,s)*(1.0-smoothstep(1170.0,1230.0,s))
 var outside=smoothstep(72.0,97.0,absf(x))*(1.0-smoothstep(180.0,200.0,absf(x)))
 var shoreline=smoothstep(1.10,1.40,lake_radius(x,s))
 var protected=1.0
 for pad in [Vector2(-112,690),Vector2(-139,796),Vector2(-113,1080),Vector2(-62,960),Vector2(126,650),Vector2(173,662),Vector2(96,620)]:
  protected*=smoothstep(22.0, 40.0,Vector2(x,s).distance_to(pad))
 var crossings=1.0
 for road in [675,765,855,920,1010,1100]:crossings*=smoothstep(7.0,19.0,absf(s-road))
 var pocket=.35*(1.0-smoothstep(1.0,7.0,Vector2(x,s).distance_to(Vector2(33,831))))
 pocket+=.28*(1.0-smoothstep(1.0,6.0,Vector2(x,s).distance_to(Vector2(33,982))))
 return pocket+fade*outside*shoreline*protected*crossings*(.65*sin(x*.075+s*.035)+.40*cos(s*.06-x*.04))
func build(r):
 route=r;init_materials();name="DownhillRoadAndTown"
 asphalt=outdoor_material(Color.WHITE,0)
 verge=ShaderMaterial.new();verge.shader=preload("res://materials/outdoor_ground.gdshader")
 verge.set_shader_parameter("ground_albedo",load("res://art/environment/exterior/pbr/grass_ground_diff.jpg"))
 verge.set_shader_parameter("ground_normal",load("res://art/environment/exterior/pbr/grass_ground_nor_gl.jpg"))
 build_terrain();build_road();build_forest();build_industrial_neighbours();build_town();build_village_extension()
 var lamps=preload("res://scripts/road_lights.gd").new();add_child(lamps);lamps.build(self)
 var gardens=preload("res://scripts/village_gardens.gd").new();add_child(gardens);gardens.land=self;gardens.name="VillageGardens";gardens.init_materials()
 var reference=preload("res://scripts/reference_houses.gd")
 for station in [460.0,510.0,555.0]:
  var p=Vector3(road_x(station)+28,road_height(station)+.06,-station)
  var house=reference.new();add_child(house);house.build(self,p,-PI/2,"villa" if station==460 else "neighbour")
  road_segment(Vector3(road_x(station)+4.1,road_height(station)+.03,-station),p+Vector3(-12,.03,0),5.5)
 var shops=load("res://scripts/village_shops.gd").new();add_child(shops);shops.build(self)
 call_deferred("optimize_static_town")
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=8 if n.get_meta("lake_surface",false) else 2
func surface(st:SurfaceTool,mat:Material,collision:bool=true)->MeshInstance3D:
 st.generate_normals();var node=MeshInstance3D.new();node.mesh=st.commit();node.material_override=mat;add_child(node)
 if collision:node.create_trimesh_collision()
 return node
func tri(st:SurfaceTool,a:Vector3,b:Vector3,c:Vector3):
 for v in [a,b,c]:st.set_uv(Vector2(v.x,v.z)*.18);st.add_vertex(v)
func build_terrain():
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 # Continuous corridor preserves the complete commute and apartment frontage.
 for station in range(58,1034,8):
  for x in range(-88,88,8):
   var a=Vector3(x,terrain_height(x,station),-station)
   var b=Vector3(x+8,terrain_height(x+8,station),-station)
   var c=Vector3(x+8,terrain_height(x+8,station+8),-station-8)
   var d=Vector3(x,terrain_height(x,station+8),-station-8)
   tri(st,a,c,b);tri(st,a,d,c)
 st.index();surface(st,verge)
 for x in [-88,88]:
  var edge=box(Vector3(x,-10,-548),Vector3(.5,180,980),concrete,true);edge.hide()
 box(Vector3(0,-47.4,-1034),Vector3(176,1.4,.5),concrete,true)
func ridge_height(distance:float,s:float)->float:
 var edge=terrain_height(200,s)
 var t=smoothstep(200.0,440.0,distance)
 return lerpf(-48.12,lerpf(edge,-25+28*sin(s*.007)+16*sin(s*.018+distance*.009)+18*sin(distance*.006),t),smoothstep(8,38,absf(s-765)))
func road_segment(a:Vector3,b:Vector3,width:float):
 var side=(b-a).cross(Vector3.UP).normalized()*width*.5
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 tri(st,a-side,b+side,a+side);tri(st,a-side,b-side,b+side)
 surface(st,asphalt)
func build_road():
 # Prebaked with the MIT Road Generator: spline roadway, sloped shoulders and matching collision.
 add_child(preload("res://art/environment/roads/forest_road.res").instantiate())
 for s in range(58,int(END)+1,4):points.append(Vector3(road_x(s),road_height(s),-s))
 var markings=SurfaceTool.new();markings.begin(Mesh.PRIMITIVE_TRIANGLES)
 for i in points.size()-1:
  var a=points[i];var b=points[i+1]
  if absf(a.z+765)<15:continue
  var side=(b-a).cross(Vector3.UP).normalized()
  for offset in [-5.68,5.68,0.0]:
   if offset==0.0 and i%3!=0:continue
   var p=a+side*offset+Vector3.UP*.016;var q=b+side*offset+Vector3.UP*.016;var w=side*.055
   tri(markings,p-w,q+w,p+w);tri(markings,p-w,q-w,q+w)
  if i%4==0 and a.z< -145 and a.z> -575:
   for side_sign in [-1,1]:
    var post=a+side*side_sign*7.2
    box(post+Vector3.UP*.48,Vector3(.10,.95,.10),paper)
    box(post+Vector3.UP*.74,Vector3(.115,.16,.115),dark)
  if a.z< -210 and a.z> -435:
   var p=a+side*7.4;var q=b+side*7.4
   tube(p+Vector3.UP*.73,q+Vector3.UP*.73,.055,metal)
   box(p+Vector3.UP*.35,Vector3(.09,.7,.09),metal,true)
 # Concrete roadside limits only at the far map edges, and a town turning court.
 surface(markings,paper,false)
 box(Vector3(0,-48.04,-1176),Vector3(26,.08,18),asphalt,true)
 box(Vector3(0,-47.5,-1186),Vector3(28,1,.3),concrete,true)
 for x in [-1098,1098]:
  var boundary=box(Vector3(x,0,-775),Vector3(.3,400,1450),verge,true);boundary.hide()
 sign_at(105,"BJÖRKDAL  800 m\nFOREST ROAD",Color(.18,.36,.24))
 sign_at(200,"BJÖRKDAL\nVALLEY VIEW",Color(.17,.31,.40))
 sign_at(590,"BJÖRKDAL\n30",Color(.65,.67,.58))
 # Small overlook beside the forest, with a clear view of lower town.
 var p=Vector3(road_x(260)+13,road_height(260),-260)
 box(p-Vector3.UP*.15,Vector3(10,.3,14),concrete,true)
 plaque("BJÖRKDAL / VALLEY OVERLOOK",p+Vector3(0,1.6,-6),Vector2(4,.45),0)
func sign_at(s:float,text:String,color:Color):
 var p=Vector3(road_x(s)+8.4,road_height(s),-s)
 cylinder(p+Vector3.UP*1.3,.05,2.6,metal)
 box(p+Vector3.UP*2.4,Vector3(3,.9,.07),material(color,0,.7))
 label_at(text,p+Vector3(0,2.4,.05),34,Color.WHITE,.004)
func tree_at(_scene:PackedScene,p:Vector3,size_value:float,angle:float)->Node3D:
 var tree=preload("res://scripts/residential_tree.gd").new()
 tree.species_kind=1 if absi(int(p.x*13+p.z*7))%3 else 2
 tree.crown_scale=1.0
 tree.position=p;tree.scale=Vector3.ONE*size_value;tree.rotation.y=angle;add_child(tree)
 return tree
func build_forest():
 var scene=null
 var rng=RandomNumberGenerator.new();rng.seed=1081
 for i in 120:
  var s=rng.randf_range(100,590);var x=rng.randf_range(-75,75)
  var d=absf(x-road_x(s))
  if d<10:continue
  if s<175 and absf(x)<80:continue
  var plot=false
  for station in [460.0,510.0,555.0]:
   if Vector2(x,s).distance_to(Vector2(road_x(station)+28,station))<23:plot=true
  if plot:continue
  # Keep the downhill sightline and overlook open; denser forest on the shoulders.
  tree_at(scene,Vector3(x,terrain_height(x,s),-s),rng.randf_range(.72,1.55),rng.randf_range(0,TAU))
 # Town garden trees, with gaps around the streets and roofs.
 for i in 22:
  var x:float=(-1 if i%2 else 1)*rng.randf_range(72,95);var s=rng.randf_range(640,880)
  if lake_radius(x,s)<1.18 or preload("res://scripts/land_use.gd").shopping(x,s):continue
  tree_at(scene,Vector3(x,-48.08,-s),rng.randf_range(.7,1.05),rng.randf_range(0,TAU))
func build_industrial_neighbours():
 for spec in [[Vector3(36,0,-85),Vector3(22,8,18),"WORKSHOP / 02"],[Vector3(-39,road_height(139),-139),Vector3(28,11,22),"LOGISTICS / 03"],[Vector3(53,road_height(176),-176),Vector3(24,9,28),"ENERGY CENTRE / 04"]]:
  var p:Vector3=spec[0];var d:Vector3=spec[1]
  box(p-Vector3.UP*.5,Vector3(d.x+9,1,d.z+9),concrete,true)
  box(p+Vector3.UP*d.y*.5,d,outdoor_material(Color(.25,.31,.29),3),true)
  box(p+Vector3.UP*(d.y+.14),Vector3(d.x+.6,.28,d.z+.6),metal)
  for x in range(-int(d.x*.5)+1,int(d.x*.5),2):
   box(p+Vector3(x,d.y*.5,d.z*.5+.02),Vector3(.045,d.y,.04),metal)
  for x in [-d.x*.27,d.x*.27]:
   box(p+Vector3(x,2.5,d.z*.5+.05),Vector3(5,5,.08),dark)
   for y in range(1,5):box(p+Vector3(x,y,d.z*.5+.10),Vector3(4.9,.025,.02),metal)
  plaque(spec[2],p+Vector3(0,d.y-1,d.z*.5+.12),Vector2(10,.7),0)
  for x in [-4,4]:cylinder(p+Vector3(x,d.y+1.2,0),.6,2.4,metal)
func roof(p:Vector3,w:float,depth:float,rise:float,mat:Material):
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 var a=p+Vector3(-w*.5,0,depth*.5);var b=p+Vector3(w*.5,0,depth*.5);var c=p+Vector3(0,rise,depth*.5)
 var d=p+Vector3(-w*.5,0,-depth*.5);var e=p+Vector3(w*.5,0,-depth*.5);var f=p+Vector3(0,rise,-depth*.5)
 tri(st,a,c,b);tri(st,d,e,f);tri(st,a,d,f);tri(st,a,f,c);tri(st,b,c,f);tri(st,b,f,e)
 surface(st,mat,false)
func cottage(p:Vector3,width:float,depth:float,col:Color,storeys:int=1):
 var h:float=3.1*storeys
 var wall=outdoor_material(col*.90,3);var tile=outdoor_material(Color(.24,.095,.055),2)
 box(p+Vector3.UP*h*.5,Vector3(width,h,depth),wall,true)
 roof(p+Vector3.UP*h,width+.7,depth+.7,1.9,tile)
 # Timber corners, window crossbars, doors, gutters and masonry chimney.
 for x in [-width*.5+.08,width*.5-.08]:
  for z in [-depth*.5-.02,depth*.5+.02]:box(p+Vector3(x,h*.5,z),Vector3(.15,h,.10),paper)
 for z in [-depth*.5-.07,depth*.5+.07]:
  for floor_index in storeys:
   for x in [-width*.29,width*.29]:
    var q=p+Vector3(x,1.85+floor_index*3.1,z)
    box(q,Vector3(1.4,1.65,.08),paper)
    box(q+Vector3(0,0,.05*signf(z)),Vector3(1.18,1.42,.035),material(Color(.10,.17,.20),.45,.16))
    box(q+Vector3(0,0,.08*signf(z)),Vector3(.055,1.45,.04),paper)
    box(q+Vector3(0,0,.08*signf(z)),Vector3(1.19,.06,.04),paper)
    box(q+Vector3(0,-.85,.12*signf(z)),Vector3(1.58,.085,.30),paper)
  tube(p+Vector3(-width*.5,h,z),p+Vector3(width*.5,h,z),.065,metal)
 box(p+Vector3(0,1.12,depth*.5+.10),Vector3(.95,2.24,.12),material(Color(.16,.24,.19),0,.65))
 box(p+Vector3(0,.12,depth*.5+.5),Vector3(1.5,.24,1),concrete,true)
 box(p+Vector3(0,2.45,depth*.5+.46),Vector3(1.65,.10,.9),tile)
 for side in [-1,1]:
  tube(p+Vector3(side*(width*.5-.08),h,-depth*.5-.12),p+Vector3(side*(width*.5-.08),.2,-depth*.5-.12),.045,metal)
 box(p+Vector3(width*.23,h+1.4,0),Vector3(.65,2,.65),concrete)
 var frontage=preload("res://scripts/street_entrance.gd").new();add_child(frontage);frontage.build(self,p,width,depth,storeys)
func build_town():
 var stone=aged(Color(.42,.43,.39),Color(.24,.26,.22),0,2)
 build_sidewalks(597,897,[675,765,855],stone)
 for s in [675,765,855]:
  for side in [-1,1]:
   if s==765 and side==-1:continue # New outbound road owns the west arm.
   if s==855 and side==1:box(Vector3(15,-48.04,-s),Vector3(18,.08,7),asphalt,true)
   else:box(Vector3(side*40.5,-48.04,-s),Vector3(69,.08,7),asphalt,true)
 var colors=[Color(.56,.12,.075),Color(1,.83,.32),Color(.57,.82,1),Color(.38,.80,.66),Color(.98,.62,.69)]
 for i in 8:
  var s:float=620+i*31
  for side in [-1,1]:
   if s>735 and s<810 and side==1:continue
   var p=Vector3(-28,-48,-790) if side==-1 and s==775 else Vector3(side*18,-48,-s)
   cottage(p,9,12,colors[(i+(1 if side<0 else 0))%5],2 if i%3==0 else 1)
   for dz in [-9,9]:
    box(p+Vector3(side*7,.55,dz),Vector3(.1,1.1,4),paper)
   if i%2==0:
    var lamp=cylinder(Vector3(side*6,-45.7,-s),.065,4.6,metal)
    box(Vector3(side*6,-43.4,-s),Vector3(.65,.09,.4),dark)
 for i in 6:
  for side in [-1,1]:
   var home=Vector3(85,-48,-967) if side==1 and i==5 else Vector3(side*49,-48,-630-i*40)
   cottage(home,11,13,colors[(i+2)%5])
 # Market square, cafe and town hall form a visible destination down the slope.
 box(Vector3(31,-48.02,-753),Vector3(42,.16,48),stone,true)
 cottage(Vector3(52,-48,-748),15,19,Color(.78,.72,.55),2)
 plaque("BJÖRKDAL\nTOWN HALL",Vector3(44.25,-43.5,-748),Vector2(6,1),-PI/2)
 cottage(Vector3(22,-48,-788),11,12,Color(.63,.25,.15),2)
 plaque("CAFÉ / BAGERI",Vector3(22,-44.8,-781.8),Vector2(7,.55),0)
 var civic=preload("res://scripts/civic_square.gd").new();add_child(civic);civic.build(self)
 plaque("BJÖRKDAL",Vector3(0,-44.7,-609),Vector2(5,.8),0)

func build_village_extension():
 # An extra residential quarter beyond the original square; the old downhill drive stays intact.
 build_sidewalks(897,1020,[920,1010],concrete)
 for s in [920,1010]:
  box(Vector3(-40.5,-48.025,-s),Vector3(69,.05,7),asphalt,true)
  if s==920:box(Vector3(18,-48.025,-s),Vector3(24,.05,7),asphalt,true)
 # Road-facing shopping forecourt: north driveway joins the existing side street.
 box(Vector3(14,-48.025,-864),Vector3(16,.05,6),asphalt,true)
 var colors=[Color(.52,.065,.035),Color(.59,.085,.04),Color(.49,.59,.54)]
 var plots=preload("res://scripts/medieval_layout.gd").modern_plots()
 for i in plots.size():
  if plots[i].z < -1010 or absf(plots[i].x)>75:continue
  var first=get_child_count();cottage(plots[i],10,13,colors[i%3],2 if i%3==0 else 1)
  if i%3!=2:
   var falu=ShaderMaterial.new();falu.shader=preload("res://materials/falu_timber.gdshader");falu.set_shader_parameter("wood_image",load("res://art/environment/exterior/pbr/wood_planks_grey_diff.jpg"))
   for child in get_child(first).get_children():
    if child is MeshInstance3D:child.material_override=falu
 # Compact blocks retain real connecting lanes and front-door access.
 for x in [-31,-53]:box(Vector3(x,-48.03,-1092),Vector3(4,.06,155),asphalt,true)
 # Road runs beside the east-facing facade and joins the village cross streets.
 box(Vector3(-43,-48.025,-965),Vector3(8,.05,100),asphalt,true)
 box(Vector3(-49,-48.025,-965),Vector3(4,.05,100),concrete,true)
 var home=load("res://scripts/home_exterior.gd").new();add_child(home);home.build(route)
 var home_flag=preload("res://scripts/swedish_flag.gd").new();add_child(home_flag);home_flag.position=Vector3(-52,-48,-987);home_flag.scale=Vector3.ONE*.85;home_flag.build()
 for i in 0:
  var tree=preload("res://scripts/residential_tree.gd").new();add_child(tree)
  tree.position=Vector3(-92 if i%2 else -80,-48,-1030-(i/2)*23);tree.scale=Vector3.ONE*(.85+(i%3)*.13)
 plaque("SEVALLAGATAN 5C  ←",Vector3(-6,-45.8,-1015),Vector2(5,.55),0)

func build_sidewalks(start:float,end:float,crossings:Array,mat:Material):
 # Flush walking surface and sloped grass transitions replace vertical slab edges.
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 for side in [-1,1]:
  var z=start
  while z<end:
   var next=minf(z+.5,end)
   var junction=false
   for cross in crossings:
    if z<float(cross)+3.5 and next>float(cross)-3.5:junction=true
   if side>0 and ((z<806 and next>800) or (z<828 and next>822)):junction=true
   if junction or absf(z-765)<13:z=next;continue
   for band in 3:
    var xs=[6.0,6.35,7.85,8.65]
    var corners=[]
    for spec in [[band,z],[band+1,z],[band+1,next],[band,next]]:
     var index=int(spec[0]);var station=float(spec[1]);var x=float(xs[index])*side
     var fade=minf(clampf((station-start)/1.5,0,1),clampf((end-station)/1.5,0,1))
     for cross in crossings:fade=minf(fade,smoothstep(3.5,5.5,absf(station-float(cross))))
     var y=lerpf(-48.0,-47.975,fade) if index<3 else terrain_height(x,station)+.012
     corners.append(Vector3(x,y,-station))
    if side>0:tri(st,corners[0],corners[2],corners[1]);tri(st,corners[0],corners[3],corners[2])
    else:tri(st,corners[0],corners[1],corners[2]);tri(st,corners[0],corners[2],corners[3])
   z=next
 surface(st,mat,true)

func build_woodland_clusters():
 var rng=RandomNumberGenerator.new();rng.seed=59371
 var pine_scene=null
 # Distinct groves with dense cores and irregular, open edges, including behind 5C.
 for grove in [Vector3(-155,30,925),Vector3(-151,28,1140),Vector3(146,34,1070),Vector3(-143,24,620)]:
  # Sparse deadwood in remote groves; the trail patch already has its own trunk.
  if grove.z>1000 or grove.z<800:
   var fallen=preload("res://scripts/fallen_tree.gd").new();add_child(fallen)
   fallen.position=Vector3(grove.x-4,terrain_height(grove.x-4,grove.z)+.30,-grove.z)
   fallen.rotation.y=.35
  var planted:Array[Vector2]=[]
  for attempt in 180:
   var angle=rng.randf()*TAU;var radius=sqrt(rng.randf())*grove.y
   var x=grove.x+cos(angle)*radius;var s=grove.z+sin(angle)*radius
   var point=Vector2(x,s);var clear=true
   for other in planted:
    if point.distance_to(other)<3.5:clear=false;break
   if not clear or lake_radius(x,s)<1.20:continue
   planted.append(point)
   var p=Vector3(x,terrain_height(x,s),-s)
   if attempt%4==0:
    var tree=preload("res://scripts/residential_tree.gd").new();add_child(tree);tree.position=p;tree.scale=Vector3.ONE*rng.randf_range(.85,1.35);tree.rotation.y=angle
   else:tree_at(pine_scene,p,rng.randf_range(.85,1.35),angle)

func build_reference_houses():
 var scene=preload("res://scripts/reference_houses.gd")
 for station in [460.0,510.0,555.0]:
  var p=Vector3(road_x(station)+28,road_height(station)+.06,-station)
  var house=scene.new();add_child(house);house.build(self,p,-PI/2,"villa" if station==460 else "neighbour")
  # Smooth approach from the roadside to the level forecourt; never obstruct the lane.
  var a=Vector3(road_x(station)+4.1,road_height(station)+.03,-station)
  var b=p+Vector3(-12,.03,0)
  road_segment(a,b,5.5)
 for spec in [[Vector3(126,-48,-650),"summer"],[Vector3(173,-48,-662),"red"],[Vector3(96,-48,-620),"red"]]:
  var house=scene.new();add_child(house);house.build(self,spec[0],PI,spec[1])
 var gardens=get_node("VillageGardens")
 gardens.harbre(Vector3(151,-48,-625))
 gardens.flush_batches()

static func reference_plot(x:float,s:float)->bool:
 if x>10 and x<100 and s>935 and s<1180:return true
 for plot in [Vector2(126,650),Vector2(173,662),Vector2(96,620)]:
  if Vector2(x,s).distance_to(plot)<(35 if plot.x==126 else 24):return true
 for station in [460.0,510.0,555.0]:
  if Vector2(x,s).distance_to(Vector2(road_x(station)+28,station))<17:return true
 return false


func optimize_static_town():
 # Tiny facade and garden details do not need to draw from across town.
 for item in get_tree().get_nodes_in_group("static_dressing"):
  if not is_ancestor_of(item) or item.is_queued_for_deletion():continue
  var dynamic=false;var parent=item
  while parent!=self:
   if parent.has_meta("dynamic"):dynamic=true;break
   parent=parent.get_parent()
  if dynamic:continue
  var extent=(item.get_aabb().size*item.global_basis.get_scale().abs()).length()
  var limit=65.0 if extent<.7 else 120.0 if extent<3 else 220.0 if extent<8 else 0.0
  if limit>0 and (item.visibility_range_end==0 or item.visibility_range_end>limit):item.visibility_range_end=limit
 set_meta("batch_cell_size",16)
 batch_static()
