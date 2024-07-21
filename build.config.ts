import fs from 'node:fs'
import path from 'node:path'
import coolConsole from 'kleur'

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
	// remove the dist folder
	await Bun.$`rm -rf ./dist && echo 'removed dist dir'`.nothrow()

	const buildOutput = await Bun.build({
		entrypoints,
		outdir: './dist',
		naming: '[name].[ext]',
		loader: {
			'.html': 'file',
		},
		target: 'browser',
		sourcemap: 'external',
	})

	if (buildOutput.logs.length) {
		console.error(buildOutput.logs)
		throw new Error('build failed')
	}

	for await (const file of copyFiles) {
		// only use the file name
		const dest = path.join(process.cwd(), 'dist', path.basename(file))
		fs.cp(file, dest, (err) => {
			if (err) console.log(err)
		})
	}

	console.log(coolConsole.blue('build complete'))
	if (!buildOutput.success) {
		console.log(coolConsole.red('build failed'))
		process.exit(1)
	}
	return buildOutput
}

if (import.meta.main) {
	console.log(coolConsole.green('Building scripts'))
	await buildScripts()
} else {
	console.log(coolConsole.green('rebuilding scripts'))
	await buildScripts()
}

const watcher = fs.watch(process.cwd(), { recursive: true })

watcher.addListener('change', async (_event, filename) => {
	if (typeof filename !== 'string') return
	const absolutePath = path.join(process.cwd(), filename)
	if (absolutePath.includes('dist')) return
	if (absolutePath.includes('node_modules')) return
	if (absolutePath.includes('.git')) return
	if (absolutePath.includes('.vscode')) return
	await buildScripts()
})

process.on('SIGINT', () => {
	watcher.close()
	process.exit(0)
})
