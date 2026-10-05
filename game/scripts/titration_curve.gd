extends Control
signal selected(index: int)
var points: Array=[]
var index:=0
var diagram: Dictionary={}
var legend_offset:=0
const Multi=preload("res://scripts/multi_series_plot.gd")
func set_progress(_t: float,_running: bool) -> void:pass
func set_data(data: Array,chosen: int) -> void:
	points=data;index=chosen;queue_redraw()
func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index in [MOUSE_BUTTON_WHEEL_UP,MOUSE_BUTTON_WHEEL_DOWN]:
		legend_offset=maxi(0,legend_offset+(1 if event.button_index==MOUSE_BUTTON_WHEEL_DOWN else -1));queue_redraw();return
	if event is InputEventMouseButton and event.pressed and event.button_index==MOUSE_BUTTON_LEFT and not points.is_empty():
		var a:=Multi.area(size)
		var dose:=clampf((event.position.x-a.position.x)/a.size.x,0,1)*float(points[-1].x)
		var best:=0
		for i in points.size():
			if absf(float(points[i].x)-dose)<absf(float(points[best].x)-dose):best=i
		selected.emit(best)
func _draw() -> void:
	if not diagram.has("all_series") and not points.is_empty():
		Multi.draw_chart(self,points.map(func(p):return p.x),[diagram.get("series",{"name":"pH","values":points.map(func(p):return p.y)})],index,diagram.get("label","pH"),"Titrant volume / mL",legend_offset);return
	if diagram.has("all_series"):
		Multi.draw_chart(self,points.map(func(p):return p.x),diagram.all_series,index,diagram.label,"Titrant added / mL",legend_offset);return
	draw_rect(Rect2(Vector2.ZERO,size),Color("10232b"))
	var font:=ThemeDB.fallback_font
	var title: String=diagram.get("label","Calculated pH")
	var series: Dictionary=diagram.get("series",{})
	var values: Array=series.get("values",points.map(func(p):return p.y))
	draw_string(font,Vector2(15,21),title,HORIZONTAL_ALIGNMENT_LEFT,size.x-25,15,Color("a9daca"))
	draw_string(font,Vector2(15,39),series.get("name","Click a calculated dose"),HORIZONTAL_ALIGNMENT_LEFT,size.x-25,12,Color("bfd0d5"))
	if points.is_empty():
		draw_string(font,Vector2(24,85),"Prepare an experiment at the bench",HORIZONTAL_ALIGNMENT_LEFT,-1,15);return
	var low:=INF;var high:=-INF
	for v in values:
		if v!=null:low=minf(low,float(v));high=maxf(high,float(v))
	if low==INF:
		var reasons: Array=series.get("reasons",[])
		var reason: String=str(reasons[index]) if index<reasons.size() else "No applicable calculated values"
		draw_string(font,Vector2(24,78),"Unavailable: "+reason.replace("-"," "),HORIZONTAL_ALIGNMENT_LEFT,size.x-35,14);return
	if title.contains("pH"):low=minf(0,low);high=maxf(14,high)
	elif title.contains("fractions") or title.contains("speciation"):low=0;high=1
	else:low=floor(low);high=ceil(high)
	if high-low<.00001:high=low+1
	var area:=Rect2(55,55,maxf(1,size.x-75),maxf(1,size.y-95))
	var capacity:=maxf(.001,float(points[-1].x))
	for i in 6:
		var y:=area.position.y+area.size.y*i/5.0
		draw_line(Vector2(55,y),Vector2(size.x-20,y),Color("28404a"))
		draw_string(font,Vector2(5,y+5),"%.2f" % lerpf(high,low,i/5.0),HORIZONTAL_ALIGNMENT_LEFT,48,13)
		var x:=55+area.size.x*i/5.0
		draw_string(font,Vector2(x-8,size.y-21),"%.1f" % (capacity*i/5.0),HORIZONTAL_ALIGNMENT_LEFT,-1,12)
	var previous:=Vector2.ZERO;var valid:=false
	for i in points.size():
		if i>=values.size() or values[i]==null:valid=false;continue
		var pos:=Vector2(55+float(points[i].x)/capacity*area.size.x,55+(high-float(values[i]))/(high-low)*area.size.y)
		if valid:draw_line(previous,pos,Color("80e4c5"),2,true)
		if i==index:draw_circle(pos,5,Color("80e4c5"))
		previous=pos;valid=true
	var selected_x:=55+float(points[index].x)/capacity*area.size.x
	draw_line(Vector2(selected_x,55),Vector2(selected_x,area.end.y),Color("d1ad6b"),1)
	draw_string(font,Vector2(size.x*.4,size.y-4),"Titrant added / mL",HORIZONTAL_ALIGNMENT_LEFT,-1,12)

