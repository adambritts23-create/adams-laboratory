import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

export const developmentSourceEndpoint = '/adambritts-site/laboratory/__development_source'
const loopback = address => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)
// LOCAL DEVELOPMENT DATA MUST NOT BE ASSUMED REDISTRIBUTABLE.
// This server-only module never imports a dataset into the Vite module graph.
export function developmentSourceMiddleware(configuredPath, root = process.cwd()) {
  const file = configuredPath ? path.resolve(root, configuredPath) : null
  return (req, res, next) => {
    if (req.url?.split('?')[0] !== developmentSourceEndpoint) return next()
    res.setHeader('Cache-Control', 'no-store')
    const host = req.headers.host
    if (!loopback(req.socket.remoteAddress) || !/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host ?? '') ||
      (req.headers.origin && req.headers.origin !== `http://${host}`)) { res.statusCode = 403; return res.end('Local access only.') }
    if (!['GET', 'HEAD'].includes(req.method)) { res.statusCode = 405; return res.end() }
    if (!file) { res.statusCode = 404; return res.end('No development source configured.') }
    fs.stat(file, (error, stat) => {
      if (error || !stat.isFile() || stat.size > 100 * 1024 * 1024) { res.statusCode = 503; return res.end('Development source unavailable.') }
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Length', stat.size)
      if (req.method === 'HEAD') return res.end()
      const stream = fs.createReadStream(file)
      stream.on('error', () => res.destroy())
      stream.pipe(res)
    })
  }
}
export function developmentSourcePlugin(configuredPath) {
  return { name: 'local-development-source', apply: 'serve', configureServer(server) {
    server.middlewares.use(developmentSourceMiddleware(configuredPath, server.config.root))
  } }
}
