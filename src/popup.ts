export const POPUP_RESULT_ID = 'popup-result'

// 2) Receive message from content script
chrome.runtime.onMessage.addListener(
    (msg: IMessage<'content', 'popup'>, sender) => {
        console.log('popup received message', msg, sender)
        if (msg.from === 'content' && msg.request === 'userData') {
            console.log('popup recieved userData')
            console.log(msg)
            const dataString = msg.data
            if (!dataString) {
                throw 'no data string found'
            }
            const status = document.getElementById(POPUP_RESULT_ID)
            if (!status) {
                throw 'no status element found'
            }
            status.innerHTML = dataString
            // 3) send message to sandbox to start eval()
            const iframe = document.querySelector('iframe') as HTMLIFrameElement
            iframe.contentWindow!.postMessage(dataString, '*')
        }
    }
)

// 4) receive message from sandbox
window.addEventListener('message', (event) => {
    const result = document.getElementById(POPUP_RESULT_ID)
    console.log(event)
    if (!result) {
        throw 'no status element found'
    }
    result.innerHTML = JSON.stringify(event.data)
})
