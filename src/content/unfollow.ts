import { $unfollowedProfiles } from './main'
import { Selectors } from '../shared/shared'
import { getResultsDiv } from './search'
import { $unfollowing, removeUnfollowing } from '../storage/persistent'
import { $superUnfollowButtonState } from '../storage/unfollowing'
import {
    delay,
    prettyConsole,
    scrollDownFollowingPage,
    waitForElement,
} from './utils'

/**
 * Unfollows the first section of profiles loaded on the page (if any)
 * Then scrolls down the page and unfollows the rest
 */
export async function startSuperUnfollow() {
    // get all profiles already loaded on the page
    const profiles = document.querySelectorAll(
        '[data-unfollow="true"]'
    ) as NodeListOf<HTMLElement>
    profiles.forEach(async (profile) => {
        await superUnfollow(profile)
        await delay(1000)
    })
    // scroll down the page and the watcher will pick up the rest
    await scrollUnfollow()
}

const scrollUnfollow = async () => {
    if ($superUnfollowButtonState.get() === 'stopped') {
        console.log('stopping super unfollow')
        return
    }
    // superUnfollow handled by MutationObserver in main.ts
    try {
        await scrollDownFollowingPage(2000)
        await delay(1000)
        await scrollUnfollow()
    } catch (error) {
        console.error(error)
        return
    }
}

/**
 * Unfollows a profile as selected by the user.
 * @param {HTMLElement} profile - profile to unfollow
 * @returns {Promise<void>}
 */
export async function superUnfollow(profile: HTMLElement): Promise<void> {
    if ($superUnfollowButtonState.get() === 'stopped') {
        console.log('stopping super unfollow')
        return
    }

    try {
        const { handle } = profile.dataset
        if (handle && $unfollowing.get().has(handle)) {
            const unfollowed = await unfollow(profile)
            if (!unfollowed) {
                $superUnfollowButtonState.set('stopped')
                throw new Error('unfollow failed')
            }

            if ($unfollowing.get().size === 0) {
                prettyConsole('no more profiles to unfollow')
                $superUnfollowButtonState.set('stopped')
                return
            }
        }
    } catch (error) {
        console.error(error)
        return
    }
}

const unfollow = async (profile: HTMLElement) => {
    try {
        const { handle } = profile.dataset
        // click the unfollow button
        const unfollowButton = profile.querySelector(
            Selectors.UF_BUTTON
        ) as HTMLElement | null

        if (!unfollowButton || !handle) {
            throw new Error(
                !handle ? 'no handle found' : 'no unfollow button for ' + handle
            )
        }

        unfollowButton.click()
        await delay(1500)
        // blue and gray out unfollowed profiles
        profile.style.filter = 'blur(1px) grayscale(100%) brightness(0.5)'
        const confirmUnfollow = await waitForElement(Selectors.UF_CONFIRM)

        if (!confirmUnfollow) {
            throw new Error('no confirm unfollow button found')
        }
        confirmUnfollow.click()
        await delay(1500)
        // remove profile from unfollowing store
        removeUnfollowing(handle)

        $unfollowedProfiles.set($unfollowedProfiles.get().add(handle))

        debugger

        return true
    } catch (error) {
        console.error(error)
        return false
    }
}

// display the unfollowed handles in the results section of the dialog while superUnfollow is running
export const displayUnfollowed = (unfollowed: Readonly<Set<string>>) => {
    const resultsDiv = getResultsDiv()
    const unfollowedContainer = document.createElement('div')
    unfollowedContainer.id = 'su-unfollowed-container'
    unfollowedContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
    `
    resultsDiv.innerHTML = `<h3 class="su-loader"><span class="su-spinner"></span>Running SuperUnfollow...</h3><p> ${
        $unfollowedProfiles.get().size
    } profiles remaining</p>`

    unfollowed.forEach((handle) => {
        const unfollowedHandle = document.createElement('p')
        unfollowedHandle.textContent = handle
        unfollowedContainer.appendChild(unfollowedHandle)
    })
    resultsDiv.appendChild(unfollowedContainer)
    console.log('appending unfollowed list to results div', unfollowed)
}
