import { atom } from 'nanostores'
import { handleChange } from './checkboxes'
import { $following, $unfollowing } from '@/store/persistent'

export const $searchResults = atom<Set<string>>(new Set())
export const $viewResults = atom<'search' | 'unfollowing' | 'none'>('none')
export const $searchInput = atom<string>('')

$searchResults.listen((results) => console.log('search results:', results))
/**
 * - creates a new div to hold the search results
 * - searches the $following store for the search term
 * - displays the results in the new div and appends it to the dialog results div
 */
export async function handleSearch() {
    const input = document.getElementById('su-search-input') as HTMLInputElement
    const inputValue = input.value === '' ? '.*' : input.value
    $searchInput.set(inputValue)
    console.log(`searching for ${inputValue}`)
    const resultDiv = getResultsDiv()
    // display the results
    $searchResults.set(searchFollowingList(inputValue))

    resultDiv.innerHTML = `<h4>Search results for: <span>${
        inputValue === '.*' ? 'all profiles' : inputValue
    }</span></h4>`
    const resultsContainer = displayResults($searchResults.get())
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

export function handleViewButton() {
    const resultsDiv = getResultsDiv()
    console.log(
        'viewResults: ',
        $viewResults.get(),
        'searchResults size: ',
        $searchResults.get().size
    )
    const viewButton = document.getElementById('su-view-button')
    if (!viewButton) return
    const viewResults = $viewResults.get()
    if (viewResults === 'none') {
        viewButton.innerHTML = 'Hide ' + closeList
        $viewResults.set('unfollowing')
        resultsDiv.innerHTML = '<h3 class="su-heading">Unfollowing List</h3>'
        resultsDiv.append(displayResults($unfollowing.get()))
    } else if (viewResults === 'unfollowing' && $searchResults.get().size > 0) {
        viewButton.innerHTML = 'Hide  ' + closeList
        $viewResults.set('search')
        resultsDiv.innerHTML = `<h4><span class="highlight">${
            $searchResults.get().size
        } results for: <span>${
            $searchInput.get() === '.*' ? 'all profiles' : $searchInput.get()
        }</span></h4>`
        resultsDiv.append(displayResults($searchResults.get()))
    } else {
        viewButton.innerHTML = 'List  ' + rightChevron
        $viewResults.set('none')
        resultsDiv.innerHTML = ''
    }
}

export const closeList = `<svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M12 10.586l4.95-4.95a1 1 0 1 1 1.414 1.414L13.414 12l4.95 4.95a1 1 0 0 1-1.414 1.414L12 13.414l-4.95 4.95a1 1 0 0 1-1.414-1.414L10.586 12 5.636 7.05a1 1 0 0 1 1.414-1.414L12 10.586z"></path></svg>
`
export const rightChevron = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
</svg>
`
// display search results as a checkbox list with the option to select all
export function displayResults(searchResults: Set<string>) {
    const resultsContainer = document.createElement('div')
    resultsContainer.classList.add('superUnfollow', 'su-results-container')
    resultsContainer.id = 'su-results-container'
    if (searchResults.size === 0) {
        resultsContainer.innerHTML = `<p class="su-error">No results found</p>`
        return resultsContainer
    }
    // create the Select All checkbox
    const selectAllContainer = createSelectAll()
    resultsContainer.appendChild(selectAllContainer)
    // create the checkboxes for each result
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

function createSelectAll() {
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
    return selectAllContainer
}

/**
 * Selects all check boxes in the search results
 */
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

export const getResultsDiv = () => {
    return document.getElementById('su-results') as HTMLDivElement
}
