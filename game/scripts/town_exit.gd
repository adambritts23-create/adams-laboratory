extends "res://scripts/lab_props.gd"
var land
static func corridor(x:float,s:float)->bool:
 return (x< -10 and x> -1090 and absf(s-765)<9) or (absf(x+155)<8 and s>700 and s<766) or (absf(x+155)<24 and absf(s-695)<25) or (x>6 and x<28 and s>798 and s<830)
static func terrain_blend(x:float,s:float)->float:
 var road=smoothstep(8,24,absf(s-765)) if x< -8 else 1.0
 var church=smoothstep(23,35,maxf(absf(x+155),absf(s-695)))
 var spur=smoothstep(7,15,absf(x+155)) if s>695 and s<765 else 1.0
 return minf(road,minf(church,spur))
func build(l):
 land=l;name="TownExit";init_materials()
 # Flush, continuous surfaces; terrain is graded to the same height before it is meshed.
 box(Vector3(-544,-48.045,-765),Vector3(1066,.10,12),land.asphalt,true).name="OutboundRoad"
 box(Vector3(-155,-48.045,-728),Vector3(10,.10,62),land.asphalt,true).name="ChurchTurn"
 for x in range(-22,-1070,-12):box(Vector3(x,-47.989,-765),Vector3(4,.008,.12),paper)
 for side in [-1,1]:box(Vector3(-544,-47.989,-765+side*5.6),Vector3(1066,.008,.12),paper)
 # Junction markings stop before the side road.
 for child in get_children():
  if child is Node3D and absf(child.position.x+155)<10 and absf(child.position.z+765)<.5:child.queue_free()
 box(Vector3(-1074,-48.035,-765),Vector3(26,.08,24),land.asphalt,true)
 plaque("KYRKA  →",Vector3(-133,-45.6,-773),Vector2(4,.75),PI/2)
 plaque("BJÖRKDAL
VÄLKOMMEN ÅTER",Vector3(-255,-45.5,-756),Vector2(5,1.1),PI/2)
 church();petrol_station();woodland();paving_transitions()
 for node in find_children("*","GeometryInstance3D",true,false):node.layers=2
func woodland():
 var rng=RandomNumberGenerator.new();rng.seed=5711
 var garden=land.get_node("VillageGardens")
 var distant=load("res://scripts/forest_expansion.gd").new();add_child(distant)
 for bx in range(-80,-1040,-40):
  for side in [-1,1]:
   var groups=[[],[],[]]
   for i in 30:
    var x=bx-rng.randf()*40;var s=765+side*rng.randf_range(12,43)
    if corridor(x,s):continue
    if x> -200 and s>779:continue # Existing homestead gardens.
    if x> -200 and s<750:continue # Church approach and existing houses.
    var y=land.terrain_height(x,s) if x>= -200 else land.ridge_height(-x,s)
    var kind=0 if i%15==0 else 2 if i%4==0 else 1
    groups[kind].append(Transform3D(Basis(Vector3.UP,rng.randf()*TAU).scaled(Vector3.ONE*rng.randf_range(.8,1.3)),Vector3(x,y,-s)))
   for kind in 3:
    for lod in 3:distant.batch(groups[kind],kind,lod,[0,24,65][lod],[24,65,320][lod])
   for i in 6:
    var x=bx-i*6;var s=765+side*9.5
    if corridor(x,s):continue
    garden.flower_patch(Vector3(x,-48,-s),.8,i)
 garden.flush_batches()
func petrol_station():
 var p=Vector3(18,-48,-814)
 box(p+Vector3(0,-.05,0),Vector3(17,.1,30),land.asphalt,true).name="PetrolForecourt"
 for station in [803,825]:box(Vector3(7.75,-48.04,-station),Vector3(3.5,.08,6),land.asphalt,true).name="PetrolAccess"
 var enamel=material(Color(.82,.09,.035),.25,.34)
 box(p+Vector3(0,4.8,0),Vector3(14,.48,18),enamel)
 box(p+Vector3(0,4.52,0),Vector3(13,.08,17),material(Color(.9,.89,.78),0,.4,.7))
 for x in [-6,6]:
  for z in [-7,7]:cylinder(p+Vector3(x,2.25,z),.16,4.5,metal)
 for x in [-3.5,3.5]:
  box(p+Vector3(x,.12,0),Vector3(2,.24,5),concrete,true)
  for z in [-1.4,1.4]:
   var q=p+Vector3(x,0,z)
   box(q+Vector3.UP*1.2,Vector3(.8,2.1,.55),paper,true)
   box(q+Vector3(0,1.55,.30),Vector3(.63,.48,.04),dark)
   label_at("95   DIESEL
000.00",q+Vector3(0,1.56,.335),24,Color(.3,1,.5),.003)
   box(q+Vector3(0,.64,.30),Vector3(.75,.72,.06),enamel)
   var last=q+Vector3(.47,1.8,0)
   for i in range(1,13):
    var t=i/12.0;var next=q+Vector3(.47+sin(t*PI)*.32,1.8-sin(t*PI)*1.2,0)
    tube(last,next,.028,rubber);last=next
   tube(q+Vector3(.48,1.5,0),q+Vector3(.48,1.8,0),.055,green)
 plaque("BJÖRKDAL BENSIN",p+Vector3(0,4.82,9.07),Vector2(12,.55),0)
 var q=p+Vector3(-7,0,0)
 box(q+Vector3.UP*2.8,Vector3(.4,5.6,.4),metal)
 plaque("BENSIN
95   18.49
DIESEL  18.99
ÖPPET",q+Vector3.UP*4.2,Vector2(3,2.6),0)
func church():
 var p=Vector3(-155,-48,-695)
 var church_start=get_child_count();var land_start=land.get_child_count()
 var brick=ShaderMaterial.new();brick.shader=preload("res://materials/church_brick.gdshader")
 var trim=material(Color(.73,.65,.49),0,.9);var copper=material(Color(.15,.22,.20),.45,.65)
 box(p+Vector3(0,-.04,3),Vector3(44,.08,48),concrete,true).name="ChurchForecourt"
 box(p+Vector3(0,6,-7),Vector3(16,12,28),brick,true)
 land.roof(p+Vector3(0,12,-7),17,29,6,copper)
 box(p+Vector3(0,13,12),Vector3(9,26,9),brick,true)
 for y in [1,17,22,25.5]:box(p+Vector3(0,y,12),Vector3(9.4,.30,9.4),trim)
 # Tall tiered clock tower and oxidised metal spire inspired by the reference.
 box(p+Vector3(0,28,12),Vector3(6.6,5,6.6),copper,true)
 cylinder(p+Vector3(0,37.5,12),4.8,15,copper,.06)
 tube(p+Vector3(0,45,12),p+Vector3(0,48,12),.075,brass)
 tube(p+Vector3(-.7,46.8,12),p+Vector3(.7,46.8,12),.055,brass)
 for side in [-1,1]:
  for z in [-18,-10,-2]:
   box(p+Vector3(side*8.05,7,z),Vector3(.10,5,1.9),trim)
   box(p+Vector3(side*8.12,7,z),Vector3(.05,4.6,1.55),material(Color(.18,.27,.32),.15,.3,.15))
   box(p+Vector3(side*8.16,7,z),Vector3(.04,4.6,.08),trim)
   box(p+Vector3(side*8.16,7,z),Vector3(.04,.08,1.55),trim)
 for face in 4:
  var root=Node3D.new();add_child(root);root.position=p+Vector3(0,20,12);root.rotation.y=face*PI/2
  var first=get_child_count()
  # Recessed belfry openings, paired lower slits and stone arch surrounds.
  for x in [-1.8,1.8]:
   box(Vector3(x,7.8,3.36),Vector3(1.2,2.8,.08),dark)
   for side in [-1,1]:box(Vector3(x+side*.68,7.8,3.43),Vector3(.14,2.9,.16),trim)
   for bar in 5:box(Vector3(x,6.7+bar*.45,3.44),Vector3(1.15,.09,.12),copper)
  for y in [-12,-7]:
   box(Vector3(0,y,4.57),Vector3(1.1,2.2,.06),trim)
   box(Vector3(0,y,4.63),Vector3(.75,1.9,.04),dark)
  for i in 11:box(Vector3(-4+i*.8,4.1,4.64),Vector3(.34,.48,.26),trim)
  var clock=cylinder(Vector3(0,0,4.58),1.72,.07,material(Color(.88,.77,.43),.1,.45,.65));clock.rotation.x=PI/2
  for i in 12:
   var a=i*TAU/12;var mark=box(Vector3(sin(a)*1.43,cos(a)*1.43,4.64),Vector3(.07,.22,.03),dark);mark.rotation.z=-a
  tube(Vector3(0,0,4.68),Vector3(-.7,.6,4.68),.045,dark)
  tube(Vector3(0,0,4.68),Vector3(.55,1.15,4.68),.032,dark)
  for node in get_children().slice(first):node.reparent(root,false)
 box(p+Vector3(0,2,16.56),Vector3(3.2,4,.15),dark)
 box(p+Vector3(0,1.8,16.66),Vector3(2.7,3.6,.08),material(Color(.22,.105,.035)))
 for x in [-1.6,1.6]:box(p+Vector3(x,2.2,16.7),Vector3(.22,4.4,.3),trim)
 plaque("BJÖRKDALS KYRKA",p+Vector3(0,4.7,16.8),Vector2(6,.6),0)
 for x in [-13,13]:
  for z in [13,-10]:
   var q=p+Vector3(x,0,z);cylinder(q+Vector3.UP*1.7,.055,3.4,metal)
   ellipsoid(q+Vector3.UP*3.5,Vector3(.20,.28,.20),material(Color(1,.75,.35),0,.35,1.2))

 # Rotate architecture, forecourt and collision together around the church centre.
 var pivot=Node3D.new();add_child(pivot);pivot.name="RotatedChurch";pivot.position=p
 for item in get_children().slice(church_start):
  if item!=pivot:item.reparent(pivot,true)
 for item in land.get_children().slice(land_start):item.reparent(pivot,true)
 pivot.rotation.y=PI/2
 for x in [-176,-130]:
  for station in [675,695,714]:park_lamp(Vector3(x,-48,-station))
func park_lamp(p:Vector3):
 var iron=material(Color(.035,.055,.045),.55,.4)
 cylinder(p+Vector3.UP*.15,.22,.3,iron)
 cylinder(p+Vector3.UP*1.7,.065,3.2,iron)
 for side in [-1,1]:
  tube(p+Vector3.UP*2.9,p+Vector3(side*.5,3.25,0),.04,iron)
  var q=p+Vector3(side*.5,3.2,0)
  box(q+Vector3.UP*.14,Vector3(.28,.42,.28),material(Color(1,.77,.39),0,.4,1.2))
  box(q+Vector3.UP*.39,Vector3(.39,.07,.39),iron)
  for dx in [-.15,.15]:
   for dz in [-.15,.15]:tube(q+Vector3(dx,-.1,dz),q+Vector3(dx,.37,dz),.018,iron)
 var light=OmniLight3D.new();add_child(light);light.position=p+Vector3.UP*3.2;light.light_color=Color(1,.76,.44);light.light_energy=1.5;light.omni_range=7;light.light_cull_mask=2;light.shadow_enabled=false
 light.distance_fade_enabled=true;light.distance_fade_begin=28;light.distance_fade_length=12

func bevel(a:Vector3,b:Vector3,outward:Vector3,mat:Material):
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 for i in maxi(1,int(a.distance_to(b)/2)):
  var count=maxi(1,int(a.distance_to(b)/2));var p=a.lerp(b,float(i)/count);var q=a.lerp(b,float(i+1)/count)
  var r=p+outward*.8;var t=q+outward*.8
  r.y=land.terrain_height(r.x,-r.z)+.002 if r.x>= -200 else land.ridge_height(-r.x,-r.z)+.002
  t.y=land.terrain_height(t.x,-t.z)+.002 if t.x>= -200 else land.ridge_height(-t.x,-t.z)+.002
  for tri in [[p,q,t],[p,t,r]]:
   if (tri[1]-tri[0]).cross(tri[2]-tri[0]).y>0:tri.reverse()
   for v in tri:st.add_vertex(v)
 st.generate_normals();var node=MeshInstance3D.new();add_child(node);node.mesh=st.commit();node.material_override=mat;node.layers=2;node.create_trimesh_collision()
func paving_transitions():
 for side in [-1,1]:
  # Leave the church junction open; no overlapping shoulder across its mouth.
  for span in [[-11,-149],[-161,-1061]]:
   bevel(Vector3(span[0],-47.995,-765+side*6),Vector3(span[1],-47.995,-765+side*6),Vector3(0,0,side),land.asphalt)
 for side in [-1,1]:
  bevel(Vector3(-155+side*5,-47.995,-759),Vector3(-155+side*5,-47.995,-719),Vector3(side,0,0),land.asphalt)
 # Shopping walkway: sloping edges into the lawn instead of a vertical lip.
 for span in [[865.0,916.5],[923.5,927.0]]:
  for side in [-1,1]:
   bevel(Vector3(14+side*3.5,-48,-span[0]),Vector3(14+side*3.5,-48,-span[1]),Vector3(side,0,0),concrete)
 for station in [675,855,920,1010,1100]:
  for side in [-1,1]:
   for bank in [-1,1]:
    if station>920 and side==1:continue
    bevel(Vector3(side*9,-48,-station+bank*3.5),Vector3(side*75,-48,-station+bank*3.5),Vector3(0,0,bank),land.asphalt)
