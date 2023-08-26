import esbuild from 'esbuild'

const contentContext = await esbuild.context({
    entryPoints: ['src/content/main.ts'],
    bundle: true,
    outfile: 'dist/content.js',
    target: 'es2020',
    format: 'iife',
    logLevel: 'debug',
    sourcemap: 'linked',
})

const popupContent = await esbuild.context({
    entryPoints: ['src/popup/popup.ts'],
    bundle: true,
    outfile: 'dist/popup.js',
    target: 'es2020',
    format: 'iife',
    logLevel: 'debug',
    sourcemap: 'linked',
})

const sandboxContext = await esbuild.context({
    entryPoints: ['src/sandbox/sandbox.ts'],
    bundle: true,
    outfile: 'dist/sandbox.js',
    target: 'es2020',
    format: 'iife',
    logLevel: 'debug',
    sourcemap: 'linked',
})

const backgroundContext = await esbuild.context({
    entryPoints: ['src/background/service-worker.ts'],
    bundle: true,
    outfile: 'dist/service-worker.js',
    target: 'es2020',
    format: 'iife',
    logLevel: 'debug',
    sourcemap: 'linked',
})

const cssBuild = await esbuild.context({
    entryPoints: ['src/style.css'],
    bundle: true,
    outfile: 'dist/style.css',
    target: 'es2020',
    sourcemap: 'linked',
})

const copyContext = await esbuild.context({
    entryPoints: [
        'src/manifest.json',
        'src/sandbox/sandbox.html',
        'src/popup/popup.html',
    ],
    bundle: true,
    outdir: 'dist',
    entryNames: '[name]',
    loader: {
        '.json': 'copy',
        '.html': 'copy',
    },
})

const watchAll = async () => {
    await contentContext.watch()
    await popupContent.watch()
    await sandboxContext.watch()
    await backgroundContext.watch()
    await cssBuild.watch()
    await copyContext.watch()
}

const rebuildAll = async () => {
    await contentContext.rebuild()
    await popupContent.rebuild()
    await sandboxContext.rebuild()
    await backgroundContext.rebuild()
    await cssBuild.rebuild()
    await copyContext.rebuild()
}

const disposeAll = async () => {
    await contentContext.dispose()
    await sandboxContext.dispose()
    await popupContent.dispose()
    await backgroundContext.dispose()
    await cssBuild.dispose()
    await copyContext.dispose()
}

try {
    if (process.argv.includes('--watch')) {
        await watchAll()
    } else {
        await rebuildAll()
        await disposeAll()
    }
} catch (e) {
    console.error(e)
    await disposeAll()
    process.exit(1)
}
