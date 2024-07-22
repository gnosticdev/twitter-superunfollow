import { sendMessageToCs, sendMessageToTab } from '@/shared/messaging'
import { $sessionStorage, $syncStorage } from '@/shared/storage'
import type { ExtMessage, FromBgToCs } from '@/shared/types'
import cc from 'kleur'

// New tab used to parse userData in a sandboxed environment
const NEW_TAB_PAGE = 'temp-tab.html'

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
	command === 'reload-everything' && reloadEverything()
})
// get userData string from content and send to Tab -> does not return anything
// Listen for messages from content script and newTab
chrome.runtime.onMessage.addListener(listenForContentMsg)
async function listenForContentMsg(
	msg: ExtMessage,
	sender: chrome.runtime.MessageSender,
) {
	const { tab: senderTab } = sender
	if (!senderTab || !senderTab.id) {
		console.log(console.log(cc.red(`⚠️ sender.tab not defined: ${msg}`)))
		return
	}
	// messages sent from content script
	if (
		msg.from === 'content' &&
		msg.to === 'background' &&
		msg.type === 'userData' &&
		msg.data
	) {
		console.log(
			cc.yellow('background received userData from content script:'),
			msg,
		)
		console.trace('background received userData from content script')
		const newTab = await createTempTab()
		await $sessionStorage.setValue('contentTabId', senderTab.id)
		await sendMessageToTab(newTab.id!, {
			from: 'background',
			to: 'newTab',
			type: 'userData',
			data: msg.data,
		})

		// --> Add listener for messages from newTab
		chrome.runtime.onMessage.addListener(listenForUserData)
	}
}
// userData sent to background from newTab.
// Added in listenForContentMsg (above)
async function listenForUserData(msg: ExtMessage) {
	if (msg.from === 'newTab' && msg.to === 'background' && msg.data) {
		console.log(
			cc.blue(
				'background received parsed userData from newTab -> adding to sync storage',
			),
			msg,
		)

		await $syncStorage.setValues(msg.data)
		const bgToContentMsg: FromBgToCs = {
			from: 'background',
			to: 'content',
			type: 'userData',
			data: msg.data,
		}
		// send userData to content script
		const contentTabId = await $sessionStorage.getValue('contentTabId')
		await sendMessageToCs(contentTabId, bgToContentMsg)

		// Remove listener after first message
		chrome.runtime.onMessage.removeListener(listenForUserData)

		// delete the new tab
		const newTabId = await $sessionStorage.getValue('newTabId')
		await chrome.tabs.remove(newTabId)
	}
}

// Listen for tab updates, send message to content script when navigating to/from the /following page so it can add/remove the show dialog button.
chrome.tabs.onUpdated.addListener(handleDialogButton)
async function handleDialogButton(
	tabId: number,
	changeInfo: chrome.tabs.TabChangeInfo,
	tab: chrome.tabs.Tab,
) {
	console.log(cc.bgMagenta('tab updated'), tabId, changeInfo, tab)
	if (changeInfo.status !== 'complete') {
		await waitForTabToLoad(tabId)
	}
	const tabUrl = new URL(tab.url!)
	let username = await $syncStorage.getValue('screen_name')
	console.log(cc.bgMagenta(`username: ${username}`))
	if (!username) {
		console.log('no username found in storage, getting from sync storage')
		username = await $syncStorage.subscribe('screen_name')
		console.log('got username from sync storage', username)
	}
	if (tabUrl.pathname.includes(`${username}/following`)) {
		await sendMessageToCs(tabId, {
			from: 'background',
			to: 'content',
			type: 'adjustDialog',
		})
		return
	}

	const existingTab = await chrome.tabs.query({
		url: `https://x.com/${username}/following*`,
	})
	console.log(existingTab)
	if (existingTab.length > 0) {
		await sendMessageToCs(existingTab[0].id!, {
			from: 'background',
			to: 'content',
			type: 'adjustDialog',
		})
	}
}

// Go to Following Page when extension icon is clicked (no popup)
chrome.action.onClicked.addListener(reloadEverything)
async function reloadEverything(_tab?: chrome.tabs.Tab) {
	const username = await $syncStorage.getValue('screen_name')

	const url = username
		? `https://x.com/${username}/following`
		: 'https://x.com/following'

	const existingTab = await chrome.tabs.query({
		url: `${url}*`,
	})

	console.log('existing tab:', existingTab)

	if (existingTab.length > 0) {
		// activate the existing tab and reload
		await chrome.tabs.update(existingTab[0].id!, { active: true })
		await chrome.tabs.reload({ bypassCache: true })
		chrome.runtime.reload()
		return
	}

	await chrome.tabs.create({ url, active: true })
	chrome.runtime.reload()
}

function waitForTabToLoad(newTabId: number): Promise<chrome.tabs.Tab> {
	return new Promise((resolve) => {
		chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
			if (
				(changeInfo.status === 'complete' &&
					tabId === newTabId &&
					tab.url?.includes(NEW_TAB_PAGE)) ||
				tab.url?.includes('x.com')
			) {
				resolve(tab)
			}
		})
	})
}

// Tab used to parse userData
async function createTempTab() {
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
	await $sessionStorage.setValue('newTabId', tab.id!)
	return tab
}
