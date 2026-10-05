extends Control
func _draw() -> void:
	var a:=Rect2(12,12,maxf(1,size.x-26),maxf(1,size.y-32))
	draw_rect(a,Color("f5f5f5"))
	draw_rect(a,Color("333333"),false,1.0)
	for i in 11:
		var x:=a.position.x+a.size.x*i/10.0;var y:=a.position.y+a.size.y*i/10.0
		draw_line(Vector2(x,a.end.y),Vector2(x,a.end.y-7),Color.BLACK,1)
		draw_line(Vector2(a.position.x,y),Vector2(a.position.x+7,y),Color.BLACK,1)
	draw_string(ThemeDB.fallback_font,Vector2(30,size.y*.5),"Diagram preview",HORIZONTAL_ALIGNMENT_LEFT,-1,18,Color("777777"))
