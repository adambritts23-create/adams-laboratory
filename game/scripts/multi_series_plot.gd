# Shared multi-series plot with a scrollable legend. Every curve remains plotted.
extends RefCounted
static func area(size: Vector2) -> Rect2:
	return Rect2(80,70,maxf(1,size.x-258),maxf(1,size.y-126))
static func color(i: int) -> Color:return Color.from_hsv(fmod(.43+i*.618034,1.0),.52,.95)
static func draw_chart(c: Control,xs: Array,rows: Array,chosen: int,title: String,xlabel: String,legend_offset: int=0,y_bounds: Variant=null) -> void:
	var f:=ThemeDB.fallback_font;var a:=area(c.size)
	c.draw_rect(Rect2(Vector2.ZERO,c.size),Color("10232b"))
	c.draw_string(f,Vector2(14,24),title,HORIZONTAL_ALIGNMENT_LEFT,c.size.x-25,19,Color.WHITE)
	c.draw_string(f,Vector2(80,52),"Y: "+axis_name(title),HORIZONTAL_ALIGNMENT_LEFT,c.size.x-100,17,Color("a5f0da"))
	if xs.is_empty():c.draw_string(f,Vector2(18,70),"Prepare / run the experiment",HORIZONTAL_ALIGNMENT_LEFT,-1,16);return
	var low:=INF;var high:=-INF
	for row in rows:
		for v in row.values:
			if v!=null:low=minf(low,float(v));high=maxf(high,float(v))
	if low==INF:
		c.draw_string(f,Vector2(18,75),"No applicable accepted values for this diagram",HORIZONTAL_ALIGNMENT_LEFT,c.size.x-30,14);return
	low=floor(low);high=ceil(high)
	if y_bounds!=null:low=y_bounds.x;high=y_bounds.y
	if high-low<.000001:high=low+1
	var xmin: float=xs[0];var xmax: float=xs[-1]
	for i in 6:
		var y:=a.position.y+a.size.y*i/5.0;var x:=a.position.x+a.size.x*i/5.0
		c.draw_line(Vector2(a.position.x,y),Vector2(a.end.x,y),Color("28404a"))
		c.draw_string(f,Vector2(3,y+5),"%.2f" % lerpf(high,low,i/5.0),HORIZONTAL_ALIGNMENT_LEFT,74,15)
		c.draw_string(f,Vector2(x-12,a.end.y+20),"%.2f" % lerpf(xmin,xmax,i/5.0),HORIZONTAL_ALIGNMENT_LEFT,-1,15)
	for k in rows.size():
		var values: Array=rows[k].values;var previous:=Vector2.ZERO;var valid:=false
		for i in mini(xs.size(),values.size()):
			if values[i]==null:valid=false;continue
			var p:=Vector2(a.position.x+(float(xs[i])-xmin)/maxf(.000001,xmax-xmin)*a.size.x,a.position.y+(high-float(values[i]))/(high-low)*a.size.y)
			if valid:
				var outline:=PackedVector2Array([a.position,Vector2(a.end.x,a.position.y),a.end,Vector2(a.position.x,a.end.y)])
				for segment in Geometry2D.intersect_polyline_with_polygon(PackedVector2Array([previous,p]),outline):c.draw_polyline(segment,color(k),1.8,true)
			if i==chosen and a.has_point(p):c.draw_circle(p,3,color(k))
			previous=p;valid=true
	var selected_x:=a.position.x+(float(xs[clampi(chosen,0,xs.size()-1)])-xmin)/maxf(.000001,xmax-xmin)*a.size.x
	c.draw_line(Vector2(selected_x,a.position.y),Vector2(selected_x,a.end.y),Color("d1ad6b"),1)
	var count:=maxi(1,int((c.size.y-90)/19));legend_offset=clampi(legend_offset,0,maxi(0,rows.size()-count))
	for j in mini(count,rows.size()-legend_offset):
		var k:=j+legend_offset;var pos:=Vector2(a.end.x+12,57+j*19)
		c.draw_line(pos+Vector2(0,-4),pos+Vector2(12,-4),color(k),2)
		c.draw_string(f,pos+Vector2(17,0),rows[k].name,HORIZONTAL_ALIGNMENT_LEFT,145,12)
	if rows.size()>count:c.draw_string(f,Vector2(a.end.x+12,c.size.y-16),"Wheel: legend · %s curves" % rows.size(),HORIZONTAL_ALIGNMENT_LEFT,168,11)
	c.draw_line(a.position,Vector2(a.position.x,a.end.y),Color("c8e4e8"),2)
	c.draw_line(Vector2(a.position.x,a.end.y),a.end,Color("c8e4e8"),2)
	c.draw_string(f,Vector2(80,c.size.y-12),"X: "+xlabel,HORIZONTAL_ALIGNMENT_LEFT,a.size.x,17,Color("a5f0da"))

static func axis_name(title: String) -> String:
	var t:=title.to_lower()
	if "solubility" in t:return "log S (mol/kg H2O)"
	if "log" in t and ("concentration" in t or "amount" in t):return "log c (mol/kg H2O)"
	if "ph" in t:return "pH"
	if "fraction" in t or "speciation" in t:return "Fraction"
	return title
