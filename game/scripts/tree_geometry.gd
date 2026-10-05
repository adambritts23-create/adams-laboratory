extends RefCounted
static func tube_mesh(st:SurfaceTool,a:Vector3,b:Vector3,r1:float,r2:float):
 var axis=(b-a).normalized();var u=axis.cross(Vector3.RIGHT).normalized();var v=axis.cross(u)
 for i in 9:
  var p=u*cos(i*TAU/9)+v*sin(i*TAU/9);var q=u*cos((i+1)*TAU/9)+v*sin((i+1)*TAU/9)
  for t in [a+p*r1,b+q*r2,a+q*r1,a+p*r1,b+p*r2,b+q*r2]:st.add_vertex(t)
