extends RefCounted
# Shared vegetation exclusions for the compact commercial block.
static func shopping(x:float,s:float)->bool:
 return (x>10 and x<100 and s>858 and s<944) or (x>24 and x<69 and s>839 and s<866)
static func no_tall_grass(x:float,s:float)->bool:
 if shopping(x,s):return true
 if absf(x)<78 and s>600 and s<1180:return true
 if x> -94 and x< -38 and s>910 and s<1020:return true
 for plot in [Vector2(-112,690),Vector2(-139,796),Vector2(-113,1080)]:
  if absf(x-plot.x)<20 and absf(s-plot.y)<23:return true
 return false
