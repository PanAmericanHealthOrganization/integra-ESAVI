#!/usr/bin/env node
/*
 * Workaround para Windows + OneDrive: cli-app-scripts crea un symlink desde
 * node_modules/@dhis2/app-shell/node_modules → .d2/shell/node_modules y eso
 * requiere Developer Mode o admin en Windows. Aquí pre-bootstrapeamos el
 * shell usando una NTFS junction, que NO requiere permisos elevados.
 *
 * Si la versión del shell coincide entre node_modules y .d2/shell, no
 * tocamos nada — d2-app-scripts saltará su bootstrap y tomará nuestra
 * preparación.
 */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const shellSrc = path.resolve(root, 'node_modules', '@dhis2', 'app-shell')
const shellDst = path.resolve(root, '.d2', 'shell')
const linkTarget = path.resolve(shellSrc, 'node_modules')
const linkPath = path.resolve(shellDst, 'node_modules')

const log = (msg) => console.log(`[bootstrap-shell] ${msg}`)

if (!fs.existsSync(shellSrc)) {
    log('node_modules/@dhis2/app-shell no existe — corre `npm install` primero.')
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

const copyShell = () => {
    log(`Copiando shell v${installedVersion} a .d2/shell ...`)
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
            needsCreate = false
        }
    } catch {
        needsCreate = true
    }

    if (needsCreate) {
        log('Creando junction para .d2/shell/node_modules ...')
        fs.symlinkSync(linkTarget, linkPath, 'junction')
    } else {
        log('Junction ya existe.')
    }
}

const currentVersion = readShellVersion()

if (currentVersion === installedVersion) {
    log(`Shell v${installedVersion} ya bootstrapeado.`)
    ensureJunction()
    process.exit(0)
}

if (currentVersion !== null) {
    log(
        `Shell desactualizado (.d2/shell v${currentVersion} vs node_modules v${installedVersion}); rehaciendo ...`,
    )
    removeIfExists(shellDst)
}

copyShell()
ensureJunction()
log('Done.')
