import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import {parse} from 'espree'
const canonical=value=>Array.isArray(value)?`[${value.map(canonical).join(',')}]`:value&&typeof value==='object'?`{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`:JSON.stringify(value)
function literal(node){
  if(node.type==='Literal')return node.value
  if(node.type==='TemplateLiteral'&&node.expressions.length===0)return node.quasis[0].value.cooked
  if(node.type==='ArrayExpression')return node.elements.map(literal)
  if(node.type==='ObjectExpression')return Object.fromEntries(node.properties.map(p=>{assert.ok(p.type==='Property'&&!p.computed&&!p.method&&p.kind==='init');return [p.key.name??p.key.value,literal(p.value)]}))
  if(node.type==='UnaryExpression'&&node.operator==='-')return -literal(node.argument)
  throw Error('Approved metadata must remain a static literal.')
}
function metadataSpans(text,approved){
  if(!approved.length)return []
  const spans=[]
  const walk=node=>{
    if(!node||typeof node!=='object')return
    if(node.type==='ObjectExpression'){
      const version=node.properties.find(p=>p.type==='Property'&&(p.key.name??p.key.value)==='version')
      const match=version&&approved.find(a=>{try{return literal(version.value)===a.value.version}catch{return false}})
      if(match){const value=literal(node);assert.deepEqual(value,match.value,'Approved metadata content changed.');assert.equal(createHash('sha256').update(canonical(value)).digest('hex'),match.sha256,'Metadata evidence pin changed.');spans.push({start:node.start,end:node.end,version:value.version});return}
    }
    for(const value of Object.values(node))if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')walk(value)
  }
  walk(parse(text,{ecmaVersion:'latest',sourceType:'module'}));return spans
}
export function auditProductionArtifacts(files, sourceHashes = [], approvedAssets = [], approvedMetadata = []) {
  assert.ok(files.length > 0, 'Production output is missing.')
  let bytes = 0
  const metadataCounts=new Map(approvedMetadata.map(a=>[a.value.version,0]))
  for (const { name, content } of files) {
    const approved = approvedAssets.find(a => a.file === name.replaceAll('\\', '/'))
    if (approved) {
      assert.equal(Buffer.byteLength(content), approved.bytes, 'Approved asset size changed.')
      assert.equal(createHash('sha256').update(content).digest('hex'), approved.sha256, 'Approved asset content changed.')
      if (name.endsWith('.json')) assert.ok(!/[A-Z]:[\\/]+Users[\\/]|\/Users\//i.test(content.toString()), 'Local path in published data.')
      continue
    }
    const text = content.toString()
    assert.ok(/\.(?:html|js|css|svg)$/.test(name), 'Unreviewed artifact type, including compressed or binary data, in production output.')
    bytes += Buffer.byteLength(content)
    assert.ok(!/spana-components|\.local[\\/]|\.env|__development_source|ADAMS_DEV_DATA/i.test(name), 'Development source file in production output.')
    assert.ok(!/spana-components\.json|__development_source|ADAMS_DEV_DATA|[A-Z]:[\\/]+Users[\\/]|\/Users\//i.test(text), 'Development endpoint or local path leaked into production.')
    // Only a byte-for-byte-equivalent static scientific metadata object with a
    // pinned canonical hash is exempt from the source-fingerprint detector.
    // Paths, data sizes and all content outside that object remain audited.
    let payload=text
    const spans=name.endsWith('.js')?metadataSpans(text,approvedMetadata):[]
    for(const span of spans.sort((a,b)=>b.start-a.start)){payload=payload.slice(0,span.start)+payload.slice(span.end);metadataCounts.set(span.version,metadataCounts.get(span.version)+1)}
    assert.ok(!sourceHashes.some(hash => payload.includes(hash)), 'Local source payload fingerprint found in production.')
    assert.ok(Buffer.byteLength(content) < 2 * 1024 * 1024, 'Unexpected large artifact; investigate possible embedded data.')
  }
  assert.ok(bytes < 5 * 1024 * 1024, 'Unexpected production payload size; explicit boundary review required.')
  for (const approved of approvedAssets) assert.equal(files.filter(f => f.name.replaceAll('\\', '/') === approved.file).length, 1, 'Approved asset must occur exactly once.')
  for(const count of metadataCounts.values())assert.equal(count,1,'Approved metadata must occur exactly once.')
  return { files: files.length, bytes: bytes + approvedAssets.reduce((sum, a) => sum + a.bytes, 0), applicationBytes: bytes, localSourceAbsent: approvedAssets.length === 0, unintendedLocalFilesAbsent: true, approvedAssets }
}
