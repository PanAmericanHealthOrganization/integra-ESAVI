import React, { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { NoticeBox } from '@dhis2/ui'
import { MedDRASearchField } from './components/MedDRASearchField.js'
import { buscarCIE10 } from './config/homologacionMedDRA-CIE10.js'
import {
    MEDDRA_CONTEXT_MAPPINGS,
    getAssignedCode,
    getAssignedFieldSets,
    getAssignedName,
    getFirstAvailableFieldSet,
    getLastAssignedFieldSet,
} from './config/dataElements.js'
import { resolvePluginContext } from './utils/resolvePluginContext.js'

const containerStyle = {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    padding: '16px',
    boxSizing: 'border-box',
}

const contentStyle = {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
}

const mutedTextStyle = {
    margin: 0,
    color: '#666',
}

const assignedListStyle = {
    margin: '8px 0 0',
    paddingLeft: '18px',
    color: '#666',
}

const getAssignedValuesPatch = (fieldSet, term) => {
    return {
        [fieldSet.code]: term.code,
        [fieldSet.name]: term.name,
    }
}

const getClearedValuesPatch = (fieldSet) => {
    return {
        [fieldSet.code]: '',
        [fieldSet.name]: '',
    }
}
// 
const MIN_WIDTH = 290;
const ajustarIframe = () => {
    const iframes = document.querySelectorAll(
        'iframe[src="https://dev-dhis.implementacionypruebas.cloud/api/apps/meddra-plugin/plugin.html"]'
    );

    iframes.forEach((iframe) => {
        const width = parseInt(iframe.style.width, 10);

        if (!width || width < MIN_WIDTH) {
            iframe.style.width = `${MIN_WIDTH}px`;
        }
    });
}

ajustarIframe();

const observer = new MutationObserver(() => {
    ajustarIframe();
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style']
});
// 

const Plugin = (props) => {
    const {
        values = {},
        setFieldValue,
        viewMode = false,
    } = props
    const [optimisticValues, setOptimisticValues] = useState({})

    const effectiveValues = useMemo(() => ({
        ...values,
        ...optimisticValues,
    }), [optimisticValues, values])

    const contextKey = resolvePluginContext(effectiveValues, MEDDRA_CONTEXT_MAPPINGS)
    const activeContext = contextKey ? MEDDRA_CONTEXT_MAPPINGS.contexts?.[contextKey] : null
    const valueLabelText = MEDDRA_CONTEXT_MAPPINGS.contexts?.[contextKey]?.label
    const valueHiddenSections = MEDDRA_CONTEXT_MAPPINGS.contexts?.[contextKey]?.hiddenSections ?? false
    const fieldSets = activeContext?.fieldSets ?? []
    const nextFieldSet = getFirstAvailableFieldSet(effectiveValues, fieldSets)
    const assignedFieldSets = getAssignedFieldSets(effectiveValues, fieldSets)

    const handleSelect = useCallback((term) => {
        const terminoCIE10 = buscarCIE10(term.code);
        const fieldSet = getFirstAvailableFieldSet(effectiveValues, fieldSets)
        if (!fieldSet || !setFieldValue) return;

        setFieldValue({
            fieldId: fieldSet.code,
            value: term.code,
            options: { valid: true, touched: true },
        });

        setFieldValue({
            fieldId: fieldSet.name,
            value: term.name,
            options: { valid: true, touched: true },
        });
        setFieldValue({
            fieldId: fieldSet.codeCIE10,
            value: terminoCIE10[0]?.codigoCIE10 ?? 'No mapeado',
            options: { valid: true, touched: true },
        })

        setFieldValue({
            fieldId: fieldSet.termCIE10,
            value: terminoCIE10[0]?.terminoCIE10 ?? 'No mapeado',
            options: { valid: true, touched: true },
        })

        setOptimisticValues((previousValues) => ({
            ...previousValues,
            ...getAssignedValuesPatch(fieldSet, term),
        }))
    }, [effectiveValues, fieldSets, setFieldValue])

    const handleClearLastAssignment = useCallback(() => {
        const fieldSet = getLastAssignedFieldSet(effectiveValues, fieldSets)
        if (!fieldSet || !setFieldValue) return

        setFieldValue({
            fieldId: fieldSet.code,
            value: '',
            options: { valid: true, touched: true },
        })
        setFieldValue({
            fieldId: fieldSet.name,
            value: '',
            options: { valid: true, touched: true },
        })

        setFieldValue({
            fieldId: fieldSet.codeCIE10,
            value: '',
            options: { valid: true, touched: true },
        })

        setFieldValue({
            fieldId: fieldSet.termCIE10,
            value: '',
            options: { valid: true, touched: true },
        })
        setOptimisticValues((previousValues) => ({
            ...previousValues,
            ...getClearedValuesPatch(fieldSet),
        }))
    }, [effectiveValues, fieldSets, setFieldValue])

    if (!activeContext) {
        console.log(activeContext + "No se pudo detectar el contexto MedDRA. Verifica que los Data Elements tecnicos del plugin esten mapeados y tengan valor asignado por reglas de programa.")
        return
    }

    if (fieldSets.length === 0) {
        return React.createElement(
            'div',
            { style: containerStyle },
            React.createElement(
                NoticeBox,
                {
                    warning: true,
                    title: 'Sin mapeos configurados',
                },
                'El contexto detectado no tiene campos definidos en la configuracion del plugin.'
            )
        )
    }

    if (viewMode) {
        return React.createElement(
            'div',
            { style: containerStyle },
            React.createElement(
                'p',
                { style: mutedTextStyle },
                React.createElement('strong', null, valueLabelText, valueHiddenSections),
                React.createElement('br'),
                assignedFieldSets.length > 0
                    ? `${assignedFieldSets.length} de ${fieldSets.length} terminos asignados`
                    : 'Sin terminos seleccionados'
            ),
            assignedFieldSets.length > 0 && React.createElement(
                'ol',
                { style: assignedListStyle },
                assignedFieldSets.map((fieldSet) => React.createElement(
                    'li',
                    { key: fieldSet.id },
                    `${getAssignedCode(effectiveValues, fieldSet)} - ${getAssignedName(effectiveValues, fieldSet)}`
                ))
            )
        )
    }
    return React.createElement(
        'div',
        { style: containerStyle },
        React.createElement(
            'div',
            { style: contentStyle },
            React.createElement(MedDRASearchField, {
                onSelect: handleSelect,
                onClearLastAssignment: handleClearLastAssignment,
                disabled: false,
                canAssign: true,
                valueText: valueLabelText,
                valueHiddenSections: valueHiddenSections,
                canClearLastAssignment: assignedFieldSets.length > 0,
                assignedCount: assignedFieldSets.length,
                maxAssignments: fieldSets.length,
                nextAvailableElementId: nextFieldSet ? nextFieldSet.id : null,
            })
        )
    )
}

Plugin.propTypes = {
    values: PropTypes.object,
    errors: PropTypes.object,
    warnings: PropTypes.object,
    fieldsMetadata: PropTypes.object,
    setFieldValue: PropTypes.func,
    setContextFieldValue: PropTypes.func,
    viewMode: PropTypes.bool,
    formSubmitted: PropTypes.bool,
}

export default Plugin
