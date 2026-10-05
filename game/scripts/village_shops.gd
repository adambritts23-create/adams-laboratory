extends "res://scripts/lab_props.gd"
func build(land):
 name="VillageShops";init_materials()
 build_maxi(land)
 var plaza=preload("res://scripts/shopping_plaza.gd").new();add_child(plaza);plaza.build(land)
 for p in [Vector3(-19,-48,-877),Vector3(-19,-48,-897)]:
  land.cottage(p,9,10,Color(.55,.085,.045),2)
  var garden=land.get_node_or_null("VillageGardens")
  if garden!=null:garden.garden(p,9,10)
 var garden=land.get_node_or_null("VillageGardens")
 if garden!=null:garden.flush_batches()
 # Front courts face the lake access cross street; existing roads remain clear.
 for spec in [[Vector3(40,-48,-868),0,.7],[Vector3(43,-48,-867),1,-.8]]:
  var person=preload("res://scripts/town_resident.gd").new();add_child(person);person.position=spec[0];person.rotation.y=spec[2];person.build(spec[1])
 transform=preload("res://scripts/shopping_orientation.gd").transform()
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=2
func shop(p:Vector3,w:float,d:float,title:String,accent:Color,supermarket:bool,land):
 var wall=land.outdoor_material(Color(.65,.64,.59),3);var trim=material(accent,0,.7);var window=material(Color(.65,.79,.82,.10),.1,.2)
 box(p+Vector3(0,-.01,d*.5+4),Vector3(w+3,.06,8),concrete,true)
 # Hollow shop with full-depth interior, not a solid facade block.
 box(p+Vector3(0,-.06,0),Vector3(w,.12,d),paper,true)
 box(p+Vector3(0,2,-d*.5),Vector3(w,4,.18),wall,true)
 for x in [-w*.5,w*.5]:box(p+Vector3(x,2,0),Vector3(.18,4,d),wall,true)
 box(p+Vector3(0,.25,d*.5),Vector3(w,.5,.12),wall,true)
 box(p+Vector3(0,3.45,d*.5),Vector3(w,1.1,.12),wall,true)
 box(p+Vector3(0,3.92,0),Vector3(w,.12,d),paper)
 for x in [-w*.5,-w*.38,-w*.19,-.9,.9,w*.19,w*.38,w*.5]:
  box(p+Vector3(x,1.7,d*.5),Vector3(.075,2.4,.14),trim,true)
 for side in [-1,1]:
  box(p+Vector3(side*(w*.25+.45),1.7,d*.5+.035),Vector3(w*.5-.9,2.4,.025),window)
  # Invisible safety glazing collider; glass remains transparent.
  var barrier=StaticBody3D.new();add_child(barrier);barrier.position=p+Vector3(side*(w*.25+.45),1.5,d*.5)
  var collider=CollisionShape3D.new();var shape=BoxShape3D.new();shape.size=Vector3(w*.5-.9,3,.08);collider.shape=shape;barrier.add_child(collider)
 # Aisles leave a clear front browsing / checkout area.
 for aisle in [-1,0,1]:
  var q=p+Vector3(aisle*w*.25,0,-1)
  box(q+Vector3.UP*.12,Vector3(w*.18,.24,1.05),trim,true)
  for y in [.35,.85,1.35,1.85]:
   box(q+Vector3.UP*y,Vector3(w*.18,.055,1.05),paper)
   for k in 8:
    for side in [-1,1]:
     var tint=Color.from_hsv(fmod(k*.173+aisle*.27+1,1),.62,.76)
     box(q+Vector3(-w*.08+k*w*.022,y+.17,side*.31),Vector3(.22,.30,.24),material(tint,0,.8))
 for i in 2:
  var q=p+Vector3(-w*.28+i*2.4,.5,d*.5-2)
  box(q,Vector3(1.7,1,1.1),trim,true)
  box(q+Vector3.UP*.54,Vector3(1.8,.08,1.15),dark)
  box(q+Vector3(.55,.82,0),Vector3(.35,.32,.08),dark)
 for q in [Vector3(-w*.25,3.65,2),Vector3(w*.25,3.65,2),Vector3(0,3.65,-d*.3)]:
  box(p+q,Vector3(2.8,.06,.3),material(Color(.97,.96,.86),0,.8,1.4))
  var light=OmniLight3D.new();add_child(light);light.position=p+q-Vector3.UP*.15;light.light_color=Color(1,.93,.78);light.light_energy=2;light.omni_range=10;light.light_cull_mask=2;light.shadow_enabled=false
 for spec in [[Vector3(-w*.28,0,d*.5-3),1],[Vector3(w*.21,0,d*.5-2.5),2],[Vector3(.5,0,1.5),3]]:
  var person=preload("res://scripts/town_resident.gd").new();add_child(person);person.position=p+spec[0];person.build(spec[1]);person.rotation.y=.25 if spec[1]==1 else -.6

 box(p+Vector3(0,4.12,0),Vector3(w+.4,.24,d+.4),dark)
 box(p+Vector3(0,3.28,d*.5+1.0),Vector3(w+.2,.75,.15),trim)
 label_at(title,p+Vector3(0,3.3,d*.5+1.09),52,Color(.95,.93,.83),.014)
 box(p+Vector3(0,1.25,d*.5+.18),Vector3(.065,2.5,.12),trim)
 box(p+Vector3(0,1.3,d*.5+.26),Vector3(1.45,2.3,.03),window)
 tube(p+Vector3(.48,.95,d*.5+.30),p+Vector3(.48,1.5,d*.5+.30),.018,chrome_material())
 box(p+Vector3(0,2.91,d*.5+1.0),Vector3(w,.12,2),trim)
 label_at("ÖPPET  07–22" if supermarket else "KAFFE · FRUKT · TIDNINGAR",p+Vector3(0,2.67,d*.5+1.08),28,Color(.95,.95,.88),.005)
 for side in [-1,1]:
  var q=p+Vector3(side*(w*.5-1),.35,d*.5+1.7)
  box(q,Vector3(1.1,.7,.85),trim,true)
  ellipsoid(q+Vector3.UP*.55,Vector3(.62,.42,.48),material(Color(.08,.19,.035),0,.96))
 if supermarket:
  for i in 4:
   var q=p+Vector3(w*.5-2,.55,d*.5+3+i*.25)
   box(q,Vector3(.6,.35,.7),metal)
   for dx in [-.26,.26]:
    tube(q+Vector3(dx,-.3,-.3),q+Vector3(dx,.40,.4),.018,metal)
   tube(q+Vector3(-.3,.40,.4),q+Vector3(.3,.40,.4),.024,trim)
 else:
  box(p+Vector3(-3,.6,d*.5+2.2),Vector3(1,.95,.12),dark)
  label_at("DAGENS\nKAFFE\n25 kr",p+Vector3(-3,.68,d*.5+2.28),26,Color.WHITE,.006)
