import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Button, CircularLoader, InputField, NoticeBox } from '@dhis2/ui'
import { useMedDRASearch } from '../hooks/useMedDRASearch.js'

import styles from './MedDRASearchField.module.css'

export function MedDRASearchField({
    onSelect,
    onClearLastAssignment,
    initialValue = null,
    disabled = false,
    canAssign = true,
    valueHiddenSections = true,
    valueText,
    canClearLastAssignment = false,
    assignedCount = 0,
    maxAssignments = 0,
    nextAvailableElementId = null,
}) {
    const { query, setQuery, results, loading, error, clear } = useMedDRASearch()
    const [selected, setSelected] = useState(initialValue)
    const [open, setOpen] = useState(false)

    const containerRef = useRef(null)

    useEffect(() => {
        setSelected(initialValue);
        resetZoom();
    }, [initialValue])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])
    const resetZoom = () => {
        document.body.style.zoom = '100%';
    };


    const handleInputChange = ({ value }) => {
        setSelected(null)
        setQuery(value)
        setOpen(value.trim().length >= 3)
    }

    const handleSelect = (result) => {
        const term = { id: result.id || result.pcode, code: result.pcode, name: result.name }
        setSelected(term)
        setOpen(false)
        clear()
    }

    const handleClear = () => {
        setSelected(null)
        clear()
        setOpen(false)
    }

    const displayValue = selected ? `${selected.name}` : query
    // const displayValue = selected ? `${selected.code} - ${selected.name}` : query
    const hasVisibleResults = open && results.length > 0
    const hasAssignmentActions = selected || canClearLastAssignment
    const counterText = nextAvailableElementId
        ? `${assignedCount} de ${maxAssignments} asignados. Elemento ${nextAvailableElementId} disponible para registro`
        : `${assignedCount} de ${maxAssignments} asignados. Sin elementos disponibles para registro`
    const containerClassName = hasVisibleResults
        ? `${styles.container} ${styles.containerOpen}`
        : styles.container
    const containerClassNameHidden = `${styles.valueHiddenSectionsPlugins}`
    return React.createElement(
        'div',

        { ref: containerRef, className: valueHiddenSections ? containerClassNameHidden : containerClassName },


        React.createElement(InputField, {
            label: `Seleccione ${valueText} en terminos MedDRA (LLT) `,
            // label: 'Termino MedDRA (LLT)',
            placeholder: 'Escriba al menos 3 caracteres para buscar...',
            value: displayValue,
            onChange: handleInputChange,
            disabled,
        }),
        loading && React.createElement(
            'div',
            { className: styles.loader },
            React.createElement(CircularLoader, { small: true })
        ),
        error && React.createElement(
            NoticeBox,
            { error: true, title: 'Error de busqueda', className: styles.notice },
            error
        ),
        hasVisibleResults && React.createElement(
            'ul',
            { className: styles.dropdown },
            results.map((result, index) => React.createElement(DropdownItem, {
                // key: `${result.pcode}-${result.name}-${index}`,
                key: `${result.name}-${index}`,
                result,
                query,
                onSelect: handleSelect,
            }))
        ),
        hasAssignmentActions && React.createElement(
            'div',
            { className: styles.actions },
            selected && React.createElement(
                Button,
                {
                    small: true,
                    secondary: true,
                    type: 'button',
                    onClick: handleClear,
                    disabled,
                },
                'Limpiar'
            ),
            selected && React.createElement(
                Button,
                {
                    small: true,
                    primary: true,
                    type: 'button',
                    onClick: () => onSelect(selected),
                    disabled: disabled || !canAssign,
                },
                'Asignar elemento de dato'
            ),
            canClearLastAssignment && React.createElement(
                Button,
                {
                    small: true,
                    destructive: true,
                    type: 'button',
                    onClick: onClearLastAssignment,
                    disabled,
                },
                'Borrar ultima seleccion'
            )
        ),
        maxAssignments > 0 && React.createElement(
            'div',
            { className: styles.counter },
            counterText
        )
    )
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getHighlightedText(value, query) {
    const searchText = query.trim()

    if (!searchText) {
        return value
    }

    const parts = value.split(new RegExp(`(${escapeRegExp(searchText)})`, 'gi'))

    return parts.map((part, index) => {
        if (part.toLowerCase() !== searchText.toLowerCase()) {
            return part
        }

        return React.createElement(
            'span',
            { key: `${part}-${index}`, className: styles.highlight },
            part
        )
    })
}

function DropdownItem({ result, query, onSelect }) {
    return React.createElement(
        'li',
        { onClick: () => onSelect(result), className: styles.item, },
        // React.createElement('span', { className: styles.code }, result.pcode),
        React.createElement('span', { className: styles.name }, getHighlightedText(result.name, query))
    )
}

MedDRASearchField.propTypes = {
    onSelect: PropTypes.func.isRequired,
    onClearLastAssignment: PropTypes.func,
    initialValue: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        code: PropTypes.string,
        name: PropTypes.string,
        codeCIE10: PropTypes.string,
        termCIE10: PropTypes.string,
    }),
    disabled: PropTypes.bool,
    canAssign: PropTypes.bool,
    canClearLastAssignment: PropTypes.bool,
    assignedCount: PropTypes.number,
    maxAssignments: PropTypes.number,
    nextAvailableElementId: PropTypes.number,
}

DropdownItem.propTypes = {
    result: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        pcode: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    }).isRequired,
    query: PropTypes.string.isRequired,
    onSelect: PropTypes.func.isRequired,
}
