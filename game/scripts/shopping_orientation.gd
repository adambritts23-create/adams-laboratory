extends RefCounted
# Shared transform keeps the whole commercial block and interactions aligned.
static func transform()->Transform3D:
 var pivot=Vector3(49,-48,-892)
 var turn=Basis(Vector3.UP,-PI/2)
 return Transform3D(turn,pivot-turn*pivot)
