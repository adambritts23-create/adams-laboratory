extends Control
var data: Dictionary={}
var diagram_index:=0
var series_index:=-1
var chosen:=0
var y_bounds: Variant=null
var legend_offset:=0
signal selected(index: int)
const Multi=preload("res://scripts/multi_series_plot.gd")
var yaw:=.65
var pitch:=.50
var zoom:=1.0
var dragging:=false
var point_offset:=0
func selected_series() -> Dictionary:
	if data.get("diagrams",[]).is_empty():return {}
	var d: Dictionary=data.diagrams[clampi(diagram_index,0,data.diagrams.size()-1)]
	if d.series.is_empty():return {}
	return d.series[clampi(series_index,0,d.series.size()-1)]
func _gui_input(event: InputEvent) -> void:
	if data.get("kind","")=="point":
		if event is InputEventMouseButton and event.pressed:
			if event.button_index==MOUSE_BUTTON_WHEEL_DOWN:point_offset=mini(maxi(0,data.species.size()-1),point_offset+1)
			if event.button_index==MOUSE_BUTTON_WHEEL_UP:point_offset=maxi(0,point_offset-1)
		queue_redraw();return
	if data.get("kind","")=="sweep":
		if event is InputEventMouseButton and event.pressed:
			if event.button_index in [MOUSE_BUTTON_WHEEL_UP,MOUSE_BUTTON_WHEEL_DOWN]:legend_offset=maxi(0,legend_offset+(1 if event.button_index==MOUSE_BUTTON_WHEEL_DOWN else -1));queue_redraw()
			if event.button_index==MOUSE_BUTTON_LEFT:
				var a:=Multi.area(size)
				selected.emit(roundi(clampf((event.position.x-a.position.x)/a.size.x,0,1)*(data.coordinates[0].size()-1)))
		return
	if data.get("kind","")!="grid":return
	if event is InputEventMouseButton:
		if event.button_index==MOUSE_BUTTON_LEFT:dragging=event.pressed
		if event.pressed and event.button_index==MOUSE_BUTTON_WHEEL_UP:zoom=minf(1.6,zoom*1.1)
		if event.pressed and event.button_index==MOUSE_BUTTON_WHEEL_DOWN:zoom=maxf(.5,zoom/1.1)
	if event is InputEventMouseMotion and dragging:
		yaw+=event.relative.x*.009;pitch=clampf(pitch+event.relative.y*.006,.12,1.25)
	queue_redraw()
func project(v: Vector3) -> Vector2:
	var r:=v.rotated(Vector3.UP,yaw).rotated(Vector3.RIGHT,pitch)
	return Vector2(size.x*.5,size.y*.47)+Vector2(r.x,-r.y)*minf(size.x*.34,size.y*.38)*zoom
