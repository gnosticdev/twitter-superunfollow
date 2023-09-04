import { sendMessageToBg } from '@/shared/messaging'

// 1) Receive the userData string from background script
chrome.runtime.onMessage.addListener(async (msg: FromBgToTab, sender) => {
    try {
        if (
            msg.from === 'background' &&
            msg.type === 'userData' &&
            msg.to === 'newTab' &&
            msg.data
        ) {
            console.log('newTab received message', msg, sender)
            const dataString = msg.data
            if (!dataString) {
                throw 'no data string found'
            }

            // 2) send the userData string to sandbox to start eval()
            const iframe = document.querySelector('iframe') as HTMLIFrameElement
            iframe.contentWindow!.postMessage(dataString, '*')
        }
    } catch (e) {
        console.log(e)
    }
})

// 3) receive the userData object - aka eval() result - from sandbox
window.addEventListener(
    'message',
    async (event: MessageEvent<TwitterUserData>) => {
        try {
            // 4) send the userData object back to background script
            const msg: FromTabToBg = {
                from: 'newTab',
                to: 'background',
                type: 'userData',
                data: event.data,
            }
            await sendMessageToBg(msg)
        } catch (e) {
            console.error(e)
        }
    }
)
