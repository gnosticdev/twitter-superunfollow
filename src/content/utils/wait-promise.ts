import type { Selectors } from '@/content/utils/ui-elements'
import coolConsole from 'kleur'

/**
 *  Wait for an element to be added to the DOM
 * @param selector - the selector to wait for
 * @param timeout  - the number of milliseconds to wait for the element to be added to the DOM. Default is 5000ms
 * @param label - the label to use in the console log. Default is the selector
 * @returns {Promise<HTMLElement | null>} - the element that was added to the DOM
 */
export function waitForElement({
	selector,
	timeout = 5000,
	label = selector,
}: {
	selector: (typeof Selectors)[keyof typeof Selectors]
	timeout?: number
	label?: string
}): Promise<HTMLElement | null> {
	return new Promise((resolve, reject) => {
		const element = document.querySelector(selector) as HTMLElement
		if (element) {
			resolve(element)
			return
		}
		const observer = new MutationObserver((records) => {
			records.forEach((mutation) => {
				const nodes = Array.from(mutation.addedNodes)
				nodes.forEach((node) => {
					if (node instanceof HTMLElement) {
						const innerElement = node.querySelector(selector) as HTMLElement
						// success if the element itself matches the selector, or if an inner element matches the selector
						if (node.matches(selector) || innerElement) {
							console.log(console.log(coolConsole.green(`found ${label}`)))
							observer.disconnect()
							resolve(node.matches(selector) ? node : innerElement)
						}
					}
				})
			})
			// disconnect after
			setTimeout(() => {
				observer.disconnect()
				reject(new Error(`${selector}not found after ${timeout}ms`))
			}, timeout)
		})

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		})
	})
}
