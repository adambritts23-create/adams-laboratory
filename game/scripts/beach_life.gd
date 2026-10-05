extends "res://scripts/lab_props.gd"
var land
var actors=[]
var time=0.0
func build(l):
 land=l;name="BeachLife";init_materials();set_meta("dynamic",true)
 for i in 6:
  var a=shore_point(PI-.55+i*.18);var b=shore_point(PI-.55+i*.18+.14)
  person(a,"walk",i,b)
 for i in 3:person(Vector3(92+i*8,-48.94,-830-i*8),"swim",i+6,Vector3.ZERO)
 var camp=shore_point(PI+.30)
 cylinder(camp+Vector3.UP*.87,.42,.2,dark)
 for x in [-.27,.27]:tube(camp+Vector3(x,0,0),camp+Vector3(x,.83,0),.035,metal)
 for i in 7:tube(camp+Vector3(-.34+i*.11,.985,-.23),camp+Vector3(-.34+i*.11,.985,.23),.015,metal)
 for i in 3:ellipsoid(camp+Vector3(-.20+i*.18,1,.04),Vector3(.075,.04,.13),material(Color(.34,.12,.06)))
 person(camp+Vector3(0,0,-.85),"grill",3,Vector3.ZERO)
 person(camp+Vector3(-2.1,0,1),"talk",4,Vector3.ZERO)
 person(camp+Vector3(-3.4,0,1.2),"talk",5,Vector3.ZERO)
 # A single shared bench, with inner hands meeting between the seated pair.
 var seat=Node3D.new();add_child(seat);seat.position=shore_point(PI+.48);seat.rotation.y=2.65
 var first=get_child_count()
 box(Vector3(0,.48,0),Vector3(2.2,.09,.48),wood())
 box(Vector3(0,.90,-.24),Vector3(2.2,.5,.08),wood())
 for x in [-.9,.9]:box(Vector3(x,.23,0),Vector3(.08,.46,.48),metal)
 for n in get_children().slice(first):n.reparent(seat,false)
 for i in 2:
  var a=person(Vector3(-.37+i*.74,0,0),"sit",i+2,Vector3.ZERO);a.reparent(seat,false)
 ice_cream()
 for mesh in find_children("*","GeometryInstance3D",true,false):mesh.layers=2;mesh.visibility_range_end=130;mesh.cast_shadow=GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
func wood():return material(Color(.37,.23,.12),0,.85)
func ice_cream():
 var p=shore_point(PI-.12)
 var mint=material(Color(.36,.75,.63),.05,.55)
 box(p+Vector3.UP*.65,Vector3(2.3,1.15,1.1),mint,true)
 box(p+Vector3.UP*1.25,Vector3(2.55,.10,1.25),paper)
 for x in [-.85,.85]:
  var wheel=cylinder(p+Vector3(x,.25,.58),.25,.10,dark);wheel.rotation.x=PI/2
 for x in [-1.1,1.1]:tube(p+Vector3(x,1.2,-.45),p+Vector3(x,2.5,-.45),.035,metal)
 for i in 8:box(p+Vector3(-1.05+i*.30,2.5,0),Vector3(.30,.08,1.6),paper if i%2 else mint)
 label_at("GLASSKIOSKEN",p+Vector3(0,2.23,.57),32,Color(.95,.98,.85),.008)
 label_at("VANILJ · JORDGUBB · CHOKLAD",p+Vector3(0,.84,.57),22,Color(.06,.18,.13),.004)
 for i in 3:cylinder(p+Vector3(-.65+i*.65,1.32,0),.21,.06,metal)
 person(p+Vector3(0,0,-1),"grill",4,Vector3.ZERO)
 for i in 5:
  var q=p+Vector3(-1.7+i*.8,0,1.8+(i%2)*1.2)
  var visitor=person(q,"talk",i+1,Vector3.ZERO);visitor.rotation.y=PI
  var first=get_child_count()
  cylinder(Vector3(.27,1.03,.15),.055,.17,material(Color(.75,.49,.22)))
  ellipsoid(Vector3(.27,1.15,.15),Vector3(.085,.08,.085),material(Color(1,.61,.65) if i%2 else Color(.95,.88,.64)))
  for n in get_children().slice(first):n.reparent(visitor,false)
func limb(parent,p,length,color):
 var pivot=Node3D.new();parent.add_child(pivot);pivot.position=p
 var segment=cylinder(Vector3(0,-length*.5,0),.075,length,color);segment.reparent(pivot,false)
 return pivot
