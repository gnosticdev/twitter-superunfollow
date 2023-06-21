import { addCheckbox } from './add-elements'
import { addFollowing } from './stores'
import { delay } from './utils'

export async function processProfiles(profile: HTMLElement) {
    try {
        profile = await waitForData(profile)

        if (!profile.hasAttribute('data-unfollow')) {
            await saveFollowing(profile)
            await addCheckbox(profile)
        }
        if (!document.getElementById('superUnfollow-anchor')) {
            const anchor = document.createElement('div')
            anchor.id = 'superUnfollow-anchor'
            document
                .querySelector('[aria-label="Timeline: Following"]')
                ?.firstElementChild?.before(anchor)
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error(error.message)
        }
    }
}

async function waitForData(
    profile: HTMLElement,
    maxRetries = 10
): Promise<HTMLElement> {
    let links = profile.getElementsByTagName('a')

    if (
        (links.length < 3 || !links[2]?.textContent?.includes('@')) &&
        maxRetries > 0
    ) {
        await delay(250)
        return await waitForData(profile, maxRetries - 1)
    }

    if (maxRetries === 0) {
        throw new Error('Maximum retries reached, required elements not found')
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
        throw 'missing username, handle, or description'
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
