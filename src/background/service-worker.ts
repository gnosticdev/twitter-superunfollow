let csTabId: number

chrome.runtime.onMessage.addListener(
    async (
        msg: CStoBGMessage,
        sender,
        sendResponse: (r: BGtoCSMessage) => any
    ) => {
        const tabId = sender.tab?.id

        if (
            msg.from === 'content' &&
            msg.type === 'start' &&
            msg.to === 'background' &&
            tabId
        ) {
            console.log('content requesting start')
            csTabId = tabId
            sendResponse({
                from: 'background',
                to: 'content',
                type: 'start',
            })
        } else if (
            msg.from === 'content' &&
            msg.to === 'background' &&
            msg.type === 'userData' &&
            msg.data
        ) {
            console.log('background received userData from content')
            const newData = await handleUserData(msg.data)
            sendResponse({
                from: 'background',
                to: 'content',
                type: 'userData',
                data: newData,
            })
        }
    }
)

chrome.runtime.onMessage.addListener(async (msg: PopupToBGMessage) => {
    if (
        msg.from === 'popup' &&
        msg.to === 'background' &&
        msg.type === 'userData' &&
        msg.data
    ) {
        await chrome.tabs.sendMessage<BGtoCSMessage>(csTabId, {
            from: 'background',
            to: 'content',
            type: 'userData',
            data: msg.data,
        })
    }
})

async function handleUserData(data: string) {
    try {
        const tab = await createNewTab()
        console.log('background sending userData to popup')
        const newData = await chrome.tabs.sendMessage(tab.id!, {
            from: 'background',
            to: 'popup',
            type: 'userData',
            data,
        })

        return newData
    } catch (e) {
        console.log(e)
    }
}

const createNewTab = async () => {
    const newTab = await chrome.tabs.create({
        url: chrome.runtime.getURL('popup.html'),
        active: false,
    })
    const newTabId = newTab.id
    if (!newTabId) {
        throw 'no new tab id found'
    }
    const tab = await waitForTabToLoad(newTabId)
    return tab
}

const waitForTabToLoad = async (newTabId: number): Promise<chrome.tabs.Tab> => {
    return new Promise((resolve) => {
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (
                changeInfo.status === 'complete' &&
                tabId === newTabId &&
                tab.url?.includes('popup.html')
            ) {
                console.log('new tab loading complete.', tab)
                resolve(tab)
            }
        })
    })
}

// sidePanel API not yet available on Brave, Arc, or Opera
// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (
//         changeInfo.status === 'complete' &&
//         tab.url?.includes('twitter.com') &&
//         tab.url?.includes('following')
//     ) {
//         chrome.sidePanel.setOptions({
//             enabled: true,
//             path: 'popup.html',
//             tabId,
//         })
//     } else {
//         chrome.sidePanel.setOptions({
//             enabled: false,
//             tabId,
//         })
//     }
// })

// chrome.sidePanel
//     .setPanelBehavior({
//         openPanelOnActionClick: true,
//     })
//     .catch((e) => console.error(e))
