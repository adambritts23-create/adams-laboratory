// The sandbox cannot spawn Windows' optional network-drive probe.
// Skip that probe only; build/validation errors still propagate unchanged.
import childProcess from 'node:child_process'
import {syncBuiltinESMExports} from 'node:module'
const original=childProcess.exec
childProcess.exec=function(command,...args){if(command==='net use'){const callback=args.at(-1);queueMicrotask(()=>callback(new Error('Network-drive probe not needed for local paths'),'',''));return}return original.call(this,command,...args)}
syncBuiltinESMExports()
const {build}=await import('vite')
await build()