func chrome_material():return material(Color(.6,.64,.66),.75,.3)

func build_maxi(land):
 var p=Vector3(49,-48,-892);var red_sign=material(Color(.85,.02,.03),.05,.5,2)
 var wall=land.outdoor_material(Color(.62,.075,.045),3)
 box(p+Vector3(0,-.08,0),Vector3(52,.16,36),paper,true)
 box(p+Vector3(0,3.5,-18),Vector3(52,7,.2),wall,true)
 for x in [-26,26]:box(p+Vector3(x,3.5,0),Vector3(.2,7,36),wall,true)
 box(p+Vector3(0,7,0),Vector3(52,.2,36),paper,true)
 for x in [-14,14]:
  box(p+Vector3(x,2.1,18),Vector3(24,4.2,.04),material(Color(.55,.71,.75,.14)),true)
 box(p+Vector3(0,5.55,18),Vector3(52,2.9,.2),red_sign)
 var sign=label_at("ICA MAXI",p+Vector3(0,6.0,18.15),100,Color.WHITE,.045);sign.no_depth_test=false
 label_at("STORMARKNAD",p+Vector3(0,4.5,18.15),36,Color.WHITE,.02)
 box(p+Vector3(0,3.95,20),Vector3(16,.16,4),red_sign)
 box(p+Vector3(0,-.025,21),Vector3(54,.05,6),concrete,true)
 var product_mesh=BoxMesh.new();product_mesh.size=Vector3(.25,.34,.28)
 var placements=[];var colors=[]
 var categories=["FRUKT","GRÖNSAKER","BRÖD","KAFFE","PASTA","DRYCKER","MEJERI","SKAFFERI"]
 var rng=RandomNumberGenerator.new();rng.seed=454
 for aisle in 8:
  var x=-21+aisle*6
  for row in 3:
   var z=-12+row*7
   box(p+Vector3(x,1.0,z),Vector3(1.3,2,4.9),material(Color(.33,.36,.34)),true)
   for y in [.25,.75,1.25,1.75]:
    box(p+Vector3(x,y,z),Vector3(1.55,.06,5.2),paper)
    for side in [-1,1]:
     for k in 16:
      placements.append(Transform3D(Basis.IDENTITY,p+Vector3(x+side*.63,y+.20,z-2.3+k*.3)))
      colors.append(Color.from_hsv(fmod(aisle*.13+k*.03,1),.65,rng.randf_range(.6,.95)))
   var id="shop_grocery_"+str(aisle)
   box(p+Vector3(x,1.2,z+2.68),Vector3(1.3,.4,.05),dark,true,id,"Buy "+categories[aisle]+" · $20")
   label_at(categories[aisle]+" · $20",p+Vector3(x,2.65,z),26,Color.WHITE,.010)
 var mm=MultiMesh.new();mm.transform_format=MultiMesh.TRANSFORM_3D;mm.use_colors=true;mm.mesh=product_mesh;mm.instance_count=placements.size()
 for i in placements.size():mm.set_instance_transform(i,placements[i]);mm.set_instance_color(i,colors[i])
 var goods=MultiMeshInstance3D.new();goods.name="StockedShelves";add_child(goods);goods.multimesh=mm
 var product_mat=StandardMaterial3D.new();product_mat.vertex_color_use_as_albedo=true;product_mat.roughness=.8;goods.material_override=product_mat;goods.visibility_range_end=110;goods.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
 for x in [-18,-10,10,18]:
  box(p+Vector3(x,.55,12),Vector3(3.2,1.1,1.6),red_sign,true)
  box(p+Vector3(x,1.12,12),Vector3(3.3,.1,1.7),dark)
  box(p+Vector3(x+.9,1.45,12),Vector3(.5,.5,.12),metal)
  label_at("KASSA",p+Vector3(x,2.8,12),32,Color.WHITE,.013)
 for x in [-16,0,16]:
  for z in [-10,9]:
   box(p+Vector3(x,6.8,z),Vector3(10,.06,.7),material(Color(1,.97,.88),0,.8,1.5))
   var light=OmniLight3D.new();add_child(light);light.position=p+Vector3(x,5,z);light.light_energy=2;light.light_color=Color(1,.95,.86);light.omni_range=15;light.shadow_enabled=false;light.light_cull_mask=2
 var shoppers=preload("res://scripts/beach_life.gd").new();add_child(shoppers);shoppers.name="MaxiShoppers";shoppers.land=land;shoppers.init_materials();shoppers.set_meta("dynamic",true)
 for i in 5:
  var x=p.x-18+i*6
  shoppers.person(Vector3(x,-48,-905),"walk",i,Vector3(x,-48,-884))
 for mesh in shoppers.find_children("*","GeometryInstance3D",true,false):mesh.layers=2;mesh.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
