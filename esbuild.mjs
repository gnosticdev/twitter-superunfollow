#!/usr/bin/env node

import esbuild from 'esbuild'

const context = await esbuild.context({
    entryPoints: ['src/main.ts'],
    bundle: true,
    outfile: 'dist/bundle.js',
    target: 'es2020',
    logLevel: 'debug',
    sourcemap: 'external',
    footer: {
        js: '//# sourceMappingURL=file:///Users/divinelight/Coding/twitter-super-unfollow/dist/bundle.js.map',
    },
})

try {
    if (process.argv.includes('--watch')) {
        await context.watch()
    } else {
        const result = await context.rebuild()
        await context.dispose()
        if (result.errors.length > 0) {
            throw new Error(result.errors.join('\n'))
        }
    }
} catch (e) {
    console.error(e)
    process.exit(1)
}
