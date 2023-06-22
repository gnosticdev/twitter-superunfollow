import esbuild from 'esbuild'

const context = await esbuild.context({
    entryPoints: ['src/main.ts'],
    bundle: true,
    outfile: 'dist/bundle.js',
    target: 'es2020',
    sourcemap: 'external',
    footer: {
        js: '//# sourceMappingURL=file:///Users/divinelight/Coding/twitter-super-unfollow/dist/bundle.js.map',
    },
})

if (process.argv.includes('--watch')) {
    await context.watch(async (error, result) => {
        if (error) {
            console.error(error)
            return
        }

        console.log(result)
    })

    console.log('Watching...')
} else {
    const result = await context.rebuild()
}
