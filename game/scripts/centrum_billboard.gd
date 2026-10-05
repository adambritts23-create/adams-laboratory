extends "res://scripts/lab_props.gd"
var land
var timer=0.0
var headings=[]
var slogans=[]
var last_page=-1
func build(l):
 land=l;name="CentrumRoofDisplay";set_meta("dynamic",true);init_materials();position=Vector3(49,-28,-892);scale=Vector3(1.35,1.35,1.35)
 var gold=material(Color(.68,.47,.14),.65,.3)
 box(Vector3.ZERO,Vector3(27,5.4,20),dark)
 for y in [-2.8,2.8]:box(Vector3(0,y,0),Vector3(27.7,.22,20.7),gold)
 for x in [-13.65,13.65]:
  for z in [-10.25,10.25]:box(Vector3(x,0,z),Vector3(.22,5.8,.22),gold)
 for x in [-11,11]:
  for z in [-8,8]:box(Vector3(x,-4.8,z),Vector3(.3,4.8,.3),metal)
 for face in range(4):
  var angle=face*PI/2;var depth=13.61 if face%2 else 10.11
  var direction=Vector3(sin(angle),0,cos(angle))
  var title=label_at("ICA MAXI",direction*depth+Vector3.UP*1.15,90,Color(1,.22,.12),.040);title.rotation.y=angle;title.set_meta("face_width",18.0 if face%2 else 25.0);headings.append(title)
  var message=label_at("SUPER DEALS",direction*depth-Vector3.UP*1.10,56,Color(1,.87,.55),.028);message.rotation.y=angle;message.set_meta("face_width",18.0 if face%2 else 25.0);slogans.append(message)
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=2
func _process(dt):
 if land==null or land.route.lab.paused:return
 timer+=dt
 var page=int(timer/2.5)%4
 if page!=last_page:
  last_page=page
  for title in headings:title.text="ICA MAXI" if page==0 else "NORDIC WELLNESS";title.modulate=Color(1,.22,.12) if page==0 else Color(.38,1,.22)
  for message in slogans:message.text=["SUPER DEALS","STAY IN SHAPE","LEAN IS LAW","GET THOSE VEINS POPPING"][page]
 for label in headings+slogans:
  var font=ThemeDB.fallback_font
  var measured=font.get_string_size(label.text,HORIZONTAL_ALIGNMENT_LEFT,-1,label.font_size).x
  label.pixel_size=minf(float(label.get_meta("face_width"))/maxf(measured,1),(2.05 if label in headings else 1.25)/font.get_height(label.font_size))
  label.double_sided=false
 var lit=fmod(timer,1.8)<1.25
 for title in headings:title.visible=lit if page==0 else true
