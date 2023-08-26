import { syncStorage$, sessionStorage$ } from '@/shared/storage'
import { sendMessageToTab, sendMessageToCs } from '@/shared/messaging'

export const NEW_TAB_PAGE = 'popup.html'

// get userData string from content and send to Tab -> does not return anything
// Listen for messages from content script and newTab
const listenForContentMsg = async (
    msg: ExtMessage,
    sender: chrome.runtime.MessageSender
) => {
    const { tab: senderTab } = sender
    if (!senderTab || !senderTab.id) {
        console.log(`⚠️ sender.tab not defined. msg: ${msg}`)
        return
    }
    // messages sent from content script
    if (
        msg.from === 'content' &&
        msg.to === 'background' &&
        msg.type === 'userData' &&
        msg.data
    ) {
        console.log('background received userData from content script', msg)
        const newTab = await createNewTab()
        await sessionStorage$.setValue('contentTabId', senderTab.id)
        await sendMessageToTab(newTab.id!, {
            from: 'background',
            to: 'newTab',
            type: 'userData',
            data: msg.data,
        })

        // --> Add listener for messages from newTab
        chrome.runtime.onMessage.addListener(listenForTabMsg)
    }
}

chrome.runtime.onMessage.addListener(listenForContentMsg)

// userData sent to background from newTab, then send to content script
const listenForTabMsg = async (msg: ExtMessage) => {
    if (msg.from === 'newTab' && msg.to === 'background' && msg.data) {
        console.log(
            'background received parsed userData from newTab -> adding to sync storage',
            msg
        )
        await syncStorage$.setValues(msg.data)
        const bgToContentMsg: FromBgToCs = {
            from: 'background',
            to: 'content',
            type: 'userData',
            data: msg.data,
        }
        // send userData to content script
        const contentTabId = await sessionStorage$.getValue('contentTabId')
        await sendMessageToCs(contentTabId, bgToContentMsg)

        // Remove listener after first message
        chrome.runtime.onMessage.removeListener(listenForTabMsg)

        // delete the new tab
        const newTabId = await sessionStorage$.getValue('newTabId')
        await chrome.tabs.remove(newTabId)
    }
}

async function createNewTab() {
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
    await sessionStorage$.setValue('newTabId', tab.id!)
    return tab
}

function waitForTabToLoad(newTabId: number): Promise<chrome.tabs.Tab> {
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

// Listen for tab updates, send message to content script when navigating to/from the /following page so it can add/remove the show dialog button
chrome.tabs.onUpdated.addListener(addRemoveDialogBtn)
async function addRemoveDialogBtn(
    tabid: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
) {
    if (changeInfo.status !== 'complete' || !tab.url) {
        return
    }
    let username = await syncStorage$.getValue('screen_name')
    if (!username) {
        console.log('no username found in storage, getting from sync storage')
        username = await syncStorage$.subscribe('screen_name')
        console.log('got username from sync storage', username)
    }
    if (tab.url.includes(`${username}/following`)) {
        await sendMessageToCs(tabid, {
            from: 'background',
            to: 'content',
            type: 'addDialog',
        })
    } else {
        await sendMessageToCs(tabid, {
            from: 'background',
            to: 'content',
            type: 'removeDialog',
        })
    }
}
