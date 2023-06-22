import { addCheckbox } from './add-elements'
import { addFollowing } from './stores'

export async function processProfiles(profile: HTMLElement) {
    try {
        profile = await waitForProfileData(profile)

        if (!profile.hasAttribute('data-unfollow')) {
            await saveFollowing(profile)
            await addCheckbox(profile)
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message)
        }
    }
}

async function waitForProfileData(
    profile: HTMLElement,
    timeout = 10_000
): Promise<HTMLElement> {
    let links = profile.getElementsByTagName('a')

    if (links.length < 3 || !links[2]?.textContent?.includes('@')) {
        console.log('waiting for profile data', profile)
        const linksObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(async (node) => {
                        if (node instanceof HTMLElement) {
                            links = node.getElementsByTagName('a')
                            if (
                                links.length > 2 &&
                                links[2]?.textContent?.includes('@')
                            ) {
                                linksObserver.disconnect()
                                return node
                            }
                        }
                    })
                }
            })
            setTimeout(() => {
                console.log('profile data timed out', profile)
                linksObserver.disconnect()
                return profile
            }, timeout)
        })
        linksObserver.observe(profile, {
            childList: true,
            subtree: true,
        })
    }

    return profile
}

/** @param {HTMLElement} profile */
export async function getProfileDetails(profile: HTMLElement) {
    const links = profile.getElementsByTagName('a')

    const username = links[1].textContent?.trim()
    const handle = links[2].textContent?.trim()
    const description = profile
        .querySelector(
            '[data-testid="cellInnerDiv"] [role="button"] [dir="auto"]:nth-of-type(2)'
        )
        ?.textContent?.trim()
    if (!username || !handle) {
        throw `missing ${
            username ? 'handle for ' + username : 'username for ' + handle
        } for profile:`
    }
    return { username, handle, description }
}

export async function saveFollowing(profiles: HTMLElement | HTMLElement[]) {
    try {
        if (Array.isArray(profiles)) {
            profiles.forEach(async (profile) => {
                const entry = await getProfileDetails(profile)
                addFollowing(entry.handle, entry)
            })
        } else {
            const entry = await getProfileDetails(profiles)
            addFollowing(entry.handle, entry)
        }
    } catch (error) {
        console.error(error)
    }
}
