export async function sendMessageToCs<T extends FromBgToCs>(
    tabId: number,
    message: T
) {
    console.log('sending message to content script...', message, tabId)
    const response = await chrome.tabs.sendMessage<
        T,
        T extends FromBgToCs ? string : never
    >(tabId, message)

    return response
}

export async function sendMessageToTab<T extends FromBgToTab>(
    tabId: number,
    message: T
) {
    console.log('sending message to tab...', message, tabId)
    const response = await chrome.tabs.sendMessage<
        T,
        T extends FromBgToTab ? string : never
    >(tabId, message)

    return response
}

export async function sendMessageToBg<T extends FromCsToBg | FromTabToBg>(
    message: T
) {
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
