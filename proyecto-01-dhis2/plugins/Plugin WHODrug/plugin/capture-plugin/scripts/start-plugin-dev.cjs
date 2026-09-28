#!/usr/bin/env node
const http = require('http')
const path = require('path')
const { spawn } = require('child_process')

const publicPort = Number(process.env.PORT || 3000)
const targetPort = Number(process.env.DHIS2_PLUGIN_TARGET_PORT || publicPort + 1)
const host = process.env.HOST || 'localhost'
const pluginRoot = path.resolve(__dirname, '..')
const npmGlobalBin = path.join(process.env.APPDATA || '', 'npm')
const pathKey = Object.keys(process.env).find(
    (key) => key.toLowerCase() === 'path',
) || 'PATH'
const pathValue = process.env[pathKey] || ''
const env = {
    ...process.env,
    PORT: String(targetPort),
    [pathKey]: npmGlobalBin
        ? `${npmGlobalBin}${path.delimiter}${pathValue}`
        : pathValue,
}
const d2Bin = path.resolve(
    pluginRoot,
    '..',
    'node_modules',
    '@dhis2',
    'cli-app-scripts',
    'bin',
    'd2-app-scripts',
)

const child = spawn(process.execPath, [d2Bin, 'start', '--plugin', '--port', String(targetPort)], {
    cwd: pluginRoot,
    env,
    stdio: 'inherit',
    shell: false,
})

const proxy = http.createServer((req, res) => {
    let nextUrl = req.url || '/'

    if (nextUrl === '/plugin') {
        res.statusCode = 302
        res.setHeader('Location', '/plugin.html')
        res.end()
        return
    }

    if (nextUrl.startsWith('/%PUBLIC_URL%/')) {
        nextUrl = nextUrl.replace('/%PUBLIC_URL%', '')
    }

    const upstream = http.request(
        {
            hostname: host,
            port: targetPort,
            method: req.method,
            path: nextUrl,
            headers: req.headers,
        },
        (upstreamRes) => {
            res.writeHead(upstreamRes.statusCode || 500, upstreamRes.headers)
            upstreamRes.pipe(res)
        },
    )

    upstream.on('error', (error) => {
        res.statusCode = 502
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end(`Plugin dev server is not ready yet: ${error.message}`)
    })

    req.pipe(upstream)
})

proxy.listen(publicPort, host, () => {
    console.log(
        `[start-plugin-dev] Proxy available at http://${host}:${publicPort}/plugin.html`,
    )
    console.log(
        `[start-plugin-dev] /plugin redirects to /plugin.html; d2-app-scripts runs on ${targetPort}.`,
    )
})

const shutdown = () => {
    proxy.close()
    if (!child.killed) {
        child.kill()
    }
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

child.on('exit', (code, signal) => {
    proxy.close(() => {
        if (signal) {
            process.kill(process.pid, signal)
        } else {
            process.exit(code || 0)
        }
    })
})
