extends "res://scripts/lab_props.gd"
func _ready():call_deferred("batch_static")
func build(land):
 name="TownInfill";init_materials()
 var garden=land.get_node("VillageGardens")
 for spec in [Vector3(-34,3,-650),Vector3(34,4,-650),Vector3(-34,5,-705),Vector3(34,3,-705),Vector3(-34,4,-820),Vector3(34,5,-820)]:
  complex_at(Vector3(spec.x,-48,spec.z),int(spec.y),land,garden)
 garden.flush_batches()
 for spec in [Vector3(45,-48,-727),Vector3(-30,-48,-697)]:
  var flag=preload("res://scripts/swedish_flag.gd").new();add_child(flag);flag.position=spec;flag.scale=Vector3.ONE*(1.25 if spec.x>0 else 1.0);flag.build()
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=2
func complex_at(p:Vector3,floors:int,land,garden):
 var frontage=preload("res://scripts/street_entrance.gd").new();add_child(frontage);frontage.build(land,p,11,17,floors,false)
 var w=11.0;var d=17.0;var h=floors*2.9
 var plaster=material(Color(.76,.73,.65) if floors==3 else Color(.60,.66,.65) if floors==4 else Color(.73,.59,.46),0,.88)
 var white=material(Color(.83,.84,.79),0,.8);var window=material(Color(.12,.22,.27),.35,.22)
 box(p+Vector3(0,h*.5,0),Vector3(w,h,d),plaster,true)
 box(p+Vector3(0,.35,0),Vector3(w+.10,.7,d+.10),concrete)
 box(p+Vector3(0,h+.12,0),Vector3(w+.45,.24,d+.45),dark)
 for level in floors:
  var y=level*2.9+1.6
  for side in [-1,1]:
   for x in [-3.5,0,3.5]:
    if level==0 and x==0 and side==1:continue
    var q=p+Vector3(x,y,side*(d*.5+.025))
    box(q,Vector3(1.8,1.65,.09),white)
    box(q+Vector3(0,0,side*.06),Vector3(1.6,1.46,.03),window)
    box(q+Vector3(0,0,side*.09),Vector3(.045,1.48,.025),white)
    box(q+Vector3(0,-.85,side*.12),Vector3(1.95,.065,.30),metal)
    if level>0 and ((x==-3.5 and level%2==0) or (x==3.5 and level%2==1) or (x==0 and floors==5)):
     box(q+Vector3(0,-1.1,side*.60),Vector3(2.25,.14,1.35),white)
     for bar in range(9):box(q+Vector3(-1+bar*.25,-.62,side*1.20),Vector3(.035,.9,.035),metal)
     tube(q+Vector3(-1.12,-.15,side*1.2),q+Vector3(1.12,-.15,side*1.2),.035,metal)
   for z in [-5,0,5]:
    var q=p+Vector3(side*(w*.5+.02),y,z)
    box(q,Vector3(.08,1.65,1.55),white)
    box(q+Vector3(side*.055,0,0),Vector3(.025,1.43,1.34),window)
 box(p+Vector3(0,1.2,8.57),Vector3(1.5,2.4,.12),dark)
 box(p+Vector3(0,1.38,8.65),Vector3(1.28,1.88,.03),window)
 tube(p+Vector3(.5,.9,8.71),p+Vector3(.5,1.5,8.71),.018,metal)
 box(p+Vector3(0,2.65,9.05),Vector3(2.7,.12,1.4),metal)
 label_at("BJÖRKALLÉN "+str(floors*2+(1 if p.x<0 else 0)),p+Vector3(0,2.42,8.72),28,Color.WHITE,.004)
 box(p+Vector3(0,.025,11.5),Vector3(1.8,.05,6),concrete,true)
 for side in [-1,1]:
  for i in (4 if side<0 else 2):garden.bush(p+Vector3(side*(1.65+float(i%2)*.18),0,9.5+i*1.2),.55+float(i%3)*.08,i%2==0)
 garden.flower_patch(p+Vector3(-3.7,0,10.7),.8,floors)
 garden.flower_patch(p+Vector3(2,0,13.1),.6,floors+1)
 # Each forecourt has a bay and a parked sedan, separate from the entrance path.
 box(p+Vector3(4,.015,12),Vector3(2.7,.03,5.3),land.asphalt,true)
 var car=load("res://art/environment/exterior/is200.glb" if floors%2 else "res://art/environment/exterior/is250.glb").instantiate();add_child(car);car.position=p+Vector3(4,.04,12)
 for n in car.find_children("*","GeometryInstance3D",true,false):
  n.visibility_range_end=170;n.visibility_range_end_margin=20
  if n is MeshInstance3D:
   for k in n.mesh.get_surface_count():
    var m=n.mesh.surface_get_material(k)
    if m and "Window glass" in m.resource_name:
     m=m.duplicate();m.transparency=BaseMaterial3D.TRANSPARENCY_ALPHA;m.albedo_color=Color(.57,.67,.70,.30);m.cull_mode=BaseMaterial3D.CULL_DISABLED;n.set_surface_override_material(k,m)
 for side in [-1,1]:
  var plate=p+Vector3(4,.63 if side<0 else .5,12+side*(2.255 if floors%2 else 2.33))
  box(plate,Vector3(.52,.115,.015),paper)
  label_at("BJD "+str(410+floors*10+(1 if p.x<0 else 2)),plate+Vector3(0,0,side*.015),30,Color(.02,.025,.03),.0019).rotation.y=PI if side<0 else 0
 var obstacle=StaticBody3D.new();add_child(obstacle);obstacle.position=car.position+Vector3.UP*.72
 var collider=CollisionShape3D.new();var shape=BoxShape3D.new();shape.size=Vector3(1.75,1.4,4.4);collider.shape=shape;obstacle.add_child(collider)
