import React, { useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import {
    CircularLoader,
    InputField,
} from '@dhis2/ui'

export const SearchableSelect = ({
    label,
    placeholder,
    options,
    selected,
    onChange,
    loading = false,
    disabled = false,
    error,
    helpText,
}) => {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const containerRef = useRef(null)

    const selectedOption = useMemo(
        () => options.find((opt) => opt.value === selected) ?? null,
        [options, selected],
    )

    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()
        if (!normalizedQuery) return options

        return options.filter((opt) =>
            opt.label.toLowerCase().includes(normalizedQuery),
        )
    }, [options, query])

    useEffect(() => {
        if (!open) {
            setQuery('')
        }
    }, [open])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (value) => {
        onChange(value)
        setOpen(false)
        setQuery('')
    }

    const value = open ? query : selectedOption?.label ?? ''

    return (
        <div
            ref={containerRef}
            style={{

                marginBottom: 8,
                position: 'relative',
                width: '100%',
                maxWidth: '100%',
                minWidth: 0,
                boxSizing: 'border-box'
            }}
        >
            <div style={{ position: 'relative' }}>
                <div
                    style={{
                        width: '100%',
                        maxWidth: '100%',
                        minWidth: 0,
                        boxSizing: 'border-box',
                    }}
                >
                    <InputField
                        label={label}
                        placeholder={placeholder ?? 'Seleccione una opcion'}
                        value={value}
                        onChange={({ value: nextValue }) => {
                            setQuery(nextValue)
                            setOpen(true)
                        }}
                        onFocus={() => setOpen(true)}
                        disabled={disabled || loading}
                        error={Boolean(error)}
                        validationText={error}
                        helpText={helpText}
                    />
                </div>
                {selectedOption && !disabled && !loading ? (
                    <button
                        type="button"
                        aria-label="Limpiar seleccion"
                        title="Limpiar seleccion"
                        onMouseDown={(event) => {
                            event.preventDefault()
                            handleSelect('')
                        }}
                        style={{
                            position: 'absolute',
                            right: 8,
                            top: 31,
                            width: 24,
                            height: 24,
                            border: 'none',
                            background: 'transparent',
                            color: '#6c7787',
                            cursor: 'pointer',
                            fontSize: 20,
                            lineHeight: '20px',
                            padding: 0,
                        }}
                    >
                        x
                    </button>
                ) : null}
            </div>
            {open && !disabled && !loading ? (
                <ul
                    style={{

                        listStyle: 'none',
                        margin: '4px 0 0',
                        padding: 0,
                        width: '100%',
                        maxWidth: '100%',
                        minWidth: 0,
                        maxHeight: 260,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        boxSizing: 'border-box',
                        background: '#fff',
                        border: '1px solid #a0adba',
                        borderRadius: 3,
                        boxShadow: '0 2px 8px rgba(33, 41, 52, 0.16)',
                    }}
                >
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                            <li
                                key={opt.value}
                                onMouseDown={(event) => {
                                    event.preventDefault()
                                    handleSelect(opt.value)
                                }}
                                style={{
                                    padding: '8px 12px',
                                    cursor: 'pointer',
                                    background:
                                        opt.value === selected ? '#e8f0fe' : '#fff',
                                    borderBottom: '1px solid #f0f2f4',
                                }}
                            >
                                {opt.label}
                            </li>
                        ))
                    ) : (
                        <li style={{ padding: '8px 12px', color: '#6c7787' }}>
                            Sin coincidencias
                        </li>
                    )}
                </ul>
            ) : null}
            {loading && options.length === 0 ? (
                <div style={{ marginTop: 4 }}>
                    <CircularLoader extrasmall />
                </div>
            ) : null}
        </div>
    )
}

SearchableSelect.propTypes = {
    label: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        }),
    ).isRequired,
    selected: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    disabled: PropTypes.bool,
    error: PropTypes.string,
    helpText: PropTypes.string,
}
