import { handleSearch, handleViewButtons } from '../search'
import { $followingCount, $unfollowingList } from '@/content/stores/persistent'
import {
    $collectFollowingState,
    handleCollectButton,
} from '@/content/stores/collect-button'
import {
    $superUnfollowButtonState,
    handleUnfollowButton,
} from '@/content/stores/unfollow-button'
import { createMetrics, createNotice } from './metrics'

export async function addDialogToDom() {
    // Create the dialog and the input and submit elements
    const dialog = document.createElement('dialog')
    dialog.id = 'su-dialog'
    dialog.classList.add('superUnfollow', 'su-dialog')
    dialog.role = 'dialog'

    // create container to hold all elements in dialog
    const dialogContainer = document.createElement('div')
    dialogContainer.classList.add('superUnfollow', 'su-dialog-container')
    dialog.appendChild(dialogContainer)

    const closeButton = document.createElement('button')
    closeButton.innerHTML =
        '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 10.586l4.95-4.95a1 1 0 1 1 1.414 1.414L13.414 12l4.95 4.95a1 1 0 0 1-1.414 1.414L12 13.414l-4.95 4.95a1 1 0 0 1-1.414-1.414L10.586 12 5.636 7.05a1 1 0 0 1 1.414-1.414L12 10.586z"></path></svg>'

    closeButton.classList.add('superUnfollow', 'su-close-button')
    closeButton.addEventListener('click', () => {
        dialog.close()
    })

    // close dialog when user clicks outside of it
    dialog.addEventListener('click', closeDialog.bind(dialog))

    const heading = document.createElement('h2')
    heading.textContent = 'Search For Accounts To Unfollow'
    heading.classList.add('superUnfollow', 'su-heading')
    const subHeading = document.createElement('p')
    subHeading.classList.add('superUnfollow', 'su-sub-heading')
    subHeading.textContent =
        'Enter a keyword to search usernames, handles, and bios of accounts you follow'
    const headingContainer = document.createElement('div')
    headingContainer.classList.add(
        'su-heading-container',
        'su-search-heading-container'
    )
    headingContainer.append(heading, subHeading)
    // Create the input and submit search elements
    const input = document.createElement('input')
    input.type = 'text'
    input.id = 'su-search-input'
    input.placeholder = 'Enter a search term'
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSearch(e)
        }
    })
    const searchButton = document.createElement('button')
    searchButton.textContent = 'Search'
    searchButton.classList.add('su-button', 'su-search-button')
    searchButton.addEventListener('click', handleSearch)

    // search input and button container
    const searchContainer = document.createElement('div')
    searchContainer.id = 'su-search-container'
    searchContainer.classList.add('su-search-container')
    searchContainer.append(input, searchButton)
    // when user clicks 'search' - any partial match of username or handle are returned, or any full word match of description. The search results are appended to the dialog or replace the previous results.

    const headingInputContainer = document.createElement('div')
    headingInputContainer.classList.add(
        'superUnfollow',
        'su-heading-input-container'
    )
    headingInputContainer.append(headingContainer, searchContainer)

    // add a results div that gets cleared when the search button is clicked
    const resultsContainer = document.createElement('div')
    resultsContainer.id = 'su-results'
    resultsContainer.classList.add('superUnfollow', 'su-results')

    // Create the show dialog button and attach it to the top right of the screen
    const metricsContainer = createMetrics(
        $followingCount.get(),
        $unfollowingList.get().size
    )
    const notice = await createNotice()

    const modalButtons = createModalButtons()

    // append elements to dialog
    dialogContainer.append(
        closeButton,
        headingInputContainer,
        metricsContainer,
        notice,
        modalButtons,
        resultsContainer
    )
    // append the container to the dialog
    dialog.appendChild(dialogContainer)
    // dont forget to create the button that shows the dialog!
    const showDialogButton = createShowModalButton(dialog)
    // append the dialog and the button to the body
    document.body.append(dialog, showDialogButton)

    return dialog
}

