import { parseInititalState } from '@/shared/shared'
const SANDBOX_RESULT_ID = 'sandbox-result'

// 1) recive the userData string from the newTab
window.addEventListener('message', (event) => {
    const status = document.getElementById(SANDBOX_RESULT_ID)
    if (!status) {
        throw 'no status element found'
    }

    status.innerHTML = `received message from popup with data: ${event.data}`
    // set up the source window to send the userData object back to
    const source = event.source as {
        window: WindowProxy
    }

    const { data } = event

    try {
        if (typeof data === 'string' && data.includes('__INITIAL_STATE__')) {
            // 2) use eval safely within sandbox (while avoiding esbuild eval error)
            const evaluate = eval
            evaluate(data)
            // original script content should now be available - including window.__INITIAL_STATE__
            const twitterUserData = parseInititalState(window.__INITIAL_STATE__)
            const { friends_count } = twitterUserData

            console.log(
                'sandbox eval() done',
                'following count:',
                friends_count
            )
            // 5) send the userData object back to popup
            source.window.postMessage(twitterUserData, '*')
        } else {
            throw 'no __INITIAL_STATE__ found'
        }
    } catch (e) {
        console.error(e)
    }
})