func person(p,mode,index,destination):
 var root=Node3D.new();add_child(root);root.position=p
 var skin=material(Color(.70,.46,.32) if index%2 else Color(.48,.29,.19),0,.9)
 var shirt=material([Color(.66,.055,.07),Color(.055,.15,.47),Color(.76,.65,.40),Color(.1,.25,.19)][index%4],0,.8)
 var jeans=material(Color(.055,.11,.23),0,.9)
 var first=get_child_count()
 ellipsoid(Vector3(0,1.14,0),Vector3(.23,.32,.14),shirt)
 cylinder(Vector3(0,1.45,0),.065,.12,skin)
 ellipsoid(Vector3(0,1.63,0),Vector3(.13,.18,.13),skin)
 ellipsoid(Vector3(0,1.74,-.02),Vector3(.14,.095,.13),material(Color(.12,.07,.035)))
 for x in [-.048,.048]:ellipsoid(Vector3(x,1.66,.117),Vector3(.018,.014,.012),dark)
 for n in get_children().slice(first):n.reparent(root,false)
 var arms=[];var legs=[]
 for side in [-1,1]:
  var arm=limb(root,Vector3(side*.24,1.32,0),.52,skin);arms.append(arm)
  var leg=limb(root,Vector3(side*.11,.87,0),.77,jeans);legs.append(leg)
 if mode=="sit":
  root.position.y-=.35
  for side in [-1,1]:
   var leg=legs[0 if side<0 else 1];leg.hide()
   var before=get_child_count()
   tube(Vector3(side*.11,.87,0),Vector3(side*.11,.87,.40),.085,jeans)
   tube(Vector3(side*.11,.87,.40),Vector3(side*.11,.40,.44),.075,jeans)
   for n in get_children().slice(before):n.reparent(root,false)
  var inner=arms[1 if index%2==0 else 0];inner.rotation.z=.45 if index%2==0 else -.45
  inner.rotation.x=-.32
  var hand=ellipsoid(Vector3(.37 if index%2==0 else -.37,.88,.16),Vector3(.075,.045,.055),skin);hand.reparent(root,false)
 if mode=="swim":root.rotation.x=-PI/2;root.position.y-=.06
 actors.append({"node":root,"mode":mode,"start":root.position,"end":destination,"arms":arms,"legs":legs,"phase":index*1.7})
 return root
func _process(dt):
 if land==null or land.route.lab.paused:return
 time+=dt
 var viewer=land.route.lab.player.global_position
 for a in actors:
  if a.node.global_position.distance_squared_to(viewer)>180*180:continue
  var phase=time+a.phase
  if a.has("path"):
   var path=a.path;var length=0.0
   for i in path.size()-1:length+=path[i].distance_to(path[i+1])
   var cycle=length*2+10;var travel=fposmod(time*.85+a.phase*3,cycle)
   var returning=travel>length+5
   var distance=clampf(cycle-5-travel if returning else travel,0,length)
   var moving=(travel<length or travel>length+5 and travel<cycle-5)
   for i in path.size()-1:
    var segment=path[i].distance_to(path[i+1])
    if distance<=segment or i==path.size()-2:
     a.node.position=path[i].lerp(path[i+1],clampf(distance/segment,0,1))
     var direction=path[i+1]-path[i];a.node.rotation.y=atan2(direction.x,direction.z)+(PI if returning else 0)
     break
    distance-=segment
   for i in 2:a.legs[i].rotation.x=sin(phase*4+i*PI)*.32 if moving else 0;a.arms[i].rotation.x=-sin(phase*4+i*PI)*.23 if moving else 0
  elif a.mode=="walk":
   var f=(sin(phase*.075)+1)*.5;a.node.position=a.start.lerp(a.end,f)
   a.node.rotation.y=atan2(a.end.x-a.start.x,a.end.z-a.start.z)+(PI if cos(phase*.075)<0 else 0)
   a.node.position.y=land.terrain_height(a.node.position.x,-a.node.position.z)
   for i in 2:a.legs[i].rotation.x=sin(phase*4+i*PI)*.32;a.arms[i].rotation.x=-sin(phase*4+i*PI)*.23
  elif a.mode=="swim":
   a.node.position.x=a.start.x+sin(phase*.12)*2.5;a.node.position.y=a.start.y+sin(phase*1.4)*.045
   for i in 2:a.arms[i].rotation.x=phase*1.8+i*PI;a.legs[i].rotation.x=sin(phase*3+i*PI)*.13
  elif a.mode=="grill":a.arms[1].rotation.x=-.65+sin(phase*.7)*.18
  elif a.mode=="talk":a.arms[0].rotation.x=-.20+sin(phase*.8)*.15

func shore_point(a:float)->Vector3:
 var shape=1.0+.06*sin(3*a)+.025*cos(5*a)
 var p=Vector3(133+cos(a)*59*1.12*shape,0,-810+sin(a)*125*1.12*shape)
 p.y=land.terrain_height(p.x,-p.z)+.04
 return p
