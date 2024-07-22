///<reference lib="dom" />
///<reference lib="dom.iterable" />
import { sendMessageToBg } from '@/shared/messaging'
import { $sessionStorage } from '@/shared/storage'
import type { FromBgToTab, FromTabToBg, TwitterUserData } from '@/shared/types'

const POPUP_RESULT_ID = 'popup-result'

function getPopupResultDiv() {
	const resultDiv = document.getElementById(POPUP_RESULT_ID)
	if (!resultDiv) {
		throw 'no result div found in popup'
	}
	return resultDiv
}

// 1) Receive the userData string from background script
chrome.runtime.onMessage.addListener(async (msg: FromBgToTab, sender) => {
	try {
		if (
			msg.from === 'background' &&
			msg.type === 'userData' &&
			msg.to === 'newTab' &&
			msg.data
		) {
			console.log('newTab received message', msg, sender)
			const dataString = msg.data
			if (!dataString) {
				throw 'no data string found'
			}

			// 2) send the userData string to sandbox to start eval()
			const iframe = document.querySelector('iframe') as HTMLIFrameElement
			iframe.contentWindow!.postMessage(dataString, '*')
		}
	} catch (e) {
		console.log(e)
	}
})

// 3) receive the userData object - aka eval() result - from sandbox
window.addEventListener(
	'message',
	async (event: MessageEvent<TwitterUserData>) => {
		try {
			console.log('newTab received message from sandbox', event.data)
			const resultDiv = getPopupResultDiv()
			resultDiv.innerHTML = 'eval() done'

			// 4) send the userData object back to background script
			const msg: FromTabToBg = {
				from: 'newTab',
				to: 'background',
				type: 'userData',
				data: event.data,
			}
			await sendMessageToBg(msg)
		} catch (e) {
			console.error(e)
		}
	},
)

// go to the following page when the popup button is clicked
document.getElementById('popup-button')!.addEventListener('click', async () => {
	const twitterTab = await $sessionStorage.getValue('contentTabId')
	if (twitterTab) {
		chrome.tabs.create({ url: 'https://x.com/following' })
	} else {
		chrome.tabs.update({ url: 'https://x.com/following' })
	}
})
