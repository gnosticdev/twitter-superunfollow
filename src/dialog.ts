import { handleSearch, viewUnfollowingList } from './search'
import { handleCollectBtn } from './stores/collection'
import { handleSuperUnfollowBtn } from './stores/unfollowing'

export async function addSearchDialog() {
    // Create the dialog and the input and submit elements
    const dialog = document.createElement('dialog')
    dialog.classList.add('superUnfollow', 'su-search-dialog')
    dialog.id = 'su-dialog'
    dialog.role = 'dialog'

    // create container to hold all elements in dialog
    const dialogContainer = document.createElement('div')
    dialogContainer.classList.add('superUnfollow', 'su-search-dialog-container')
    dialog.appendChild(dialogContainer)

    const heading = document.createElement('p')
    heading.textContent = 'Search usernames, handles and bios'
    heading.classList.add('superUnfollow', 'su-heading')
    const headingsContainer = document.createElement('div')
    headingsContainer.classList.add('superUnfollow', 'su-headings-container')
    headingsContainer.append(heading)

    // Create the input and submit search elements
    const input = document.createElement('input')
    input.type = 'text'
    input.id = 'su-search-input'

    const closeButton = document.createElement('button')
    const closeSVG =
        '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 10.586l4.95-4.95a1 1 0 1 1 1.414 1.414L13.414 12l4.95 4.95a1 1 0 0 1-1.414 1.414L12 13.414l-4.95 4.95a1 1 0 0 1-1.414-1.414L10.586 12 5.636 7.05a1 1 0 0 1 1.414-1.414L12 10.586z"></path></svg>'

    closeButton.innerHTML = closeSVG
    closeButton.classList.add('superUnfollow', 'su-close-button')
    closeButton.addEventListener('click', () => {
        dialog.close()
    })

    const searchButton = document.createElement('button')
    searchButton.textContent = 'Search'
    searchButton.classList.add('su-search-button')
    // when user clicks 'search' - any partial match of username or handle are returned, or any full word match of description. The search results are appended to the dialog or replace the previous results.
    searchButton.addEventListener('click', handleSearch)

    // search input and button container
    const inputContainer = document.createElement('div')
    inputContainer.classList.add('su-search-input-container')
    inputContainer.id = 'su-search-input-container'
    inputContainer.append(input, searchButton)

    // add a results div that gets cleared when the search button is clicked
    const resultsContainer = document.createElement('div')
    resultsContainer.id = 'su-results'
    resultsContainer.classList.add('superUnfollow', 'su-results')

    // Create the show dialog button and attach it to the top right of the screen
    const modalButton = createModalButton(dialog)
    const collectBtn = createModalBtns()
    const buttons = createButtons()

    // append elements to dialog
    dialogContainer.append(
        closeButton,
        headingsContainer,
        inputContainer,
        collectBtn,
        resultsContainer,
        buttons
    )
    // Add the dialog and show modal button  to the end of the page
    document.body.appendChild(dialog)
    document.body.appendChild(modalButton)

    return dialog
}

export function createButtons() {
    const container = document.createElement('div')
    container.classList.add('superUnfollow', 'su-button-container')
    container.id = 'superUnfollow-button-container'

    const superUnfollowBtn = document.createElement('button')
    superUnfollowBtn.classList.add('su-button', 'large')
    // starting the super unfollow process
    superUnfollowBtn.addEventListener('click', handleSuperUnfollowBtn)
    superUnfollowBtn.id = 'superUnfollow-button'
    container.append(superUnfollowBtn)

    return container
}

export const createModalButton = (dialog: HTMLDialogElement) => {
    const modalButton = document.createElement('button')
    modalButton.id = 'su-search-modal-button'
    modalButton.textContent = 'SuperUnfollow'
    modalButton.classList.add(
        'superUnfollow',
        'su-button',
        'su-modal',
        'small',
        'active'
    )

    modalButton.addEventListener('click', () => {
        dialog.showModal()
    })

    return modalButton
}

export function createModalBtns() {
    const collectBtn = document.createElement('button')
    collectBtn.classList.add('su-button', 'small', 'active', 'outline', 'alt')
    collectBtn.id = 'su-collect-following-button'
    collectBtn.textContent = 'Collect Following'
    collectBtn.addEventListener('click', handleCollectBtn)

    const viewUnfollowing = document.createElement('button')
    viewUnfollowing.classList.add('su-button', 'small', 'active', 'outline')
    viewUnfollowing.id = 'su-view-unfollowing-button'
    viewUnfollowing.textContent = 'View Unfollowing'
    viewUnfollowing.addEventListener('click', viewUnfollowingList)

    const container = document.createElement('div')
    container.classList.add('su-modal-buttons-container')
    container.id = 'su-modal-buttons-container'
    container.append(collectBtn, viewUnfollowing)

    return container
}
