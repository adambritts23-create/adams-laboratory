extends Control
var run
var instrument := false
func _draw() -> void:
	if run==null:return
	var font=ThemeDB.fallback_font
	draw_rect(Rect2(Vector2.ZERO,size),Color("122e22") if instrument else Color("091d25"))
	var ink=Color("b5ebbb") if instrument else Color("cbdfee")
	draw_string(font,Vector2(28,40),"KF COULOMETER" if instrument else "COMPUTER · "+str(run.vial.id),HORIZONTAL_ALIGNMENT_LEFT,-1,28,ink)
	draw_string(font,Vector2(28,79),"%s · %.3f g · %.2f min"%[run.status.to_upper(),run.vial.mass,run.t],HORIZONTAL_ALIGNMENT_LEFT,-1,24,ink)
	if instrument:
		draw_string(font,Vector2(28,185),"%.1f ppm"%run.ppm() if not run.vial.get("blank",false) else "%.1f µg blank"%run.gross(),HORIZONTAL_ALIGNMENT_LEFT,-1,64,Color("fff0b5"))
		draw_string(font,Vector2(28,250),"%.2f µg water"%run.corrected(),HORIZONTAL_ALIGNMENT_LEFT,-1,34,ink)
		draw_string(font,Vector2(28,350),"ACTIVE DRIFT / RATE",HORIZONTAL_ALIGNMENT_LEFT,-1,28,Color("efce62"))
		draw_string(font,Vector2(28,405),"%.2f µg/min"%run.rate,HORIZONTAL_ALIGNMENT_LEFT,-1,48,Color("efce62"))
		draw_string(font,Vector2(590,350),"INDICATOR",HORIZONTAL_ALIGNMENT_LEFT,-1,28,Color("a8e9df"))
		draw_string(font,Vector2(590,405),"%.1f mV"%run.voltage,HORIZONTAL_ALIGNMENT_LEFT,-1,48,Color("a8e9df"))
		draw_string(font,Vector2(28,520),"Generator %.2f mA · %s"%[run.current,"CONDITIONING" if run.status!="running" else "TITRATING"],HORIZONTAL_ALIGNMENT_LEFT,-1,28,ink)
	else:
		var water_max: float=maxf(100,ceil(run.total/100)*100)
		var rate_max := 100.0
		for point in run.history:rate_max=maxf(rate_max,ceil(point.z/100)*100)
		var time_max: float=maxf(6,ceil(run.t))
		for i in 5:
			var y: float=470-i*75
			draw_line(Vector2(100,y),Vector2(900,y),Color("29464e"))
			draw_string(font,Vector2(12,y+7),"%.0f"%(water_max*i/4),HORIZONTAL_ALIGNMENT_LEFT,-1,20,Color("ff635d"))
			draw_string(font,Vector2(910,y+7),"%.0f"%(rate_max*i/4),HORIZONTAL_ALIGNMENT_LEFT,-1,20,Color("eed057"))
		for i in 7:draw_string(font,Vector2(95+i*133,500),"%.1f"%(time_max*i/6),HORIZONTAL_ALIGNMENT_LEFT,-1,20,ink)
		for i in range(1,run.history.size()):
			var a: Vector3=run.history[i-1];var b: Vector3=run.history[i]
			draw_line(Vector2(100+a.x/time_max*800,470-a.y/water_max*300),Vector2(100+b.x/time_max*800,470-b.y/water_max*300),Color("ff5049"),4)
			draw_line(Vector2(100+a.x/time_max*800,470-a.z/rate_max*300),Vector2(100+b.x/time_max*800,470-b.z/rate_max*300),Color("eed057"),4)
		draw_string(font,Vector2(100,135),"Water / µg                         Rate / µg min⁻¹",HORIZONTAL_ALIGNMENT_LEFT,-1,25,ink)
		draw_string(font,Vector2(28,565),"%.2f µg · %.1f ppm · time / min"%[run.corrected(),run.ppm()],HORIZONTAL_ALIGNMENT_LEFT,-1,28,ink)
	draw_string(font,Vector2(28,615),"SIMULATION · blank %.2f µg · %s"%[run.blank,"Final result" if run.status=="complete" else "Provisional"],HORIZONTAL_ALIGNMENT_LEFT,-1,22,ink)
