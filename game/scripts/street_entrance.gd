extends "res://scripts/lab_props.gd"
func build(land,p:Vector3,w:float,d:float,floors:int,add_windows:bool=true):
 init_materials();name="StreetEntrance";position=p
 var side=-signf(p.x);var x=side*(w*.5+.09)
 var trim=material(Color(.86,.86,.77));var pane=material(Color(.08,.17,.20),.4,.2)
 if add_windows:
  for wall_side in [-1,1]:
   for floor_index in floors:
    for z in [-d*.29,0,d*.29]:
     if wall_side==side and floor_index==0 and z==0:continue
     var q=Vector3(wall_side*(w*.5+.09),1.8+floor_index*3.1,z)
     box(q,Vector3(.10,1.65,1.5),trim)
     box(q+Vector3(wall_side*.06,0,0),Vector3(.035,1.42,1.26),pane)
     box(q+Vector3(wall_side*.09,0,0),Vector3(.03,1.45,.055),trim)
     box(q+Vector3(wall_side*.09,0,0),Vector3(.03,.055,1.29),trim)
 box(Vector3(x,1.15,0),Vector3(.13,2.3,1.16),trim)
 box(Vector3(x+side*.09,1.1,0),Vector3(.08,2.14,1.0),material(Color(.15,.23,.19)))
 box(Vector3(x+side*.14,1.55,0),Vector3(.03,.78,.68),pane)
 tube(Vector3(x+side*.21,.85,.34),Vector3(x+side*.21,1.18,.34),.018,brass)
 box(Vector3(x+side*.65,2.52,0),Vector3(1.5,.13,1.8),dark)
 box(Vector3(x+side*.55,.025,0),Vector3(1.2,.05,1.8),concrete,true)
 # A flush path reaches the road-facing opening in the property boundary.
 var length=3.2
 box(Vector3(x+side*(length*.5),.014,0),Vector3(length,.028,1.6),concrete)
 var pole_start=Vector3(x,2.5,1.45);var pole_end=pole_start+Vector3(side*.9,.7,0)
 tube(pole_start,pole_end,.025,metal)
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 for iy in 8:
  for ix in 16:
   for uv in [Vector2(ix/16.0,iy/8.0),Vector2((ix+1)/16.0,iy/8.0),Vector2((ix+1)/16.0,(iy+1)/8.0),Vector2(ix/16.0,iy/8.0),Vector2((ix+1)/16.0,(iy+1)/8.0),Vector2(ix/16.0,(iy+1)/8.0)]:
    st.set_uv(uv);st.add_vertex(pole_end+Vector3(side*uv.x*1.05,-uv.y*.7,0))
 st.generate_normals();var flag=MeshInstance3D.new();add_child(flag);flag.mesh=st.commit();flag.extra_cull_margin=.2
 var mat=ShaderMaterial.new();mat.shader=preload("res://materials/porch_flag.gdshader");mat.set_shader_parameter("crowns",int(absf(p.z))%2==0);mat.set_shader_parameter("flag_image",load("res://art/town_monument/crowns.png"));flag.material_override=mat
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=2
