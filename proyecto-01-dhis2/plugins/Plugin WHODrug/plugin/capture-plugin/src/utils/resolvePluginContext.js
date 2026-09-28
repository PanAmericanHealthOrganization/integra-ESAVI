export const normalizeContextValue = (value) => {
    if (value === null || value === undefined) return ''
    return String(value).trim().toUpperCase()
}

export const resolvePluginContext = (values = {}, mappings = {}) => {
    const contextAliases = mappings.contextAliases ?? {}

    for (const [alias, config] of Object.entries(contextAliases)) {
        const expectedValue =
            typeof config === 'string' ? config : config.value
        const context =
            typeof config === 'string'
                ? normalizeContextValue(config).toLowerCase()
                : config.context
        const actual = normalizeContextValue(values[alias])
        const expected = normalizeContextValue(expectedValue)

        if (actual !== '' && actual === expected) {
            return context
        }
    }

    return mappings.defaultContext ?? null
}

export const getActiveMappingContext = (values = {}, mappings = {}) => {
    const contextKey = resolvePluginContext(values, mappings)
    const context = mappings.contexts?.[contextKey] ?? null
    if (!context) {
        return {
            contextKey,
            context: null,
            slots: mappings.slots ?? [],
        }
    }
    
    const slots =
        context.slotSource && Array.isArray(mappings[context.slotSource])
            ? mappings[context.slotSource]
            : context.slots ?? []

    return {
        contextKey,
        context,
        slots,
    }
}
