import { TwitterUserData } from '@/shared/types'

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        __INITIAL_STATE__: any
    }
}

const SANDBOX_RESULT_ID = 'sandbox-result'

const parseInititalState = (initialStateObj: any) => {
    const userData = JSON.parse(JSON.stringify(initialStateObj))

    const key = Object.keys(userData.entities.users.entities)[0]
    const accountData = userData.entities.users.entities[key]

    return accountData as TwitterUserData
}

// 1) recive the userData string from the newTab
window.addEventListener('message', (event) => {
    const status = document.getElementById(SANDBOX_RESULT_ID)
    if (!status) {
        throw 'no status element found'
    }

    status.innerHTML = `received message from popup...`
    // set up the source window to send the userData object back to
    const source = event.source as {
        window: WindowProxy
    }

    const { data: scriptContent } = event

    try {
        if (
            typeof scriptContent === 'string' &&
            scriptContent.includes('__INITIAL_STATE__')
        ) {
            // 2) use eval safely within sandbox (while avoiding esbuild eval error)
            const evaluate = eval
            evaluate(scriptContent)
            // original script content should now be available - including window.__INITIAL_STATE__
            const twitterUserData = parseInititalState(window.__INITIAL_STATE__)
            // 5) send the userData object back to popup
            source.window.postMessage(twitterUserData, '*')
        } else {
            throw 'no __INITIAL_STATE__ found'
        }
    } catch (e) {
        console.error(e)
    }
})