function createModalButtons() {
    const modalBtnsContainer = document.createElement('div')
    modalBtnsContainer.classList.add('su-modal-buttons-container')

    const collectButton = createCollectBtn()
    const startButton = createSuperUnfollowBtn()
    const collectUnfollowContainer = document.createElement('div')
    collectUnfollowContainer.classList.add('su-collect-superunfollow-container')
    collectUnfollowContainer.append(collectButton, startButton)

    const viewButtons = createViewButtons()

    modalBtnsContainer.append(viewButtons, collectUnfollowContainer)

    return modalBtnsContainer
}

export function createSuperUnfollowBtn() {
    const superUnfollowBtn = document.createElement('button')
    superUnfollowBtn.classList.add('su-button', 'super-unfollow')
    superUnfollowBtn.disabled = $unfollowingList.get().size === 0
    superUnfollowBtn.textContent = 'Unfollow'
    // starting the super unfollow process
    superUnfollowBtn.addEventListener('click', handleUnfollowButton)
    superUnfollowBtn.id = 'superUnfollow-button'

    return superUnfollowBtn
}

export function createShowModalButton(dialog: HTMLDialogElement) {
    const modalButton = document.createElement('button')
    modalButton.id = 'su-show-modal-button'
    modalButton.textContent = 'SuperUnfollow'
    modalButton.classList.add('superUnfollow', 'su-button', 'su-show-modal')

    modalButton.addEventListener('click', () => {
        dialog.showModal()
    })

    return modalButton
}

export function createCollectBtn() {
    const collectBtn = document.createElement('button')
    collectBtn.classList.add('su-button', 'alt')
    collectBtn.id = 'su-collect-following-button'
    collectBtn.textContent = 'Collect'
    collectBtn.addEventListener('click', handleCollectButton)

    return collectBtn
}

export function createViewButtons() {
    const viewButtonsContainer = document.createElement('div')
    viewButtonsContainer.classList.add('su-view-buttons-container')
    const viewUnfollowingBtn = createViewUnfollowingBtn()
    const viewSearchResultsBtn = createViewSearchResultsBtn()
    viewButtonsContainer.append(viewUnfollowingBtn, viewSearchResultsBtn)

    return viewButtonsContainer
}

export function createViewUnfollowingBtn() {
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.id = 'su-view-unfollowing'
    input.classList.add('su-view-button')
    input.addEventListener('change', handleViewButtons)

    const label = document.createElement('label')
    label.htmlFor = 'su-view-unfollowing'
    label.classList.add('su-view-button')
    label.textContent = 'List'

    label.appendChild(input)

    return label
}

export function createViewSearchResultsBtn() {
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.id = 'su-view-search-results'
    input.classList.add('su-view-button')
    input.addEventListener('change', handleViewButtons)

    const label = document.createElement('label')
    label.htmlFor = 'su-view-search-results'
    label.classList.add('su-view-button')
    label.textContent = 'Results'

    label.appendChild(input)

    return label
}

function closeDialog(
    this: HTMLDialogElement,
    { currentTarget, clientX, clientY }: MouseEvent
) {
    if (
        $collectFollowingState.get() === 'running' ||
        $collectFollowingState.get() === 'resumed' ||
        $superUnfollowButtonState.get() === 'running'
    )
        return
    const { left, right, top, bottom } = (
        currentTarget as HTMLDialogElement
    ).getBoundingClientRect()

    if (
        clientX < left ||
        clientX > right ||
        clientY < top ||
        clientY > bottom
    ) {
        this.close()
    }
}

// cleanup
// close dialog if open when navigating away
window.addEventListener('beforeunload', () => {
    console.log('unloading')
    const dialog = document.getElementById(
        'su-dialog'
    ) as HTMLDialogElement | null
    if (dialog?.open) {
        dialog.close()
    }
})
