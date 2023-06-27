// get request from content script to start running
chrome.runtime.onMessage.addListener(
    (msg: IMessage<'content', 'background'>, _, sendResponse) => {
        if (msg.from === 'content' && msg.request === 'start') {
            console.log('background received message from content script')
            sendResponse({
                from: 'background',
                to: 'content',
                request: 'start',
            })
        }
    }
)

// 1) show popup.html when user arrives on Following page
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0]
    if (!tab) {
        throw 'no tab found'
    }
    if (tab.url?.includes('Following')) {
        chrome.pageAction.show(tab.id!)
    }
})
