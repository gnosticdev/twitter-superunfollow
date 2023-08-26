import { Selectors } from '@/content/utils/utils'
import { $viewResults, createResultsContainer, getResultsDiv } from './search'
import {
    $unfollowing,
    removeFollowing,
    removeUnfollowing,
} from '@/content/stores/persistent'
import { $superUnfollowButtonState } from '@/content/stores/unfollow-button'
import { randomDelay } from './utils/utils'
import { prettyConsole } from './utils/console'
import { waitForElement } from './utils/wait-promise'
import { scrollToLastChild } from './utils/scroll'
import { atom } from 'nanostores'

// Tract the profiles that have been unfollowed
export const $unfollowedProfiles = atom<ProfilesMap>(new Map())

const addUnfollowedProfile = (handle: string, profile: ProfileDetails) => {
    const unfollowedProfiles = $unfollowedProfiles.get()
    unfollowedProfiles.set(handle, profile)
    $unfollowedProfiles.set(new Map([...Array.from(unfollowedProfiles)]))

    return profile
}
/**
 * Unfollows the first section of profiles loaded on the page (if any)
 * Then scrolls down the page and unfollows the rest
 */
export async function startSuperUnfollow() {
    console.log('starting super unfollow')
    $viewResults.set('unfollowing')
    // get all profiles already loaded on the page
    const profiles = document.querySelectorAll(
        '[data-unfollow="true"]'
    ) as NodeListOf<HTMLElement>
    profiles.forEach(async (profile) => {
        if (shouldContinue()) {
            await superUnfollow(profile)
            await randomDelay(1000, 2000)
        }
    })
    // scroll down the page and the watcher will pick up the rest
    await scrollUnfollow()
}

const scrollUnfollow = async () => {
    while (shouldContinue()) {
        // superUnfollow handled by MutationObserver in main.ts
        try {
            await scrollToLastChild()
            // delay a random number from 1500 - 3000 ms
            await randomDelay(1500, 3000)
            // continue scrolling
            await scrollUnfollow()
        } catch (error) {
            console.error(error)
            return
        }
    }
}

/**
 * Unfollows a profile as selected by the user.
 * @param {HTMLElement} profile - profile to unfollow
 * @returns {Promise<void>}
 */
export async function superUnfollow(profile: HTMLElement): Promise<void> {
    try {
        const { handle } = profile.dataset
        if (shouldContinue() && handle && $unfollowing.get().has(handle)) {
            const unfollowed = await unfollow(profile)
            await randomDelay(1000, 2000)
            if (!unfollowed) {
                $superUnfollowButtonState.set('paused')
                throw new Error('unfollow failed')
            }

            if ($unfollowing.get().size === 0) {
                prettyConsole('Unfollowed all accounts!')
                $superUnfollowButtonState.set('done')
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
        await randomDelay(1000, 2000)
        // blue and gray out unfollowed profiles
        profile.style.filter = 'blur(1px) grayscale(100%) brightness(0.5)'
        const confirmUnfollow = await waitForElement(Selectors.UF_CONFIRM)

        if (!confirmUnfollow) {
            throw new Error('no confirm unfollow button found')
        }
        confirmUnfollow.click()
        // add profile to unfollowed store
        addUnfollowedProfile(handle, $unfollowing.get().get(handle)!)
        // remove profile from unfollowing store
        removeUnfollowing(handle)
        removeFollowing(handle)

        debugger

        return true
    } catch (error) {
        console.error(error)
        return false
    }
}

// display the unfollowed handles in the results section of the dialog while superUnfollow is running
export const displayUnfollowed = (unfollowed: ProfilesMap) => {
    console.log('displaying unfollowed', unfollowed)
    $viewResults.set('none')
    const resultsDiv = getResultsDiv()
    const unfollowedContainer = createResultsContainer('unfollowing')
    const list = document.createElement('ol')
    list.classList.add('su-search-result')
    Array.from($unfollowing.get()).forEach(([handle, profile]) => {
        const result = document.createElement('li')
        result.classList.add('su-list-item')
        unfollowed.has(handle) && result.classList.add('success')
        result.innerHTML = `<div class="su-result-label">${profile.username}&nbsp;&nbsp;<span class="su-handle">${handle}</span></div>`
        result.textContent = `${profile.username} ${handle}`
        list.appendChild(result)
    })

    unfollowedContainer.appendChild(list)

    resultsDiv.appendChild(unfollowedContainer)
    console.log('appending unfollowed list to results div', unfollowed)
}

const shouldContinue = () => {
    const state = $superUnfollowButtonState.get()
    return state === 'running' || state === 'resumed'
}
