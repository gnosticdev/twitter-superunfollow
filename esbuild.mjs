import esbuild from 'esbuild'

const contentContext = await esbuild.context({
    entryPoints: ['src/content/index.ts'],
    bundle: true,
    outfile: 'dist/content.js',
    target: 'es2020',
    logLevel: 'debug',
    sourcemap: 'external',
    footer: {
        js: '//# sourceMappingURL=file:///Users/divinelight/Coding/twitter-super-unfollow/dist/content.js.map',
    },
})

const popupContext = await esbuild.context({
    entryPoints: ['src/popup.ts'],
    bundle: true,
    outfile: 'dist/popup.js',
    target: 'es2020',
    logLevel: 'debug',
    sourcemap: 'external',
    footer: {
        js: '//# sourceMappingURL=file:///Users/divinelight/Coding/twitter-super-unfollow/dist/popup.js.map',
    },
})

const sandboxContext = await esbuild.context({
    entryPoints: ['src/sandbox.ts'],
    bundle: true,
    outfile: 'dist/sandbox.js',
    target: 'es2020',
    logLevel: 'debug',
    sourcemap: 'external',
    footer: {
        js: '//# sourceMappingURL=file:///Users/divinelight/Coding/twitter-super-unfollow/dist/sandbox.js.map',
    },
})

const backgroundContext = await esbuild.context({
    entryPoints: ['src/background.ts'],
    bundle: true,
    outfile: 'dist/background.js',
    target: 'es2020',
    logLevel: 'debug',
    sourcemap: 'inline',
})

const cssBuild = await esbuild.context({
    entryPoints: ['src/style.css'],
    bundle: true,
    outfile: 'dist/style.css',
    target: 'es2020',
    sourcemap: 'external',
    footer: {
        js: '//# sourceMappingURL=file:///Users/divinelight/Coding/twitter-super-unfollow/dist/style.css.map',
    },
})

const copyContext = await esbuild.context({
    entryPoints: ['src/manifest.json', 'src/sandbox.html', 'src/popup.html'],
    bundle: true,
    outdir: 'dist',
    outbase: 'src',
    loader: {
        '.json': 'copy',
        '.html': 'copy',
    },
})

const watchAll = async () => {
    await contentContext.watch()
    await popupContext.watch()
    await sandboxContext.watch()
    await backgroundContext.watch()
    await cssBuild.watch()
    await copyContext.watch()
}

const rebuildAll = async () => {
    await contentContext.rebuild()
    await popupContext.rebuild()
    await sandboxContext.rebuild()
    await backgroundContext.rebuild()
    await cssBuild.rebuild()
    await copyContext.rebuild()
}

const disponAll = async () => {
    await contentContext.dispose()
    await sandboxContext.dispose()
    await popupContext.dispose()
    await backgroundContext.dispose()
    await cssBuild.dispose()
    await copyContext.dispose()
}

try {
    if (process.argv.includes('--watch')) {
        await watchAll()
    } else {
        await rebuildAll()
        await disponAll()
    }
} catch (e) {
    console.error(e)
    await disponAll()
    process.exit(1)
}
