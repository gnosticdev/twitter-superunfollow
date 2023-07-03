import { prettyConsole } from './console'

export function waitForElement(
    selector: string,
    timeout = 5000,
    label = selector
): Promise<HTMLElement | null> {
    return new Promise(function (resolve, reject) {
        const element = document.querySelector(selector) as HTMLElement
        if (element) {
            resolve(element)
            return
        }
        const observer = new MutationObserver(function (records) {
            records.forEach(function (mutation) {
                const nodes = Array.from(mutation.addedNodes)
                nodes.forEach(function (node) {
                    if (node instanceof HTMLElement) {
                        const innerElement = node.querySelector(
                            selector
                        ) as HTMLElement
                        // success if the element itself matches the selector, or if an inner element matches the selector
                        if (node.matches(selector) || innerElement) {
                            prettyConsole('Found ' + label, 'green')

                            observer.disconnect()
                            resolve(
                                node.matches(selector) ? node : innerElement
                            )
                        }
                    }
                })
            })
            // disconnect after
            setTimeout(function () {
                observer.disconnect()
                reject(new Error(selector + ' -> not found after 4 seconds'))
            }, timeout)
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        })
    })
}
