import { prettyConsole } from '@/content/utils/console'
import { NEW_TAB_PAGE, objectEntries } from '../shared/shared'
import { Storage } from '@plasmohq/storage'

class SyncStorage<T extends { [K in keyof T]: T[K] } = TwitterUserData> {
    namespace = 'SuperUnfollow_'
    private storage: Storage
    constructor() {
        this.storage = new Storage({ copiedKeyList: ['screen_name'] })
        this.storage.setNamespace(this.namespace)
    }
    async getValue<K extends keyof T & string>(key: K): Promise<T[K]> {
        return this.storage.get(key)
    }

    async setValue<K extends keyof T & string>(
        key: K,
        value: T[K]
    ): Promise<void> {
        return this.storage.set(key, value)
    }

    async setValues(data: T): Promise<void> {
        for (const [key, value] of objectEntries(data)) {
            await this.setValue(
                key as keyof T & string,
                value as T[keyof T & string]
            )
        }
    }

    watch<K extends keyof T & string>(
        key: K,
        callback: (change: { newValue: T[K]; oldValue: T[K]; key: K }) => void
    ) {
        this.storage.watch({
            [key]: (change) => {
                callback({
                    newValue: change.newValue as T[K],
                    oldValue: change.oldValue as T[K],
                    key: key,
                })
            },
        })
    }
}

interface SessionStorageKV {
    contentTabId: number
    newTab: number
}

class SessionStorage<K extends keyof SessionStorageKV> {
    namespace = 'SuperUnfollow_'
    private storage: Storage
    constructor() {
        this.storage = new Storage({ area: 'session' })
        this.storage.setNamespace(this.namespace)
    }
    async getValue(key: K): Promise<SessionStorageKV[K]> {
        const value = await this.storage.get(key)
        return parseInt(value)
    }

    async setValue(key: K, value: number) {
        return this.storage.set(key, value)
    }
}

const syncStorage$ = new SyncStorage<TwitterUserData>()
// Watch for changes to screen_name
syncStorage$.watch('screen_name', (change) => {
    prettyConsole(`${change.key} changed in sync storage: `, 'green', change)
})

const sessionStorage$ = new SessionStorage()

// get userData string from content and send to Tab -> does not return anything
// Listen for messages from content script and newTab
const listenForContentScript = async (
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
        console.log('background received userData from content', msg)
        const newTab = await createNewTab()
        await sessionStorage$.setValue('contentTabId', senderTab.id)
        await sendDataToTab(msg.data, newTab)

        // --> Remove listener after first message
        // chrome.runtime.onMessage.removeListener(contentListner)

        // --> Add listener for messages from newTab
        chrome.runtime.onMessage.addListener(listenForTabs)
    }
}

chrome.runtime.onMessage.addListener(listenForContentScript)

// userData sent to background from newTab, then send to content script
const listenForTabs = async (msg: ExtMessage) => {
    if (msg.from === 'newTab' && msg.to === 'background' && msg.data) {
        console.log('background received userData from newTab', msg)
        console.log('adding to chrome storage')
        await syncStorage$.setValues(msg.data)
        const bgToContentMsg: FromBgToCs = {
            from: 'background',
            to: 'content',
            type: 'userData',
            data: msg.data,
        }
        const contentTabId = await sessionStorage$.getValue('contentTabId')
        await sendMessageToCs(contentTabId, bgToContentMsg)

        // Remove listener after first message
        chrome.runtime.onMessage.removeListener(listenForTabs)

        // delete the new tab
        const newTabId = await sessionStorage$.getValue('newTab')
        await chrome.tabs.remove(newTabId)
    }
}

export const sendMessageToCs = async <T extends FromBgToCs>(
    tabId: number,
    message: T
) => {
    console.log('sending message to content script...', message, tabId)
    const response = await chrome.tabs.sendMessage<
        T,
        T extends FromBgToCs ? string : never
    >(tabId, message)

    return response
}

export const sendMessageToTab = async <T extends FromBgToTab>(
    tabId: number,
    message: T
) => {
    console.log('sending message to tab...', message, tabId)
    const response = await chrome.tabs.sendMessage<
        T,
        T extends FromBgToTab ? string : never
    >(tabId, message)

    return response
}

export const sendMessageToBg = async <T extends FromCsToBg | FromTabToBg>(
    message: T
) => {
    console.log('sending message to background...', message)
    const response = await chrome.runtime.sendMessage<
        T,
        T extends FromCsToBg
            ? string
            : T extends FromTabToBg
            ? TwitterUserData
            : never
    >(message)

    return response
}

async function sendDataToTab(data: string, tab: chrome.tabs.Tab) {
    try {
        const msg: FromBgToTab = {
            from: 'background',
            to: 'newTab',
            type: 'userData',
            data: data,
        }
        await sendMessageToTab(tab.id!, msg)
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
    await sessionStorage$.setValue('newTab', tab.id!)
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

// Listen for tab updates, send message to content script on /username/following page
// chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
//     if (changeInfo.status === 'complete' && tab.url?.includes('twitter.com')) {
//         const username = await plasmoStorage.get('screen_name')
//         console.log('twitter username', username)
//         await sendMessage(tabId, {
//             from: 'background',
//             to: 'content',
//             type: 'start',
//         })
//     }
// })
