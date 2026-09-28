#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const pluginRoot = path.resolve(__dirname, '..')
const workspaceRoot = path.resolve(pluginRoot, '..')
const shellSrc = path.resolve(workspaceRoot, 'node_modules', '@dhis2', 'app-shell')
const cliShellIndex = path.resolve(
    workspaceRoot,
    'node_modules',
    '@dhis2',
    'cli-app-scripts',
    'src',
    'lib',
    'shell',
    'index.js',
)
const cliShellEnv = path.resolve(
    workspaceRoot,
    'node_modules',
    '@dhis2',
    'cli-app-scripts',
    'src',
    'lib',
    'shell',
    'env.js',
)
const shellDst = path.resolve(pluginRoot, '.d2', 'shell')
const shellPackageJson = path.resolve(shellDst, 'package.json')
const linkTarget = path.resolve(workspaceRoot, 'node_modules')
const linkPath = path.resolve(shellDst, 'node_modules')
const shellD2App = path.resolve(shellDst, 'src', 'D2App')
const pluginSrc = path.resolve(pluginRoot, 'src')

const log = (msg) => console.log(`[bootstrap-shell] ${msg}`)

if (!fs.existsSync(shellSrc)) {
    log('node_modules/@dhis2/app-shell does not exist. Run npm install first.')
    process.exit(0)
}

const installedVersion = require(path.join(shellSrc, 'package.json')).version

const readShellVersion = () => {
    const pkgPath = path.join(shellDst, 'package.json')
    if (!fs.existsSync(pkgPath)) return null
    try {
        return require(pkgPath).version
    } catch {
        return null
    }
}

const removeIfExists = (target) => {
    if (fs.existsSync(target) || fs.lstatSync(target, { throwIfNoEntry: false })) {
        fs.rmSync(target, { recursive: true, force: true })
    }
}

const patchYarnCommandForWindows = () => {
    if (process.platform !== 'win32' || !fs.existsSync(cliShellIndex)) {
        return
    }

    const yarnJs = path
        .join(process.env.APPDATA || '', 'npm', 'node_modules', 'yarn', 'bin', 'yarn.js')
        .replace(/\\/g, '\\\\')
    if (!fs.existsSync(yarnJs.replace(/\\\\/g, '\\'))) {
        log('yarn.js was not found in APPDATA; leaving d2-app-scripts shell runner unchanged.')
        return
    }

    const source = fs.readFileSync(cliShellIndex, 'utf8')
    let patched = source.replace(
        /cmd: '[^']*yarn(?:\.cmd)?'/g,
        'cmd: process.execPath',
    )
    patched = patched.replace(/cmd: 'node'/g, 'cmd: process.execPath')
    patched = patched
        .replace(
            /args: \['run', 'build'\]/g,
            `args: ['${yarnJs}', 'run', 'build']`,
        )
        .replace(
            /args: \['run', 'start'\]/g,
            `args: ['${yarnJs}', 'run', 'start']`,
        )
        .replace(
            /args: \['run', 'test', '--', '--all'\]/g,
            `args: ['${yarnJs}', 'run', 'test', '--', '--all']`,
        )
        .replace(/pipe: false,\n/g, 'pipe: false,\n                shell: false,\n')
        .replace(/pipe: true,\n/g, 'pipe: true,\n                shell: false,\n')

    patched = patched
        .replace(/shell: false,\n                shell: false,\n/g, 'shell: false,\n')

    if (patched !== source) {
        log('Patching d2-app-scripts shell runner to run Yarn through Node on Windows ...')
        fs.writeFileSync(cliShellIndex, patched)
    }
}

