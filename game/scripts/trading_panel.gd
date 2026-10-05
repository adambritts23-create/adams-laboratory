extends PanelContainer
var economy
var columns:VBoxContainer
func open(e):
 economy=e;e.lab.game_ui.add_child(self);set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT);offset_left=80;offset_right=-80;offset_top=50;offset_bottom=-50
 var style=StyleBoxFlat.new();style.bg_color=Color(.025,.045,.055,.98);style.set_content_margin_all(22);add_theme_stylebox_override("panel",style)
 columns=VBoxContainer.new();add_child(columns)
 e.lab.player.enabled=false;Input.mouse_mode=Input.MOUSE_MODE_VISIBLE;refresh()
func refresh():
 for c in columns.get_children():columns.remove_child(c);c.queue_free()
 var w=economy.lab.workbench
 w.label(columns,"THE WORLD IS YOURS · PORTFOLIO",28)
 w.label(columns,"Fictional game prices · no connection to real markets",17)
 w.label(columns,"Cash $%.2f    Portfolio $%.2f" % [economy.cash,economy.portfolio_value()],22)
 for symbol in economy.STOCKS:
  var line=w.row(columns);var shares=int(economy.portfolio.get(symbol,0))
  w.label(line,"%s  $%.2f  ·  %d shares" % [symbol,economy.quote(symbol),shares],19).custom_minimum_size.x=370
  for n in [1,10,-1,-10]:
   w.button(line,("Buy " if n>0 else "Sell ")+str(absi(n)),func():economy.trade(symbol,n);refresh())
 w.button(columns,"Close · Esc",close)
func close():
 economy.trading_ui=null;economy.lab.player.enabled=true;Input.mouse_mode=Input.MOUSE_MODE_CAPTURED;queue_free()
