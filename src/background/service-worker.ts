import { NEW_TAB_PAGE } from '../shared/shared'

const saveSessionTabId = async (
    tabName: 'contentTabId' | 'newTab',
    tabId: number
) => {
    await chrome.storage.session.set({ [tabName]: tabId })
}

const getSessionTabId = async (tabName: 'contentTabId' | 'newTab') => {
    const tabs = (await chrome.storage.session.get(tabName)) as {
        [tabName: string]: number
    }
    return tabs[tabName]
}

// get userData string from content and send to Tab -> does not return anything
const contentListner = async (
    msg: CStoBGMessage | TabToBGMessage,
    sender: chrome.runtime.MessageSender
) => {
    if (!sender.tab || !sender.tab.id) {
        throw 'no sender.tab found'
    }
    // messages sent from content script
    if (
        msg.from === 'content' &&
        msg.to === 'background' &&
        msg.type === 'userData' &&
        msg.data
    ) {
        console.log('background received userData from content', msg)
        await saveSessionTabId('contentTabId', sender.tab.id)
        const newTab = await createNewTab()
        await saveSessionTabId('newTab', newTab.id!)
        await sendDataToTab(msg.data, newTab)
        chrome.runtime.onMessage.removeListener(contentListner) // --> Remove listener after first message
        chrome.runtime.onMessage.addListener(tabListener) // --> Add listener for messages from newTab
    }
}

// Listener for messages from content script and newTab
chrome.runtime.onMessage.addListener(contentListner)

// userData sent to background from newTab, then send to content script
const tabListener = async (msg: CStoBGMessage | TabToBGMessage) => {
    if (isTabToBgMessage(msg) && msg.data) {
        console.log('background received userData from newTab', msg)
        const bgToContentMsg: BGtoCSMessage = {
            from: 'background',
            to: 'content',
            type: 'userData',
            data: msg.data,
        }
        const contentTabId = await getSessionTabId('contentTabId')
        await sendMessage(contentTabId, bgToContentMsg)
        chrome.runtime.onMessage.removeListener(tabListener) // --> Remove listener after first message
        // delete the new tab
        const newTabId = await getSessionTabId('newTab')
        await chrome.tabs.remove(newTabId)
    }
}

export const sendMessage = async <T extends ChromeMessage>(
    tabId: T extends BGtoCSMessage | BGtoTabMessage ? number : undefined,
    message: T
) => {
    if (tabId) {
        console.log('sending message to tab..', message, tabId)
        const response = await chrome.tabs.sendMessage<
            T,
            T extends BGtoCSMessage
                ? TwitterUserData
                : T extends BGtoTabMessage
                ? void
                : never
        >(tabId, message)

        return response
    } else {
        console.log('sending message to background..', message, tabId)
        const response = await chrome.runtime.sendMessage<
            T,
            T extends CStoBGMessage
                ? string
                : T extends TabToBGMessage
                ? TwitterUserData
                : never
        >(message)

        return response
    }
}

async function sendDataToTab(data: string, tab: chrome.tabs.Tab) {
    try {
        const msg: BGtoTabMessage = {
            from: 'background',
            to: 'newTab',
            type: 'userData',
            data: data,
        }
        await sendMessage(tab.id!, msg)
    } catch (e) {
        console.error(e)
    }
}

const createNewTab = async () => {
    // check if existing tab is already open
    const existingTabs = await chrome.tabs.query({
        url: chrome.runtime.getURL(NEW_TAB_PAGE),
    })
    if (existingTabs.length > 0) {
        console.log('existing tab found', existingTabs[0])
        return existingTabs[0]
    }
    const newTab = await chrome.tabs.create({
        url: chrome.runtime.getURL(NEW_TAB_PAGE),
        active: false,
    })
    const newTabId = newTab.id
    if (!newTabId) {
        throw 'no new tab id found'
    }
    const tab = await waitForTabToLoad(newTabId)
    console.log('new tab created and loaded.', tab)
    saveSessionTabId('newTab', tab.id!)
    return tab
}

const waitForTabToLoad = (newTabId: number): Promise<chrome.tabs.Tab> => {
    return new Promise((resolve) => {
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (
                changeInfo.status === 'complete' &&
                tabId === newTabId &&
                tab.url?.includes(NEW_TAB_PAGE)
            ) {
                resolve(tab)
            }
        })
    })
}

const isTabToBgMessage = (msg: ChromeMessage): msg is TabToBGMessage => {
    if (
        msg.from === 'newTab' &&
        msg.to === 'background' &&
        msg.type === 'userData' &&
        msg.data
    ) {
        return true
    } else {
        return false
    }
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
