import React from 'react'
import PropTypes from 'prop-types'
import { Button, CircularLoader, NoticeBox } from '@dhis2/ui'
import './actionButtons.css'

export const ActionButtons = ({
    canAssignAbbreviation,
    canAssignFull,
    canClearLast,
    nextSlotNumber,
    allSlotsFilled,
    isProcessing,
    onAssignAbbreviation,
    onAssignFull,
    onClearLast,
    onResetCascade,
}) => {
    return (
        <section className="action-buttons">
            {allSlotsFilled ? (
                <div className="action-buttons__notice">
                    <NoticeBox
                        warning
                        title="Sin slots disponibles"
                    >
                        No existen más campos disponibles para
                        registrar vacunas.
                    </NoticeBox>
                </div>
            ) : nextSlotNumber !== null ? (
                <div className="action-buttons__next">
                    <span className="action-buttons__next-label">
                        Siguiente:
                    </span>

                    <span className="action-buttons__next-value">
                        Vacuna {nextSlotNumber}
                    </span>
                </div>
            ) : null}

            {isProcessing && (
                <div className="action-buttons__processing">
                    <CircularLoader small />

                    <span>
                        Procesando vacuna...
                    </span>
                </div>
            )}

            <div
                className={`action-buttons__actions ${
                    isProcessing
                        ? 'action-buttons__actions--processing'
                        : ''
                }`}
            >
                <Button
                    primary
                    disabled={
                        isProcessing ||
                        !canAssignFull
                    }
                    onClick={onAssignFull}
                >
                    Asignar vacuna completa
                </Button>

                <Button
                    disabled={
                        isProcessing ||
                        !canAssignAbbreviation
                    }
                    onClick={onAssignAbbreviation}
                >
                    Asignar solo abreviatura
                </Button>

                <Button
                    secondary
                    disabled={
                        isProcessing ||
                        !canClearLast
                    }
                    onClick={onClearLast}
                >
                    Eliminar última vacuna
                </Button>

                <Button
                    small
                    disabled={isProcessing}
                    onClick={onResetCascade}
                >
                    Limpiar selección
                </Button>
            </div>
        </section>
    )
}

ActionButtons.propTypes = {
    canAssignAbbreviation: PropTypes.bool.isRequired,
    canAssignFull: PropTypes.bool.isRequired,
    canClearLast: PropTypes.bool.isRequired,
    nextSlotNumber: PropTypes.number,
    allSlotsFilled: PropTypes.bool.isRequired,
    isProcessing: PropTypes.bool.isRequired,
    onAssignAbbreviation: PropTypes.func.isRequired,
    onAssignFull: PropTypes.func.isRequired,
    onClearLast: PropTypes.func.isRequired,
    onResetCascade: PropTypes.func.isRequired,
}