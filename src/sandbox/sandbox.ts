import { parseInititalState } from '../shared/shared'
const SANDBOX_RESULT_ID = 'sandbox-result'

// communicate with the popup
window.addEventListener('message', (event) => {
    const status = document.getElementById(SANDBOX_RESULT_ID)
    if (!status) {
        throw 'no status element found'
    }

    status.innerHTML = `received message from popup with data: ${event.data}`
    // 3) get notified from popup to start eval()
    const source = event.source as {
        window: WindowProxy
    }

    const { data } = event

    try {
        if (typeof data === 'string' && data.includes('__INITIAL_STATE__')) {
            var eval2 = eval
            eval2(data)
            // should now be available in window.__INITIAL_STATE__
            const userData = parseInititalState(window.__INITIAL_STATE__)
            const { friends_count } = userData

            console.log(
                'sandbox eval() done',
                'following count:',
                friends_count,
                'userData:',
                userData
            )
            source.window.postMessage(userData, '*')
        } else {
            throw 'no __INITIAL_STATE__ found'
        }
    } catch (e) {
        console.error(e)
    }
})
