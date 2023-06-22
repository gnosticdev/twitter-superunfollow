import { collectFollowing } from './main'
import { handleSearch } from './search'

export async function addSearchDialog() {
    console.log('adding search dialog')
    // Create the dialog and the input and submit elements
    const dialog = document.createElement('dialog')
    dialog.classList.add('superUnfollow', 'su-search-dialog')
    const dialogContainer = document.createElement('div')
    dialogContainer.classList.add('superUnfollow', 'su-search-dialog-container')
    dialogContainer.role = 'dialog'
    dialog.appendChild(dialogContainer)

    // Create the show dialog button and attach it to the top right of the screen
    const modalButton = createModalButton(dialog)
    const collectFollowingBtn = createCollectBtn()
    // add the collect following button at the top of the dialog
    dialogContainer.appendChild(collectFollowingBtn)

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
    resultsContainer.id = 'su-search-results'
    resultsContainer.classList.add('superUnfollow', 'su-search-results')

    // append elements to dialog
    dialogContainer.append(
        closeButton,
        headingsContainer,
        inputContainer,
        resultsContainer
    )
    // Add the dialog and show modal button  to the end of the page
    document.body.appendChild(dialog)
    document.body.appendChild(modalButton)

    console.log('added search dialog')

    return dialog
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

export function createCollectBtn() {
    const button = document.createElement('button')
    button.classList.add('su-button', 'small', 'active')
    button.id = 'su-collect-following-button'
    button.textContent = 'Get All Following'
    button.addEventListener('click', collectFollowing)

    return button
}
