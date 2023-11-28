import { coolConsole } from '@gnosticdev/cool-console'
import { retainTraces } from '@gnosticdev/cool-console/plugins'
import fs from 'fs'
import path from 'node:path'

const entrypoints = [
    'src/content/main.ts',
    'src/popup/popup.ts',
    'src/temp-tab/temp-tab.ts',
    'src/sandbox/sandbox.ts',
    'src/background/service-worker.ts',
].map((file) => path.join(process.cwd(), file))

const copyFiles = [
    'manifest.json',
    'src/sandbox/sandbox.html',
    'src/popup/popup.html',
    'src/temp-tab/temp-tab.html',
    'src/style.css',
].map((file) => path.join(process.cwd(), file))

const buildScripts = async () => {
    const buildOutput = await Bun.build({
        entrypoints,
        outdir: './dist',
        naming: '[name].[ext]',
        loader: {
            '.html': 'file',
        },
        target: 'browser',
        sourcemap: 'external',
        plugins: [retainTraces],
    })

    for await (const file of copyFiles) {
        // only use the file name
        const dest = path.join(process.cwd(), 'dist', path.basename(file))
        fs.cp(file, dest, (err) => {
            if (err) console.log(err)
        })
    }

    return buildOutput
}

const buildOutput = await buildScripts()
if (!buildOutput.success) {
    coolConsole.red('build failed')
    process.exit(1)
}
coolConsole.blue('build complete')

const watcher = fs.watch(process.cwd(), { recursive: true })

watcher.addListener('change', async (_event, filename) => {
    if (typeof filename !== 'string') return
    const absolutePath = path.join(process.cwd(), filename)
    if (
        entrypoints
            .map((entry) => path.dirname(entry))
            .includes(path.dirname(absolutePath)) ||
        filename === 'build.config.ts' ||
        copyFiles.includes(absolutePath)
    ) {
        coolConsole.blue(`File ${filename} changed`)
        await buildScripts()
    }
})

process.on('SIGINT', () => {
    watcher.close()
    process.exit(0)
})
