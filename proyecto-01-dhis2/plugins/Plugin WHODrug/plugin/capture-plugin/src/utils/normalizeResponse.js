const LIST_FIELD_BY_LEVEL = {
    abbreviations: 'abbreviations',
    drugNames: 'drugNames',
    maHolders: 'maHolders',
    forms: 'forms',
    strengths: 'strengths',
}

export const getItemsFromResponse = (level, response) => {
    if (!response) return []
    const field = LIST_FIELD_BY_LEVEL[level]
    const items = response[field]
    return Array.isArray(items) ? items : []
}

export const isLeafLevel = (response) => {
    if (!response) return false
    const count = parseInt(response.count, 10)
    const total = parseInt(response.total, 10)
    return Number.isFinite(count) && Number.isFinite(total) && count === total
}

export const getLabelByLevel = (level, item) => {
    switch (level) {
        case 'abbreviations':
            return item.abbreviation ?? ''
        case 'drugNames':
            return item.drugName ?? ''
        case 'maHolders':
            return item.maHolders ?? ''
        case 'forms':
            return item.formTranslations ?? item.form ?? ''
        case 'strengths':
            return item.strength ?? ''
        default:
            return ''
    }
}

export const getSelectionParam = (level, item) => getLabelByLevel(level, item)
