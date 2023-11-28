import {
    FromBgToCs,
    FromBgToTab,
    FromCsToBg,
    FromTabToBg,
    TwitterUserData,
} from '@/shared/types'
import { coolConsole } from '@gnosticdev/cool-console'

export async function sendMessageToCs<T extends FromBgToCs>(
    tabId: number,
    message: T,
) {
    coolConsole.orange('sending message to content script...').obj(message)
    const response = await chrome.tabs.sendMessage<
        T,
        T extends FromBgToCs ? string : never
    >(tabId, message)

    return response
}

export async function sendMessageToTab<T extends FromBgToTab>(
    tabId: number,
    message: T,
) {
    coolConsole.orange('sending message to new tab...').obj(message)
    const response = await chrome.tabs.sendMessage<
        T,
        T extends FromBgToTab ? string : never
    >(tabId, message)

    return response
}

export async function sendMessageToBg<T extends FromCsToBg | FromTabToBg>(
    message: T,
) {
    coolConsole.orange('sending message to background script...').obj(message)
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
