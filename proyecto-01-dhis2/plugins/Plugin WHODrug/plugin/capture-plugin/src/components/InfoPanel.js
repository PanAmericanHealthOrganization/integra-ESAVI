import React from 'react'
import PropTypes from 'prop-types'
import { Card } from '@dhis2/ui'

const InfoRow = ({ label, value }) => (
    <p style={{ margin: '4px 0' }}>
        <strong>{label}:</strong>{' '}
        {value && value.trim() !== ''
            ? value
            : 'No existe informacion adicional.'}
    </p>
)

InfoRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string,
}

export const InfoPanel = ({ item, show }) => {
    if (!show || !item) return null

    return (
        <Card>
            <div style={{ padding: 12 }}>
                <h4 style={{ marginTop: 0 }}>Informacion de la vacuna</h4>
                <InfoRow label="Abreviatura" value={item.abbreviation} />
                <InfoRow label="Nombre comercial" value={item.drugName} />
                <InfoRow label="Titular" value={item.maHolders} />
                <InfoRow
                    label="Forma/presentacion"
                    value={item.formTranslations ?? item.form}
                />
                <InfoRow label="Potencia" value={item.strength} />
                <InfoRow
                    label="Ingrediente"
                    value={item.ingredientTranslations ?? item.ingredient}
                />
                {item.noDoses ? <InfoRow label="Dosis" value={item.noDoses} /> : null}
                {item.diluent ? <InfoRow label="Diluyente" value={item.diluent} /> : null}
            </div>
        </Card>
    )
}

InfoPanel.propTypes = {
    item: PropTypes.object,
    show: PropTypes.bool.isRequired,
}
