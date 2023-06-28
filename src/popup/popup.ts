const POPUP_RESULT_ID = 'popup-result'

// 2) Receive message from popup script
chrome.runtime.onMessage.addListener(async (msg: BGtoPopupMessage, sender) => {
    try {
        console.log('popup received message', msg, sender)
        if (
            msg.from === 'background' &&
            msg.type === 'userData' &&
            msg.to === 'popup' &&
            msg.data
        ) {
            const dataString = msg.data
            if (!dataString) {
                throw 'no data string found'
            }
            const status = document.getElementById(POPUP_RESULT_ID)
            if (!status) {
                throw 'no status element found'
            }
            // 3) send message to sandbox to start eval()
            const iframe = document.querySelector('iframe') as HTMLIFrameElement
            iframe.contentWindow!.postMessage(dataString, '*')
        }
    } catch (e) {
        console.log(e)
    }
})

// 4) receive message from sandbox
window.addEventListener('message', (event) => {
    try {
        console.log('popup received message from sandbox', event.data)
        document.getElementById(POPUP_RESULT_ID)!.innerHTML = JSON.stringify(
            event.data
        )
        // send to background script
        chrome.runtime.sendMessage<PopupToBGMessage>({
            from: 'popup',
            to: 'background',
            type: 'userData',
            data: event.data,
        })
    } catch (e) {
        console.log(e)
    }
})