func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO,size),Color("10232b"))
	var font:=ThemeDB.fallback_font
	if data.is_empty():draw_string(font,Vector2(20,35),"Choose conditions and run calculation",HORIZONTAL_ALIGNMENT_LEFT,-1,18);return
	if data.get("kind","")=="point":
		draw_string(font,Vector2(20,30),"Fixed equilibrium · pH %.5f" % float(data.pH),HORIZONTAL_ALIGNMENT_LEFT,-1,18)
		for i in mini(maxi(1,int((size.y-100)/21)),data.species.size()-point_offset):
			var row: Dictionary=data.species[i+point_offset]
			draw_string(font,Vector2(20,60+i*21),str(row.name)+": "+str(row.value)+" mol/kg H2O · log activity "+str(row.logActivity),HORIZONTAL_ALIGNMENT_LEFT,size.x-30,15)
		draw_string(font,Vector2(20,size.y-12),"Wheel to scroll all carriers; amounts are model values per kg water.",HORIZONTAL_ALIGNMENT_LEFT,size.x-30,13)
		return
	var d: Dictionary=data.diagrams[clampi(diagram_index,0,data.diagrams.size()-1)]
	if data.kind=="sweep" and d.error.is_empty():
		Multi.draw_chart(self,data.coordinates[0],d.series if series_index<0 else [selected_series()],chosen,d.label,data.axes[0].name+" / "+data.axes[0].quantity,legend_offset,y_bounds);return
	draw_string(font,Vector2(16,23),d.label,HORIZONTAL_ALIGNMENT_LEFT,size.x-20,16)
	if not d.error.is_empty():draw_multiline_string(font,Vector2(16,65),d.error,HORIZONTAL_ALIGNMENT_LEFT,size.x-32,15);return
	var series:=selected_series()
	if series.is_empty():draw_string(font,Vector2(16,65),"No applicable carriers",HORIZONTAL_ALIGNMENT_LEFT,-1,16);return
	draw_string(font,Vector2(16,43),series.name+" · "+d.unit,HORIZONTAL_ALIGNMENT_LEFT,size.x-25,13)
	var values: Array=series.values;var low:=INF;var high:=-INF
	for v in values:
		if v!=null:low=minf(low,float(v));high=maxf(high,float(v))
	if low==INF:draw_string(font,Vector2(16,80),"Unavailable: "+str(series.reasons[0] if not series.reasons.is_empty() else "no accepted values"),HORIZONTAL_ALIGNMENT_LEFT,size.x-32,14);return
	if absf(high-low)<1e-10:high=low+1
	if data.kind=="sweep":
		var xs: Array=data.coordinates[0];var area:=Rect2(75,65,maxf(1,size.x-95),maxf(1,size.y-120));var xmin: float=xs[0];var xmax: float=xs[-1]
		for i in 6:
			var yy:=area.position.y+area.size.y*i/5.0;var xx:=area.position.x+area.size.x*i/5.0
			draw_line(Vector2(75,yy),Vector2(area.end.x,yy),Color("30434a"))
			draw_string(font,Vector2(5,yy+5),"%.3f" % lerpf(high,low,i/5.0),HORIZONTAL_ALIGNMENT_LEFT,68,12)
			draw_string(font,Vector2(xx-15,area.end.y+22),"%.2f" % lerpf(xmin,xmax,i/5.0),HORIZONTAL_ALIGNMENT_LEFT,-1,12)
		var last:=Vector2.ZERO;var valid:=false
		for i in values.size():
			if values[i]==null:valid=false;continue
			var v:=Vector2(75+(float(xs[i])-xmin)/maxf(.000001,xmax-xmin)*area.size.x,65+(high-float(values[i]))/(high-low)*area.size.y)
			if valid:draw_line(last,v,Color("80e4c5"),2,true)
			last=v;valid=true
		draw_string(font,Vector2(75,size.y-8),data.axes[0].name+" / "+data.axes[0].quantity+" ("+data.axes[0].mode+")",HORIZONTAL_ALIGNMENT_LEFT,size.x-100,14)
	else:
		var nx:=int(data.shape[0]);var ny:=int(data.shape[1]);var faces: Array=[]
		for iy in ny-1:
			for ix in nx-1:
				var ids: Array=[iy*nx+ix,iy*nx+ix+1,(iy+1)*nx+ix+1,(iy+1)*nx+ix]
				if ids.any(func(i):return values[i]==null):continue
				var polygon:=PackedVector2Array();var depth:=0.0;var shade:=0.0
				for k in ids:
					var t: float=(float(values[k])-low)/(high-low);var v:=Vector3(float(k%nx)/(nx-1)*2-1,t*.95-.3,float(k/nx)/(ny-1)*2-1)
					polygon.append(project(v));depth+=v.rotated(Vector3.UP,yaw).rotated(Vector3.RIGHT,pitch).z;shade+=t
				faces.append({"p":polygon,"depth":depth,"shade":shade/4})
		faces.sort_custom(func(a,b):return a.depth<b.depth)
		for face in faces:
			draw_colored_polygon(face.p,Color("143d69").lerp(Color("93e9aa"),face.shade))
			draw_polyline(PackedVector2Array([face.p[0],face.p[1],face.p[2],face.p[3],face.p[0]]),Color(.08,.16,.19,.65),1,true)
		for axis in [[Vector3(-1,-.3,-1),Vector3(1,-.3,-1),"X: "+data.axes[0].name+" / "+data.axes[0].quantity],[Vector3(-1,-.3,-1),Vector3(-1,-.3,1),"Y: "+data.axes[1].name+" / "+data.axes[1].quantity]]:
			draw_line(project(axis[0]),project(axis[1]),Color.WHITE,2)
			draw_string(font,project(axis[1]),axis[2],HORIZONTAL_ALIGNMENT_LEFT,-1,13)
		draw_string(font,Vector2(16,size.y-50),"X: %.3f to %.3f (%s)  ·  Y: %.3f to %.3f (%s)" % [data.axes[0].range.min,data.axes[0].range.max,data.axes[0].mode,data.axes[1].range.min,data.axes[1].range.max,data.axes[1].mode],HORIZONTAL_ALIGNMENT_LEFT,size.x-25,13)
		draw_string(font,Vector2(16,size.y-30),"Z: %.4f to %.4f · gaps = unavailable equilibria" % [low,high],HORIZONTAL_ALIGNMENT_LEFT,size.x-25,13)
		draw_string(font,Vector2(16,size.y-9),"Drag to rotate · Wheel to zoom",HORIZONTAL_ALIGNMENT_LEFT,-1,13)
