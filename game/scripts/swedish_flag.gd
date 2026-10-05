extends "res://scripts/lab_props.gd"
func build():
 name="SwedishFlagpole";init_materials()
 var white=material(Color(.87,.89,.86),.15,.5)
 cylinder(Vector3(0,4.8,0),.065,9.6,white)
 cylinder(Vector3(0,.10,0),.25,.20,concrete)
 ellipsoid(Vector3(0,9.66,0),Vector3(.105,.105,.105),brass)
 for x in [-.085,.085]:tube(Vector3(x,.95,.01),Vector3(x,9.4,.01),.009,white)
 tube(Vector3(-.08,1.2,-.04),Vector3(.08,1.2,-.04),.018,metal)
 var st=SurfaceTool.new();st.begin(Mesh.PRIMITIVE_TRIANGLES)
 for y in 16:
  for x in 32:
   for uv in [Vector2(x/32.0,y/16.0),Vector2((x+1)/32.0,y/16.0),Vector2((x+1)/32.0,(y+1)/16.0),Vector2(x/32.0,y/16.0),Vector2((x+1)/32.0,(y+1)/16.0),Vector2(x/32.0,(y+1)/16.0)]:
    st.set_uv(uv);st.add_vertex(Vector3(.08+uv.x*2.4,9.3-uv.y*1.5,0))
 st.generate_normals();var cloth=MeshInstance3D.new();cloth.mesh=st.commit();add_child(cloth)
 var mat=ShaderMaterial.new();mat.shader=preload("res://materials/swedish_flag.gdshader");cloth.material_override=mat;cloth.extra_cull_margin=.35
 for n in find_children("*","GeometryInstance3D",true,false):n.layers=2
