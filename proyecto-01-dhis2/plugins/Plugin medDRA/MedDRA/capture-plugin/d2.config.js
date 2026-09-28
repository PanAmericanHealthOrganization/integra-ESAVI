const config = {
    type: 'app',
    name: 'meddra-plugin',
    title: 'MedDRA Search Field Plugin',
    description: 'DHIS2 Capture Form Field Plugin for MedDRA LLT search',

    entryPoints: {
        app: './src/App.js',
        plugin: './src/Plugin.js',
        },

    pluginType: 'CAPTURE',
}

module.exports = config
