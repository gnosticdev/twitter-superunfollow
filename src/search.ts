import { addSuperUnfollowButton, handleChange } from './add-elements'
import { $following, $unfollowing } from './stores'
import { prettyConsole } from './utils'

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
    const modalButton = document.createElement('button')
    modalButton.id = 'su-search-modal-button'
    modalButton.textContent = 'SuperUnfollow'
    modalButton.classList.add('superUnfollow', 'su-button', 'su-modal', 'small')
    addSuperUnfollowButton(dialog)
    modalButton.addEventListener('click', () => {
        dialog.showModal()
    })

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
    prettyConsole('search dialog created')

    // when user clicks 'search' - any partial match of username or handle are returned, or any full word match of description. The search results are appended to the dialog or replace the previous results.
    searchButton.addEventListener('click', handleSearch)

    return dialog
}

const handleSearch = async () => {
    const input = document.getElementById('su-search-input') as HTMLInputElement
    const inputValue = input.value === '' ? '.*' : input.value

    console.log(`searching for ${inputValue}`)

    const resultDiv = document.getElementById(
        'su-search-results'
    ) as HTMLDivElement

    // set from background script
    const following = localStorage.getItem('followingCount')
    // add spinning loader while searching
    resultDiv.innerHTML = `<div class="su-loader"><span class="su-spinner"></span>Scanning ${following} profiles. Search term: \n ${inputValue}</div>`
    // display the results
    const searchResults = searchFollowingList(inputValue)
    resultDiv.innerHTML = `<h3>Search results for: <span>${inputValue}</span></h3>`
    const resultsContainer = displaySearchResults(searchResults)
    resultDiv.appendChild(resultsContainer)
}

/** @param {string} searchTerm */
export function searchFollowingList(searchTerm: string) {
    let results = new Set<string>()
    $following.get().forEach((entry) => {
        const { username, handle, description } = entry
        const wordRegex = new RegExp(`\\b${searchTerm}\\b`, 'i')
        const allRegex = new RegExp(searchTerm, 'i')
        // always search handle and username without word boundries, search description with word boundries
        if (
            allRegex.test(username) ||
            allRegex.test(handle) ||
            (description && wordRegex.test(description))
        ) {
            results.add(handle)
        }
    })

    return results
}

// display search results as a checkbox list with the option to select all
export function displaySearchResults(searchResults: Set<string>) {
    const resultsContainer = document.createElement('div')
    resultsContainer.classList.add(
        'superUnfollow',
        'su-search-results-container'
    )
    if (searchResults.size === 0) {
        resultsContainer.innerHTML = `<p class="su-error">No results found</p>`
        return resultsContainer
    }

    // create the Select All checkbox
    const selectAll = document.createElement('input')
    selectAll.type = 'checkbox'
    selectAll.id = 'su-search-select-all'
    selectAll.addEventListener('change', handleSelectAll)
    const selectAllLabel = document.createElement('label')
    selectAllLabel.textContent = 'Select All'
    selectAllLabel.htmlFor = 'su-search-select-all'
    const selectAllContainer = document.createElement('div')
    selectAllContainer.classList.add(
        'superUnfollow',
        'su-search-result',
        'su-select-all'
    )
    selectAllLabel.appendChild(selectAll)
    selectAllContainer.appendChild(selectAllLabel)
    resultsContainer.appendChild(selectAllContainer)

    // get the unfollow list from storage or returns a new list

    searchResults.forEach((result) => {
        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.id = `su-search-${result}`
        checkbox.value = result
        checkbox.checked = $unfollowing.get().has(result)
        checkbox.addEventListener('change', handleChange)
        const label = document.createElement('label')
        label.textContent = result
        label.htmlFor = `su-search-${result}`
        const container = document.createElement('div')
        container.classList.add('superUnfollow', 'su-search-result')
        label.appendChild(checkbox)
        container.appendChild(label)
        resultsContainer.appendChild(container)
    })
    return resultsContainer
}

// handle the select all checkbox
function handleSelectAll() {
    const selectAll = document.getElementById(
        'su-search-select-all'
    ) as HTMLInputElement
    const checkboxes = document.querySelectorAll(
        '.su-search-result input[type="checkbox"]:not(#su-search-select-all)'
    ) as NodeListOf<HTMLInputElement>
    checkboxes.forEach((checkbox) => {
        checkbox.checked = selectAll.checked
        checkbox.dispatchEvent(new Event('change'))
    })
}
