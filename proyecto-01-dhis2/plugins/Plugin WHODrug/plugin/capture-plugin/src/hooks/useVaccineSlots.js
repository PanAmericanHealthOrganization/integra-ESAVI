import { useCallback, useMemo, useRef, useState } from 'react'

const hasValue = (raw) => {
    if (raw === null || raw === undefined) {
        return false
    }

    if (typeof raw === 'string') {
        return raw.trim() !== ''
    }

    return true
}

const readValue = (values, fieldId) => {
    if (!fieldId) {
        return null
    }

    const raw = values[fieldId]

    if (!hasValue(raw)) {
        return null
    }

    return String(raw)
}

export const useVaccineSlots = ({
    slots,
    values,
    setFieldValue,
}) => {
    const preferredNextIndexRef = useRef(null)

    const [isProcessing, setIsProcessing] = useState(false)

    const states = useMemo(
        () =>
            slots.map((slot, index) => {
                const abbreviationValue = readValue(
                    values,
                    slot.abbreviationCode,
                )

                const vaccineValue = readValue(
                    values,
                    slot.drugCode,
                )

                const isFilled =
                    abbreviationValue !== null &&
                    vaccineValue !== null

                const isPartiallyFilled =
                    abbreviationValue !== null &&
                    vaccineValue === null

                return {
                    slot,
                    index,
                    abbreviationValue,
                    vaccineValue,
                    isFilled,
                    isPartiallyFilled,
                }
            }),
        [slots, values],
    )

    const firstEmptyIndex = useMemo(() => {
        const index = states.findIndex(
            (state) =>
                state.abbreviationValue === null &&
                state.vaccineValue === null,
        )

        return index === -1 ? null : index
    }, [states])

    const lastFilledIndex = useMemo(() => {
        for (let index = states.length - 1; index >= 0; index -= 1) {
            const state = states[index]

            if (
                state.abbreviationValue !== null ||
                state.vaccineValue !== null
            ) {
                return index
            }
        }

        return null
    }, [states])

    const nextFreeIndex = useMemo(() => {
        const preferredIndex = preferredNextIndexRef.current

        if (
            preferredIndex !== null &&
            preferredIndex >= 0 &&
            preferredIndex < states.length
        ) {
            return preferredIndex
        }

        return firstEmptyIndex
    }, [states, firstEmptyIndex])

    const allFilled = useMemo(
        () =>
            states.length > 0 &&
            states.every((state) => state.isFilled),
        [states],
    )

    /*
     * Actualización de campos.
     */
    const updateFields = useCallback(
        (fieldValues) => {
            Object.entries(fieldValues).forEach(
                ([fieldId, value]) => {
                    if (!fieldId) {
                        return
                    }

                    setFieldValue(fieldId, value)
                },
            )
        },
        [setFieldValue],
    )

    /*
     * Asignar solamente abreviatura.
     */
    const assignAbbreviationOnly = useCallback(
        (abbreviationCode, abbreviationLabel) => {
            if (nextFreeIndex === null) {
                return null
            }

            const target = states[nextFreeIndex]

            if (!target) {
                return null
            }

            setIsProcessing(true)

            try {
                updateFields({
                    [target.slot.abbreviationCode]:
                        abbreviationCode,

                    [target.slot.abbreviationText]:
                        abbreviationLabel,
                })

                preferredNextIndexRef.current = null

                return target
            } finally {
                /*
                 * Permite que React pinte el estado antes
                 * de continuar con el siguiente render.
                 */
                setTimeout(() => {
                    setIsProcessing(false)
                }, 100)
            }
        },
        [
            nextFreeIndex,
            states,
            updateFields,
        ],
    )

    /*
     * Asignar vacuna completa.
     */
    const assignFullVaccine = useCallback(
        ({
            abbreviationCode,
            abbreviationLabel,
            vaccineCode,
            vaccineText,
            drugCode,
            drugName,
            medicinalProductID,
            countryMedicinalProductID,
            maHolders,
            maHoldersMedicinalProductID,
            pharmaceuticalform,
            formsMedicinalProductID,
            strengthsMedicinalProductID,
            vaccineStrengths,
        }) => {
            if (nextFreeIndex === null) {
                return null
            }

            const target = states[nextFreeIndex]

            if (!target) {
                return null
            }

            setIsProcessing(true)

            try {
                updateFields({
                    [target.slot.abbreviationCode]:
                        abbreviationCode,

                    [target.slot.abbreviationText]:
                        abbreviationLabel,

                    [target.slot.vaccineCode]:
                        vaccineCode,

                    [target.slot.vaccineText]:
                        vaccineText,

                    [target.slot.drugCode]:
                        drugCode,

                    [target.slot.drugName]:
                        drugName,

                    [target.slot.medicinalProductID]:
                        medicinalProductID,

                    [target.slot.countryMedicinalProductID]:
                        countryMedicinalProductID,

                    [target.slot.maHolders]:
                        maHolders,

                    [target.slot.maHoldersMedicinalProductID]:
                        maHoldersMedicinalProductID,

                    [target.slot.pharmaceuticalform]:
                        pharmaceuticalform,

                    [target.slot.formsMedicinalProductID]:
                        formsMedicinalProductID,

                    [target.slot.strengthsMedicinalProductID]:
                        strengthsMedicinalProductID,

                    [target.slot.vaccineStrengths]:
                        vaccineStrengths,
                })

                preferredNextIndexRef.current = null

                return target
            } finally {
                setTimeout(() => {
                    setIsProcessing(false)
                }, 100)
            }
        },
        [
            nextFreeIndex,
            states,
            updateFields,
        ],
    )

    /*
     * Eliminar última vacuna.
     */
    const clearLastFilled = useCallback(() => {
        if (lastFilledIndex === null) {
            return null
        }

        const target = states[lastFilledIndex]

        if (!target) {
            return null
        }

        setIsProcessing(true)

        /*
         * Reservar inmediatamente el índice eliminado.
         */
        preferredNextIndexRef.current = lastFilledIndex

        try {
            updateFields({
                [target.slot.abbreviationCode]: null,
                [target.slot.abbreviationText]: null,

                [target.slot.vaccineCode]: null,
                [target.slot.vaccineText]: null,

                [target.slot.drugCode]: null,
                [target.slot.drugName]: null,

                [target.slot.medicinalProductID]: null,

                [target.slot.countryMedicinalProductID]:
                    null,

                [target.slot.maHolders]: null,

                [target.slot.maHoldersMedicinalProductID]:
                    null,

                [target.slot.pharmaceuticalform]: null,

                [target.slot.formsMedicinalProductID]:
                    null,

                [target.slot.strengthsMedicinalProductID]:
                    null,

                [target.slot.vaccineStrengths]: null,
            })

            return target
        } finally {
            setTimeout(() => {
                setIsProcessing(false)
            }, 100)
        }
    }, [
        lastFilledIndex,
        states,
        updateFields,
    ])

    return {
        states,
        nextFreeIndex,
        lastFilledIndex,
        allFilled,

        isProcessing,

        assignAbbreviationOnly,
        assignFullVaccine,
        clearLastFilled,
    }
}