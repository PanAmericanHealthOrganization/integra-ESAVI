export const normalizeContextValue = (value) => {
    if (value === null || value === undefined) return ''
    return String(value).trim().toUpperCase()
}

export const resolvePluginContext = (values = {}, mappings = {}) => {
    const contextAliases = mappings.contextAliases ?? {}

    for (const [alias, expectedValue] of Object.entries(contextAliases)) {
        const actual = normalizeContextValue(values[alias])
        const expected = normalizeContextValue(expectedValue)

        if (actual !== '' && actual === expected) {
            return expected.toLowerCase()
        }
    }

    return mappings.defaultContext ?? null
}
