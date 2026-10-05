import fs from 'node:fs'
import {gzipSync} from 'node:zlib'
import {auditResponse} from './validation/responseAudit.js'
for(const mixed of [true,false]){
  const e=await auditResponse(mixed),name=mixed?'mixed':'carbonate'
  fs.writeFileSync(`docs/response-audit-${name}.json.gz`,gzipSync(JSON.stringify(e)))
  fs.writeFileSync(`docs/response-matrix-${name}.json`,JSON.stringify(e.matrix,null,2))
  console.log(name,JSON.stringify({X:e.matrix.alongX,Y:e.matrix.alongY,verification:e.verification}))
}
