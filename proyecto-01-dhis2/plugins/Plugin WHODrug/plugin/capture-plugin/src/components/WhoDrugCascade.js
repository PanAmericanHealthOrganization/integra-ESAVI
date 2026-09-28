import React, { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { NoticeBox } from '@dhis2/ui'
import { useWhoDrugQuery } from '../hooks/useWhoDrugQuery.js'
import { useVaccineSlots } from '../hooks/useVaccineSlots.js'
import {
    getItemsFromResponse,
    getLabelByLevel,
    isLeafLevel,
} from '../utils/normalizeResponse.js'
import { ActionButtons } from './ActionButtons.js'
import { InfoPanel } from './InfoPanel.js'
import { SearchableSelect } from './SearchableSelect.js'

const initialSelection = {
    abbreviationCode: null,
    abbreviationLabel: null,
    vaccineCode: null,
    vaccineText: null,
    drugCode: null,
    drugName: null,
    medicinalProductID: null,
    countryMedicinalProductID: null,
    maHolders: null,
    maHoldersMedicinalProductID: null,
    pharmaceuticalform: null,
    formsMedicinalProductID: null,
    strengthsMedicinalProductID: null,
    vaccineStrengths: null
}

const findItemById = (items, id) => items.find((it) => it.id === id) ?? null

export const WhoDrugCascade = ({
    config,
    slots,
    values,
    setFieldValue,
}) => {
    const [selection, setSelection] = useState(initialSelection)

    const abbreviationsParams = useMemo(
        () => ({ country: config.country }),
        [config.country],
    )
    const drugNamesParams = useMemo(
        () =>
            selection.abbreviation
                ? {
                    country: config.country,
                    abbreviation: selection.abbreviation.abbreviation ?? '',
                }
                : null,
        [config.country, selection.abbreviation],
    )
    const maHoldersParams = useMemo(
        () =>
            selection.abbreviation && selection.drugName
                ? {
                    country: config.country,
                    abbreviation: selection.abbreviation.abbreviation ?? '',
                    drugName: selection.drugName.drugName ?? '',
                }
                : null,
        [config.country, selection.abbreviation, selection.drugName],
    )
    const formsParams = useMemo(
        () =>
            selection.abbreviation && selection.drugName && selection.maHolder
                ? {
                    country: config.country,
                    abbreviation: selection.abbreviation.abbreviation ?? '',
                    drugName: selection.drugName.drugName ?? '',
                    maHolders: selection.maHolder.maHolders ?? '',
                }
                : null,
        [
            config.country,
            selection.abbreviation,
            selection.drugName,
            selection.maHolder,
        ],
    )
    const strengthsParams = useMemo(
        () =>
            selection.abbreviation &&
                selection.drugName &&
                selection.maHolder &&
                selection.form
                ? {
                    country: config.country,
                    abbreviation: selection.abbreviation.abbreviation ?? '',
                    drugName: selection.drugName.drugName ?? '',
                    maHolders: selection.maHolder.maHolders ?? '',
                    forms: selection.form.formTranslations ?? selection.form.form ?? '',
                }
                : null,
        [
            config.country,
            selection.abbreviation,
            selection.drugName,
            selection.maHolder,
            selection.form,
        ],
    )

    const abbreviations = useWhoDrugQuery(config, 'abbreviations', abbreviationsParams)
    const drugNames = useWhoDrugQuery(config, 'drugNames', drugNamesParams)
    const maHolders = useWhoDrugQuery(config, 'maHolders', maHoldersParams)
    const forms = useWhoDrugQuery(config, 'forms', formsParams)
    const strengths = useWhoDrugQuery(config, 'strengths', strengthsParams)

    const slotsApi = useVaccineSlots({ slots, values, setFieldValue })

    const handleSelect = useCallback(
        (level, response) => (id) => {
            if (!id) {
                setSelection((prev) => clearFromLevel(prev, level))
                return
            }
            const items = getItemsFromResponse(level, response)
            const item = findItemById(items, id)
            if (!item) return
            setSelection((prev) => applySelection(prev, level, item))
        },
        [],
    )

    const buildOptions = (level, response) => {
        const items = getItemsFromResponse(level, response)
        return items
            .map((it) => ({
                value: it.id,
                label: getLabelByLevel(level, it),
            }))
            .filter((opt) => opt.label !== '')
    }

    const isLevelLeaf = (response, level) =>
        isLeafLevel(response) && getItemsFromResponse(level, response).length === 1

    const drugNamesAtLeaf = isLevelLeaf(drugNames.data, 'drugNames')
    const maHoldersAtLeaf = isLevelLeaf(maHolders.data, 'maHolders')
    const formsAtLeaf = isLevelLeaf(forms.data, 'forms')
    const strengthsAtLeaf = isLevelLeaf(strengths.data, 'strengths')

    const showDrugNames = selection.abbreviation !== null && !drugNamesAtLeaf
    const showMaHolders =
        showDrugNames && selection.drugName !== null && !maHoldersAtLeaf
    const showForms =
        showMaHolders && selection.maHolder !== null && !formsAtLeaf
    const showStrengths =
        showForms && selection.form !== null && !strengthsAtLeaf

    const leafItem = useMemo(() => {
        if (selection.strength) return selection.strength
        if (selection.form && strengthsAtLeaf) {
            return getItemsFromResponse('strengths', strengths.data)[0] ?? null
        }
        if (selection.maHolder && formsAtLeaf) {
            return getItemsFromResponse('forms', forms.data)[0] ?? null
        }
        if (selection.drugName && maHoldersAtLeaf) {
            return getItemsFromResponse('maHolders', maHolders.data)[0] ?? null
        }
        if (selection.abbreviation && drugNamesAtLeaf) {
            return getItemsFromResponse('drugNames', drugNames.data)[0] ?? null
        }
        return null
    }, [
        selection,
        drugNamesAtLeaf,
        maHoldersAtLeaf,
        formsAtLeaf,
        strengthsAtLeaf,
        drugNames.data,
        maHolders.data,
        forms.data,
        strengths.data,
    ])

    const canAssignFull = leafItem !== null && slotsApi.nextFreeIndex !== null
    const canAssignAbbreviation =
        selection.abbreviation !== null && slotsApi.nextFreeIndex !== null
    const canClearLast = slotsApi.lastFilledIndex !== null

    const onAssignAbbreviation = useCallback(() => {
        if (!selection.abbreviation) return
        slotsApi.assignAbbreviationOnly(
            selection.abbreviation.id,
            selection.abbreviation.abbreviation ?? '',
        )
    }, [selection.abbreviation, slotsApi])

    const onAssignFull = useCallback(() => {
        if (!selection.abbreviation || !leafItem) return
        slotsApi.assignFullVaccine({
            abbreviationCode: selection.abbreviation?.id ?? '',
            abbreviationLabel: selection.abbreviation?.abbreviation ?? '',
            vaccineCode: leafItem?.drugCode ?? '',
            vaccineText: leafItem?.drugName ?? '',
            drugCode: leafItem?.drugCode ?? '',
            drugName: leafItem?.drugName ?? '',
            medicinalProductID: leafItem?.medicinalProductID ?? '',
            countryMedicinalProductID: leafItem?.countryMedicinalProductID ?? '',
            maHolders: leafItem?.maHolders ?? '',
            maHoldersMedicinalProductID: leafItem?.maHoldersMedicinalProductID ?? '',
            pharmaceuticalform: leafItem?.ingredient ?? '',
            formsMedicinalProductID: leafItem?.formsMedicinalProductID ?? '',
            strengthsMedicinalProductID: leafItem?.strengthsMedicinalProductID ?? '',
            vaccineStrengths: leafItem?.strength ?? ''
        })
        setSelection(initialSelection)
    }, [selection.abbreviation, leafItem, slotsApi])

    const onClearLast = useCallback(() => {
        slotsApi.clearLastFilled()
    }, [slotsApi])

    const onResetCascade = useCallback(() => {
        setSelection(initialSelection)
    }, [])

    const apiError =
        abbreviations.error ||
        drugNames.error ||
        maHolders.error ||
        forms.error ||
        strengths.error
    const nextSlotNumber =
        slotsApi.nextFreeIndex !== null ? slotsApi.nextFreeIndex + 1 : null

    return (
        <div>
            {apiError ? (
                <NoticeBox error title="Error consultando WHODrug">
                    {apiError.message}
                </NoticeBox>
            ) : null}

            <SearchableSelect
                label="Abreviatura"
                placeholder="Seleccionar abreviatura"
                options={buildOptions('abbreviations', abbreviations.data)}
                selected={selection.abbreviation?.id ?? ''}
                onChange={handleSelect('abbreviations', abbreviations.data)}
                loading={abbreviations.loading}
            />
            {showDrugNames ? (
                <SearchableSelect
                    label="Nombre comercial de la vacuna"
                    placeholder="Seleccionar nombre comercial"
                    options={buildOptions('drugNames', drugNames.data)}
                    selected={selection.drugName?.id ?? ''}
                    onChange={handleSelect('drugNames', drugNames.data)}
                    loading={drugNames.loading}
                />
            ) : null}
            {showMaHolders ? (
                <SearchableSelect
                    label="Titular de la vacuna"
                    placeholder="Seleccionar titular"
                    options={buildOptions('maHolders', maHolders.data)}
                    selected={selection.maHolder?.id ?? ''}
                    onChange={handleSelect('maHolders', maHolders.data)}
                    loading={maHolders.loading}
                />
            ) : null}
            {showForms ? (
                <SearchableSelect
                    label="Forma / presentacion"
                    placeholder="Seleccionar forma"
                    options={buildOptions('forms', forms.data)}
                    selected={selection.form?.id ?? ''}
                    onChange={handleSelect('forms', forms.data)}
                    loading={forms.loading}
                />
            ) : null}
            {showStrengths ? (
                <SearchableSelect
                    label="Potencia"
                    placeholder="Seleccionar potencia"
                    options={buildOptions('strengths', strengths.data)}
                    selected={selection.strength?.id ?? ''}
                    onChange={handleSelect('strengths', strengths.data)}
                    loading={strengths.loading}
                />
            ) : null}

            <InfoPanel item={leafItem} show={leafItem !== null} />

            <ActionButtons
                canAssignAbbreviation={canAssignAbbreviation}
                canAssignFull={canAssignFull}
                canClearLast={canClearLast}
                nextSlotNumber={nextSlotNumber}
                allSlotsFilled={slotsApi.allFilled}
                onAssignAbbreviation={onAssignAbbreviation}
                onAssignFull={onAssignFull}
                onClearLast={onClearLast}
                onResetCascade={onResetCascade}
            />
        </div>
    )
}

const applySelection = (prev, level, item) => {
    switch (level) {
        case 'abbreviations':
            return {
                abbreviation: item,
                drugName: null,
                maHolder: null,
                form: null,
                strength: null,
            }
        case 'drugNames':
            return {
                ...prev,
                drugName: item,
                maHolder: null,
                form: null,
                strength: null,
            }
        case 'maHolders':
            return {
                ...prev,
                maHolder: item,
                form: null,
                strength: null,
            }
        case 'forms':
            return { ...prev, form: item, strength: null }
        case 'strengths':
            return { ...prev, strength: item }
        default:
            return prev
    }
}

const clearFromLevel = (prev, level) => {
    switch (level) {
        case 'abbreviations':
            return initialSelection
        case 'drugNames':
            return {
                ...prev,
                drugName: null,
                maHolder: null,
                form: null,
                strength: null,
            }
        case 'maHolders':
            return { ...prev, maHolder: null, form: null, strength: null }
        case 'forms':
            return { ...prev, form: null, strength: null }
        case 'strengths':
            return { ...prev, strength: null }
        default:
            return prev
    }
}

WhoDrugCascade.propTypes = {
    config: PropTypes.object.isRequired,
    slots: PropTypes.arrayOf(PropTypes.object).isRequired,
    values: PropTypes.object.isRequired,
    setFieldValue: PropTypes.func.isRequired,
}
