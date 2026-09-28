import React from 'react'
import { CenteredContent, CircularLoader } from '@dhis2/ui'

const App = () => {
    return React.createElement(
        CenteredContent,
        null,
        React.createElement(CircularLoader)
    )
}

export default App
