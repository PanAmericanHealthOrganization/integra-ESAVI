#!/usr/bin/env node
const path = require('path')
const { spawn } = require('child_process')

const pluginRoot = path.resolve(__dirname, '..')
const workspaceRoot = path.resolve(pluginRoot, '..')
const d2Bin = path.resolve(
    workspaceRoot,
    'node_modules',
    '@dhis2',
    'cli-app-scripts',
    'bin',
    'd2-app-scripts',
)
const npmGlobalBin = path.join(process.env.APPDATA || '', 'npm')
const pathKey = Object.keys(process.env).find(
    (key) => key.toLowerCase() === 'path',
) || 'PATH'
const pathValue = process.env[pathKey] || ''
const env = {
    ...process.env,
    [pathKey]: npmGlobalBin
        ? `${npmGlobalBin}${path.delimiter}${pathValue}`
        : pathValue,
}

const child = spawn(process.execPath, [d2Bin, ...process.argv.slice(2)], {
    cwd: pluginRoot,
    env,
    stdio: 'inherit',
    shell: false,
})

child.on('exit', (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal)
        return
    }

    process.exit(code || 0)
})
