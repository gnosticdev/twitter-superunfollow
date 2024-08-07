import { sendMessageToCs, sendMessageToTab } from '@/shared/messaging'
import { $sessionStorage, $userData } from '@/shared/storage'
import type { ExtMessage, FromBgToCs } from '@/shared/types'
import cc from 'kleur'

// New tab used to parse userData in a sandboxed environment
const NEW_TAB_PAGE = 'temp-tab.html'

$sessionStorage.setValue('showedDialog', false).then(() => {
	console.log('showedDialog set to false')
})

$sessionStorage.watch('showedDialog', (change) => {
	console.log('showedDialog changed', change)
})

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

		await $userData.setValues(msg.data)
		const bgToContentMsg: FromBgToCs = {
			from: 'background',
			to: 'content',
			type: 'userData',
			data: msg.data,
		}
		// send userData to content script
		const contentTabId = await $sessionStorage.getValue('contentTabId')
		if (typeof contentTabId !== 'number') {
			return
		}
		await sendMessageToCs(contentTabId, bgToContentMsg)

		// Remove listener after first message
		chrome.runtime.onMessage.removeListener(listenForUserData)

		// delete the new tab
		const newTabId = await $sessionStorage.getValue('newTabId')
		if (typeof newTabId !== 'number') {
			return
		}
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
	if (!tab?.url?.includes('x.com') || !tab?.url || !tab?.id) return
	if (changeInfo.status !== 'complete') return
	const loadedTab = await waitForTabToLoad(tab.id)
	const tabUrl = new URL(loadedTab.url!)
	const username =
		(await $userData.getValue('screen_name')) ||
		(await $userData.subscribe('screen_name'))

	if (!username) {
		console.log('No username found in storage')
		return
	}

	const isFollowingPage = tabUrl.pathname.includes(`${username}/following`)
	const showedDialog = await $sessionStorage.getValue('showedDialog')
	console.log(cc.red('tab updated'), { isFollowingPage, showedDialog })

	if (isFollowingPage && !showedDialog) {
		await triggerDialogShow(tabId)
	} else if (!isFollowingPage && showedDialog) {
		await sendMessageToCs(tabId, {
			from: 'background',
			to: 'content',
			type: 'adjustDialog',
			data: { url: tab.url, show: false },
		})
		await $sessionStorage.setValue('showedDialog', false)
	}
}

// ... rest of the code ...

// Go to Following Page when extension icon is clicked (no popup)
chrome.action.onClicked.addListener(reloadEverything)
/**
 * Reload the /following page, or open a new tab if it is not open
 * @param _tab - the tab that was active when the icon was clicked
 */

async function reloadEverything(_tab?: chrome.tabs.Tab) {
	const username = await $userData.getValue('screen_name')

	const url = username
		? `https://x.com/${username}/following`
		: 'https://x.com/following'

	const [existingTab] = await chrome.tabs.query({
		url: `${url}*`,
	})

	console.log('reloaded tabs -> existingTab:', existingTab)

	// reset showedDialog to false
	$sessionStorage.setValue('showedDialog', false)

	if (existingTab) {
		// activate the existing tab and reload
		await chrome.tabs.update(existingTab.id!, { active: true })
		await chrome.tabs.reload(existingTab.id!, { bypassCache: true })
	} else {
		// Create a new tab
		const newTab = await chrome.tabs.create({ url, active: true })
		// Wait for the tab to load completely
		await waitForTabToLoad(newTab.id!)
	}
}

async function triggerDialogShow(tabId: number) {
	await sendMessageToCs(tabId, {
		from: 'background',
		to: 'content',
		type: 'adjustDialog',
		data: { show: true },
	})
	await $sessionStorage.setValue('showedDialog', true)
}

type ListenerCallback = (
	tabId: number,
	changeInfo: chrome.tabs.TabChangeInfo,
	tab: chrome.tabs.Tab,
) => void

/**
 * Wait for the tab to complete loading
 */
function waitForTabToLoad(tabId: number): Promise<chrome.tabs.Tab> {
	return new Promise((resolve) => {
		const callback: ListenerCallback = (id, changeInfo, tab) => {
			if (changeInfo.status === 'complete' && id === tabId) {
				resolve(tab)
				chrome.tabs.onUpdated.removeListener(callback)
			}
		}
		chrome.tabs.onUpdated.addListener(callback)
	})
}

// Tab used to parse userData
async function createTempTab() {
	// check if existing tab is already open
	const existingTabs = await chrome.tabs.query({
		url: chrome.runtime.getURL(NEW_TAB_PAGE),
	})
	if (existingTabs.length > 0) {
		console.log(cc.green('existing temp tab found'), existingTabs[0])
		return existingTabs[0]
	}
	console.log(cc.red('no existing temp tab found, creating new tab'))
	const newTab = await chrome.tabs.create({
		url: chrome.runtime.getURL(NEW_TAB_PAGE),
		active: false,
	})
	const newTabId = newTab.id
	if (!newTabId) {
		throw 'no new tab id found'
	}
	const loadedTab = await waitForTabToLoad(newTabId)
	await $sessionStorage.setValue('newTabId', loadedTab.id!)
	return loadedTab
}
