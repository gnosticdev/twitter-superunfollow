const SANDBOX_RESULT_ID = 'sandbox-result'

interface Window {
    __INITIAL_STATE__: any
}

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

    const data = event.data

    status.innerHTML = event.data

    try {
        if (typeof data === 'string' && data.includes('__INITIAL_STATE__')) {
            var eval2 = eval
            eval2(data)
            // should now be available in window.__INITIAL_STATE__
            const userData = JSON.parse(
                JSON.stringify(window.__INITIAL_STATE__)
            )

            const key = Object.keys(userData.entities.users.entities)[0]
            const accountData = userData.entities.users.entities[key]

            window.localStorage.setItem('userData', JSON.stringify(accountData))

            const followingCount = accountData.friends_count

            const followingDiv = document.createElement('div')
            followingDiv.setAttribute('id', 'su-following-count')
            followingDiv.setAttribute('data-following-count', followingCount)

            document.body.append(followingDiv)
            console.log('sandbox eval() done', window)
        }
        const userData = JSON.parse(JSON.stringify(window.__INITIAL_STATE__))

        source.window.postMessage(userData, '*')
    } catch (e) {
        console.error(e)
    }
})
