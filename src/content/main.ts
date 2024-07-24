import { processProfile } from '@/content/profiles'
import {
	$collectedFollowing,
	$followingCount,
} from '@/content/stores/persistent'
import { addDialogToDom } from '@/content/ui/dialog'
import { Selectors, getInnerProfiles } from '@/content/utils/ui-elements'
import { sendMessageToBg } from '@/shared/messaging'
import { $userData } from '@/shared/storage'
import type { FromBgToCs, FromCsToBg, ProfileInner } from '@/shared/types'
import cc from 'kleur'
import { atom } from 'nanostores'

const $dialogAdded = atom(false)
const $isObserving = atom(false)

// 1) send message to background.ts -> receive the response and start init()
// TODO: add this as an option
// export const FOLLOWS_YOU = '[data-testid="userFollowIndicator"]'
init().then(() => {
	console.log('loaded SuperUnfollow content script')
})
/*  -------- 1) send message to service worker ----------
    -------- receive the response and start init() ---------- */
async function init() {
	const scripts = document.querySelectorAll('script')
	const script = Array.from(scripts).find((script) =>
		script.innerHTML.includes('__INITIAL_STATE__'),
	)

	if (!script) {
		throw 'script has not loaded yet'
	}
	const userDataMessage: FromCsToBg = {
		from: 'content',
		to: 'background',
		type: 'userData',
		data: script.innerHTML,
	}

	console.log('$syncStorage: friends_count -> ', await $followingCount())

	$userData.watch('friends_count', ({ key, newValue, oldValue }) => {
		console.log(
			`$$twitterSyncStorage: ${key} changed from ${oldValue} to ${newValue}`,
		)
	})
	$userData.watch('screen_name', ({ key, newValue, oldValue }) => {
		console.log(
			`$$twitterSyncStorage: ${key} changed from ${oldValue} to ${newValue}`,
		)
	})
	// send the userData as a string to the backgrounds cript, which then sends it to the newTab
	// need to send after we register the storage listeners
	await sendMessageToBg(userDataMessage)

	/*  -------- 2) receive the response from service worker and start init() ----------
        -------- add listener for message from background.ts ---------- */
	chrome.runtime.onMessage.addListener(listenForBgMessage)
	async function listenForBgMessage(msg: FromBgToCs) {
		try {
			if (msg.type === 'userData' && msg.data) {
				console.log(
					cc.cyan(
						`message from bg: followingCount: ${msg.data.friends_count}, collected: ${
							$collectedFollowing.get().size
						}`,
					),
				)
			}
			if (msg.type === 'adjustDialog') {
				console.log(cc.cyan('adjustDialog message received'), msg)
				if (msg.data.show) {
					await showDialog()
				} else {
					await hideDialog()
				}
			}
		} catch (e) {
			console.log(e)
		}
	}
}

// New function to handle showing the dialog
async function showDialog() {
	if (document.getElementById('su-dialog')) {
		console.log('dialog already exists')
		return
	}
	const followingSection = await getFollowingSection()
	if (followingSection) {
		await addDialogToDom(followingSection)
		$dialogAdded.set(true)
		await startObserver(followingSection)
		$isObserving.set(true)
	}
}

// New function to handle hiding the dialog
async function hideDialog() {
	console.log('removing dialog')
	removeDialogFromDom()
	$dialogAdded.set(false)
	disconnectObserver()
	$isObserving.set(false)
}

function removeDialogFromDom() {
	const dialog = document.getElementById('su-dialog')
	if (dialog) {
		dialog.remove()
	}
}

const profileObserver = new MutationObserver(async (mutations) => {
	for (const mutation of mutations) {
		if (mutation.addedNodes.length === 0) {
			continue
		}
		for (const node of Array.from(mutation.addedNodes)) {
			if (node instanceof HTMLElement) {
				const profileInner = node.querySelector<ProfileInner>(
					Selectors.PROFILE_INNER,
				)
				if (node.matches(Selectors.PROFILE_CONTAINER) && profileInner) {
					await processProfile(profileInner)
				}
			}
		}
	}
})

function disconnectObserver() {
	profileObserver.disconnect()
}

// Start the observer after the userData has been received, and we are on the /following page
async function startObserver(followingSection: HTMLElement) {
	// first make sure the following section is in the DOM, then observe for new profiles added to it
	if ($isObserving.get() === true) {
		console.log('already observing')
		return
	}
	const innerProfiles = getInnerProfiles()
	for await (const profile of innerProfiles) {
		await processProfile(profile)
	}
	profileObserver.observe(followingSection, {
		childList: true,
		subtree: true,
	})
}

// Update getFollowingSection to return null if section is not found
async function getFollowingSection(): Promise<HTMLElement | null> {
	const section = () =>
		document.querySelector(
			'[aria-label="Timeline: Following"]',
		) as HTMLElement | null

	if (!section() || !section()?.firstElementChild) {
		return new Promise((resolve) => {
			let tries = 0
			const interval = setInterval(() => {
				console.log(`waiting for following section -> ${tries}`)
				if (tries > 10) {
					clearInterval(interval)
					resolve(null)
				}
				const el = section()
				if (el) {
					clearInterval(interval)
					resolve(el)
				}
				tries++
			}, 1000)
		})
	}
	return section()
}
