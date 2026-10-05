extends Control
var speed:=0.0
var rpm:=850.0
const AMBER=Color(1.0,.39,.18)
const NEEDLE=Color(1.0,.16,.10)
func text_at(p:Vector2,s:String,font_size:int,color:Color):
 draw_string(ThemeDB.fallback_font,p,s,HORIZONTAL_ALIGNMENT_LEFT,-1,font_size,color)
func _draw():
 draw_rect(Rect2(Vector2.ZERO,size),Color(.016,.019,.022))
 dial(Vector2(185,255),157,8,rpm/1000,1,"x1000 r/min",false)
 dial(Vector2(505,241),216,240,speed,20,"km/h",true)
 small(Vector2(505,125),57,["-20","0","20"],.56,"30km/l")
 small(Vector2(595,246),57,["9","14","18"],.52,"V")
 small(Vector2(505,351),57,["C","","H"],.43,"TEMP")
 text_at(Vector2(365,242),"LEXUS",29,Color(.17,.19,.18))
 needle(Vector2(505,241),182,speed/240)
 draw_arc(Vector2(848,211),108,deg_to_rad(205),deg_to_rad(350),60,AMBER,2,true)
 for i in 17:
  var a=deg_to_rad(205+i*145.0/16);var v=Vector2(cos(a),sin(a));draw_line(Vector2(848,211)+v*107,Vector2(848,211)+v*(92 if i%4==0 else 99),AMBER,2,true)
 text_at(Vector2(737,155),"F",26,AMBER);text_at(Vector2(945,227),"E",26,AMBER)
 var angle=deg_to_rad(240);draw_line(Vector2(848,211),Vector2(848,211)+Vector2(cos(angle),sin(angle))*83,NEEDLE,6,true)
 draw_circle(Vector2(848,211),10,Color(.13,.15,.16))
 draw_style_box(lcd_style(),Rect2(760,286,198,43))
 text_at(Vector2(769,302),"TRIP A",13,Color(.22,.09,.025));text_at(Vector2(835,320),"183.3",26,Color(.24,.09,.025))
 text_at(Vector2(782,363),"SECURITY",15,Color(.26,.29,.30))
func lcd_style()->StyleBoxFlat:
 var s=StyleBoxFlat.new();s.bg_color=Color(.90,.32,.07);s.set_corner_radius_all(5);return s
func dial(c:Vector2,r:float,maximum:float,value:float,step:float,title:String,silver:bool):
 draw_circle(c,r+3,Color(.15,.17,.18));draw_circle(c,r,Color(.04,.045,.05))
 if silver:
  draw_circle(c,r*.76,Color(.63,.65,.61))
  for i in 180:
   var a=i*TAU/180;var d=Vector2(cos(a),sin(a));draw_line(c+d*(r*.76),c+d*(r*.79),Color(.80,.83,.81),1,true)
 var count=int(maximum/step)
 for i in count*5+1:
  var a=deg_to_rad(140+260.0*i/(count*5));var d=Vector2(cos(a),sin(a));var major=i%5==0
  draw_line(c+d*(r-9),c+d*(r-(25 if major else 17)),AMBER,3 if major else 1.5,true)
  if major:
   var label=str(int(i/5*step));var p=c+d*(r-42);text_at(p-Vector2(label.length()*6,-8),label,24,AMBER)
 if not silver:
  draw_arc(c,r-8,deg_to_rad(140+260*6.5/8),deg_to_rad(400),24,Color(.85,.1,.07),8,true)
  needle(c,r-45,value/maximum)
 text_at(c+Vector2(-48,r*.64),title,20,AMBER)
func small(c:Vector2,r:float,labels:Array,value:float,title:String):
 draw_circle(c,r+2,Color(.48,.51,.49));draw_circle(c,r,Color(.11,.13,.13))
 for i in 13:
  var a=deg_to_rad(140+i*260.0/12);var d=Vector2(cos(a),sin(a));draw_line(c+d*(r-4),c+d*(r-10),AMBER,1.5,true)
 for i in 3:
  var a=deg_to_rad(140+i*130);text_at(c+Vector2(cos(a),sin(a))*(r-19)-Vector2(9,-5),labels[i],13,AMBER)
 text_at(c+Vector2(-18,18),title,11,AMBER);needle(c,r-15,value)
func needle(c:Vector2,r:float,fraction:float):
 var a=deg_to_rad(140+260*clampf(fraction,0,1));var d=Vector2(cos(a),sin(a))
 draw_line(c-d*12,c+d*r,Color(.4,.04,.02),8,true);draw_line(c-d*10,c+d*r,NEEDLE,4,true)
 draw_circle(c,12,Color(.18,.20,.20));draw_circle(c,6,Color(.52,.56,.55))
