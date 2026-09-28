const config = {
    type: 'app',
    name: 'whodrug-plugin',
    title: 'WHODrug Form Field Plugin',
    description:
        'DHIS2 Capture Field Form Plugin para asignar vacunas mediante la API WHODrug.',
    minDHIS2Version: '2.42',

    entryPoints: {
        app: './src/App.js',
        plugin: './src/Plugin.js',
    },

    pluginType: 'CAPTURE',
}

module.exports = config