const patchShellEnvForWindows = () => {
    if (process.platform !== 'win32' || !fs.existsSync(cliShellEnv)) {
        return
    }

    const source = fs.readFileSync(cliShellEnv, 'utf8')
    if (source.includes('const pathKey = Object.keys(process.env).find')) {
        return
    }

    const patched = source.replace(
        'const makeShellEnv = (vars) =>\n',
        "const makeShellEnv = (vars) =>\n",
    ).replace(
        'module.exports = ({ port, ...vars }) => {\n    const env = {\n',
        "module.exports = ({ port, ...vars }) => {\n    const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === 'path')\n    const env = {\n        ...(pathKey ? { [pathKey]: process.env[pathKey] } : {}),\n        ...(process.env.PATHEXT ? { PATHEXT: process.env.PATHEXT } : {}),\n",
    )

    if (patched !== source) {
        log('Patching d2-app-scripts shell env to preserve PATH on Windows ...')
        fs.writeFileSync(cliShellEnv, patched)
    }
}

const patchShellPackageScriptsForWindows = () => {
    if (process.platform !== 'win32' || !fs.existsSync(shellPackageJson)) {
        return
    }

    const pkg = JSON.parse(fs.readFileSync(shellPackageJson, 'utf8'))
    const scripts = pkg.scripts ?? {}
    const reactScripts = 'node node_modules/react-scripts/bin/react-scripts.js'
    const nextScripts = {
        ...scripts,
        start: `${reactScripts} start`,
        build: `${reactScripts} build`,
        test: `${reactScripts} test`,
        eject: `${reactScripts} eject`,
    }

    if (JSON.stringify(scripts) !== JSON.stringify(nextScripts)) {
        log('Patching app-shell package scripts to call react-scripts directly on Windows ...')
        pkg.scripts = nextScripts
        fs.writeFileSync(shellPackageJson, `${JSON.stringify(pkg, null, 4)}\n`)
    }
}

const copyShell = () => {
    log(`Copying shell v${installedVersion} to capture-plugin/.d2/shell ...`)
    fs.mkdirSync(shellDst, { recursive: true })
    fs.cpSync(shellSrc, shellDst, {
        recursive: true,
        dereference: true,
        filter: (src) => {
            const rel = path.relative(shellSrc, src)
            if (rel === '') return true
            if (rel.startsWith('node_modules')) return false
            if (rel.startsWith('.pnp')) return false
            return true
        },
    })
}

const ensureJunction = () => {
    let needsCreate = true
    try {
        const stats = fs.lstatSync(linkPath)
        if (stats.isSymbolicLink() || stats.isDirectory()) {
            const currentTarget = fs.realpathSync(linkPath)
            needsCreate = currentTarget !== fs.realpathSync(linkTarget)
        }
    } catch {
        needsCreate = true
    }

    if (needsCreate) {
        removeIfExists(linkPath)
        log('Creating junction for capture-plugin/.d2/shell/node_modules ...')
        fs.symlinkSync(linkTarget, linkPath, 'junction')
    } else {
        log('Junction already exists.')
    }
}

const syncPluginSource = () => {
    if (!fs.existsSync(path.join(pluginSrc, 'Plugin.js'))) {
        log('src/Plugin.js does not exist yet; skipping dev source preload.')
        return
    }

    log('Syncing capture-plugin/src to .d2/shell/src/D2App ...')
    removeIfExists(shellD2App)
    fs.mkdirSync(shellD2App, { recursive: true })
    fs.cpSync(pluginSrc, shellD2App, {
        recursive: true,
        dereference: true,
    })
}

const currentVersion = readShellVersion()

patchYarnCommandForWindows()
patchShellEnvForWindows()

if (currentVersion === installedVersion) {
    log(`Shell v${installedVersion} already bootstrapped.`)
    ensureJunction()
    syncPluginSource()
    patchShellPackageScriptsForWindows()
    process.exit(0)
}

if (currentVersion !== null) {
    log(`Shell is outdated (${currentVersion} vs ${installedVersion}); rebuilding ...`)
    removeIfExists(shellDst)
}

copyShell()
ensureJunction()
syncPluginSource()
patchShellPackageScriptsForWindows()
log('Done.')
