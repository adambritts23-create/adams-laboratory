extends "res://scripts/is200_instruments.gd"
# Two white-lit dials and centre multi-information display of the second-generation IS.
func _draw():
 draw_rect(Rect2(Vector2.ZERO,size),Color(.012,.015,.018))
 gauge(Vector2(260,245),205,8,rpm/1000,1,"x1000 r/min")
 gauge(Vector2(740,245),205,260,speed,20,"km/h")
 draw_rect(Rect2(449,140,102,194),Color(.028,.055,.066))
 text_at(Vector2(465,171),"LEXUS",20,Color(.84,.92,.96))
 text_at(Vector2(483,230),"D",40,Color(.86,.95,1))
 text_at(Vector2(466,266),"OUTSIDE",12,Color(.7,.8,.85))
 text_at(Vector2(476,291),"18 °C",18,Color(.85,.94,1))
 text_at(Vector2(460,323),"HWN 279",17,Color(.75,.85,.9))
func gauge(c:Vector2,r:float,maximum:float,value:float,step:float,title:String):
 draw_circle(c,r+5,Color(.38,.42,.45));draw_circle(c,r,Color(.018,.025,.03))
 var white=Color(.83,.92,1)
 var count=int(maximum/step)
 for i in count*5+1:
  var a=deg_to_rad(140+260.0*i/(count*5));var d=Vector2(cos(a),sin(a));var major=i%5==0
  var color=Color(1,.22,.16) if maximum==8 and i>=33 else white
  draw_line(c+d*(r-10),c+d*(r-(27 if major else 18)),color,3 if major else 1.3,true)
  if major:
   var label=str(int(i/5*step));text_at(c+d*(r-48)-Vector2(label.length()*7,-9),label,27,white)
 text_at(c+Vector2(-60,88),title,20,white)
 needle(c,r-62,value/maximum)
