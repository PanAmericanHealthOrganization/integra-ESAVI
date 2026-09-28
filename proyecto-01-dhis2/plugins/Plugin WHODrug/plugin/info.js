/* DPE: WHODRUG API Implementation */
    window.ESAVI = window.ESAVI || {};
    window.ESAVI.state = window.ESAVI.state || {};
    window.ESAVI.dropdowns = window.ESAVI.dropdowns || {};
    var COUNTRY = 'PRY';
    var params = {
        ABBPARAM: null,
        DRUGPARAM: null,
        MAHOLDERPARAM: null,
        FORMPARAM: null,
        STRENGTHPARAM: null
    }
    var ABBPARAM = null;
    var DRUGPARAM = null;
    var MAHOLDERPARAM = null;
    var FORMPARAM = null;
    var STRENGTHPARAM = null;
    var RESETTING_DROPDOWNS = false;
    var VACCINENUMBER = undefined;

    function createRemoteDropDown(config) {
        const { buttonId, listId, mapItem, cacheKey, value, onSelect } = config;
        let fetchFunction = config.fetchFunction;
        const button = document.getElementById(buttonId);
        const list = document.getElementById(listId);
        let loaded = false;
        let items = [];
        let originCacheKey = cacheKey;
        if (value === 'drugNames') !ABBPARAM ? null : originCacheKey += '-' + ABBPARAM;
        if (value === 'maHolders') !ABBPARAM && !DRUGPARAM ? null :  originCacheKey += '-' + ABBPARAM + '-' + DRUGPARAM;
        if (value === 'forms') !ABBPARAM && !DRUGPARAM && !MAHOLDERPARAM ? null : originCacheKey += '-' + ABBPARAM + '-' + DRUGPARAM + '-' + MAHOLDERPARAM;
        if (value === 'strength') !ABBPARAM && !DRUGPARAM && !MAHOLDERPARAM && !FORMPARAM ? null : originCacheKey += '-' + ABBPARAM + '-' + DRUGPARAM + '-' + MAHOLDERPARAM + '-' + FORMPARAM;
        async function open() {
            list.classList.remove('hide');
            button.innerText = 'Cargando...';
            items = [];
            items = await fetchFunction();
            // Validate if the selection has more than one item to show the dropdown
            showWhodrugInfo( value, items );
            loaded = true;
            button.innerText = 'Select Item';
        }
        // Render information before the API request
        function render(data, value) {
            list.innerHTML = '';
            data[value].forEach( item => {
                const mapped = mapItem(item);
                const div = document.createElement('div');
                div.className = 'dropdown-item';
                div.innerText = mapped.label;

                div.addEventListener('click', () => {
                    button.innerText = mapped.displayValue;
                    list.classList.add('hide');
                    if(onSelect) onSelect(mapped.value, mapped.label);
                });
                list.appendChild(div);
            } );
        }
        // Click to select an item
        button.addEventListener('click', async() => {
            if (button.classList.contains('disabled')) return;
            await open();
            render(items, value);
        });
        // Close dropdown on escape or click outside
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                close();
            }
        });
        document.addEventListener('click', (event) => {
            if (!button.contains(event.target) && !list.contains(event.target)) {
                close();
            }
        });
        // Close function
        function close() {
            list.classList.add('hide');
        }
        // Reset function
        return {
            reset(newFetchFunction) {
                list.innerHTML = '';
                list.classList.add('hide');
                loaded = false;
                items = [];
                if( typeof newFetchFunction === 'function' ) {
                    fetchFunction = newFetchFunction;
                } else {
                    fetchFunction = async () => [];
                }

            },
            open
        }
    }
    function showWhodrugInfo( value, items ) {
        let htmlContent = '';
        if (value === 'drugNames' && items?.total === '1' ) {
            const div = document.getElementById(`whodrug-info`);
            htmlContent = `<p><strong>Nombre comercial de la vacuna:</strong> ${items.drugNames[0].drugName || 'No existe información adicional.'}</p>`;
            htmlContent += `<p><strong>Titular de la vacuna:</strong> ${items.drugNames[0].maHolders || 'No existe información adicional.'}</p>`;
            htmlContent += `<p><strong>Forma/presentación:</strong> ${items.drugNames[0].formTranslations || 'No existe información adicional.'}</p>`;
            htmlContent += `<p><strong>Potencia:</strong> ${items.drugNames[0].strength || 'No existe información adicional.'}</p>`;
            setVaccineNameSelected( items.drugNames[0].id || '', vaccineNameElements );
        }
        if ( value === 'drugNames' && items?.total > 1 ) {
            hideShow(`div[id="whodrug-${value}"]`, 'show');
        }
        if ( value === 'maHolders' && items?.total === '1' ) {
            const div = document.getElementById(`whodrug-info`);
            htmlContent = `<p><strong>Titular de la vacuna:</strong> ${items.maHolders[0].maHolders || 'No existe información adicional.'}</p>`;
            htmlContent += `<p><strong>Forma/presentación:</strong> ${items.maHolders[0].formTranslations || 'No existe información adicional.'}</p>`;
            htmlContent += `<p><strong>Potencia:</strong> ${items.maHolders[0].strength || 'No existe información adicional.'}</p>`;
            setVaccineNameSelected( items.maHolders[0].id || '', vaccineNameElements );
        }
        if ( value === 'maHolders' && items?.total > 1 ) {
            hideShow(`div[id="whodrug-${value}"]`, 'show');
        }
        if ( value === 'forms' && items?.total === '1' ) {
            const div = document.getElementById(`whodrug-info`);
            htmlContent = `<p><strong>Forma/presentación:</strong> ${items.forms[0].formTranslations || 'No existe información adicional.'}</p>`;
            htmlContent += `<p><strong>Potencia:</strong> ${items.forms[0].strength || 'No existe información adicional.'}</p>`;
            setVaccineNameSelected( items.forms[0].id || '', vaccineNameElements );
        }
        if ( value === 'forms' && items?.total > 1 ) {
            hideShow(`div[id="whodrug-${value}"]`, 'show');
        }
        if ( value === 'strengths' && items?.total === '1' ) {
            const div = document.getElementById(`whodrug-info`);
            htmlContent = `<p><strong>Potencia:</strong> ${items.strengths[0].strength || 'No existe información adicional.'}</p>`;
        }
        if ( value === 'strengths' && items?.total > 1 ) {
            hideShow(`div[id="whodrug-${value}"]`, 'show');
        }
        informationPopulation(`div[id="whodrug-info"]`, htmlContent);
        return;
    }

    function informationPopulation(selector, html) {
        hideShow(selector, 'show');
        const elements = document.querySelectorAll(selector);
        elements.forEach( el => {
            el.innerHTML = html;
        });
    }

    window.ESAVI.dropdowns.abbreviationsDropdown = null;
    window.ESAVI.dropdowns.drugNamesDropdown = null;
    window.ESAVI.dropdowns.maHoldersDropDown = null;
    window.ESAVI.dropdowns.formsDropdown = null;
    window.ESAVI.dropdowns.strengthDropdown = null;
    
    // Abgreviations fetch function
    async function fetchAbbreviations() {
        const response = await fetch(`https://dhis2-pai-whodrug.mspbs.gov.py/api/vaccines-whodrug/abbreviations?country=${COUNTRY}`);
        const data = await response.json();
        return data;
    }
    // Drugnames fetch function
    async function fetchDrugNames () {
        if(  !ABBPARAM ) {
            return { drugNames: [] };
        }
        const response = await fetch(`https://dhis2-pai-whodrug.mspbs.gov.py/api/vaccines-whodrug/drug-name?country=${COUNTRY}&abbreviation=${encodeURIComponent(ABBPARAM)}`);
        const data = await response.json();
        return data;
    }
    // MAHolders fetch function
    async function fetchMAHolders () {
        const response = await fetch(`https://dhis2-pai-whodrug.mspbs.gov.py/api/vaccines-whodrug/ma-holder?country=${COUNTRY}&abbreviation=${encodeURIComponent(ABBPARAM)}&drugName=${encodeURIComponent(DRUGPARAM)}`);
        const data = await response.json();
        return data;
    }
    // Form fetch function
    async function fetchForms() {
        const response = await fetch(`https://dhis2-pai-whodrug.mspbs.gov.py/api/vaccines-whodrug/forms?country=${COUNTRY}&abbreviation=${encodeURIComponent(ABBPARAM)}&drugName=${encodeURIComponent(DRUGPARAM)}&maHolders=${encodeURIComponent(MAHOLDERPARAM)}`);
        const data = await response.json();
        return data;
    }
    // Strenght fetch function
    async function fetchStrengths() {
        const response = await fetch(`https://dhis2-pai-whodrug.mspbs.gov.py/api/vaccines-whodrug/strength?country=${COUNTRY}&abbreviation=${encodeURIComponent(ABBPARAM)}&drugName=${encodeURIComponent(DRUGPARAM)}&maHolders=${encodeURIComponent(MAHOLDERPARAM)}&forms=${encodeURIComponent(FORMPARAM)}`);
        const data = await response.json();
        return data;
    }
    // Get vaccine information from id
    async function fetchVaccineInfoById(vaccineId) {
        const response = await fetch(`https://dhis2-pai-whodrug.mspbs.gov.py/api/vaccines-whodrug/info/${vaccineId}`);
        const data = await response.json();
        return data;
    }

    function mapAbbreviationItem(item) {
        return {
            label: `${item.abbreviation}`,
            value: item.id,
            displayValue: `${item.abbreviation}`
        };
    }

    function mapDrugNameItem(item) {
        return {
            label: `${item.drugName}`,
            value: item.id,
            displayValue: `${item.drugName}`
        };
    }

    function mapMaHolderItem(item) {
        return {
            label: `${item.maHolders}`,
            value: item.id,
            displayValue: `${item.maHolders}`
        };
    }

    function mapFormItem(item) {
        return {
            label: `${item.formTranslations}`,
            value: item.id,
            displayValue: `${item.formTranslations}`
        };
    }

    function mapStrengthItem(item) {
        return {
            label: `${item.strength}`,
            value: item.id,
            displayValue: `${item.strength}`,
            abbreviation: item.abbreviation
        };
    }

    function setVaccineAbbreviationSelected(value, dataArray) {
        const vaccinesFilled = getVaccinesSelected(dataArray);
        for( let i=0; i < dataArray.length - 1; i++ ) {
            let abbreviationElementId = dataArray[i].code;
            if( vaccinesFilled[i] === undefined ) {
                hideShow(`div[id="delete-vaccine-${i + 1}"]`, 'show');
                setInputValueAbbreviation(`input[id="lSpdre0srBn-${abbreviationElementId}-val"]`, value);
                hideShow(`p[id="whodrug-vaccine-abbreviation-${i + 1}"]`, 'show');
                getVaccineNumber();
                break;
            }
        }
    }

    function setVaccineNameSelected(value, dataArray) {
        let form = document.querySelectorAll("form[name='outerDataEntryForm']");
        let newForm = validateForm(form) ? validateForm(form) : form[1];
        let $scope = angular.element(newForm).scope();
        const vaccinesFilled = getVaccinesSelected(dataArray);
        for( let i=0; i < dataArray.length - 1; i++ ) {
            let dataElementId = dataArray[i].text;
            let abbreviationElementId = dataArray[i].code;
            if( i > dataArray.length -1 || vaccinesFilled.length >= dataArray.length ) {
                const elements = document.querySelectorAll('span[id="vaccine-number"]');
                elements.forEach( element => {
                    element.innerText = "No exiten más campos disponibles para registrar vacunas.";
                });
                break;
            }
            if( vaccinesFilled[i] === undefined ) {
                setValueInput(`input[id="lSpdre0srBn-${dataElementId}-val"]`, value);
                hideShow(`div[id="delete-vaccine-${i + 1}"]`, 'show');
                setInputValueAbbreviation(`input[id="lSpdre0srBn-${abbreviationElementId}-val"]`, ABBPARAM);
                getVaccineNumber();
                break;
            }
        }
    }

    function getVaccineNumber() {
        setTimeout(() => {
            let vaccinesLength = vaccineNameElements?.length || 0;
            if ( vaccinesLength === 0 ) return undefined;
            let vaccinesFilled = getVaccinesSelected(vaccineNameElements);
            VACCINENUMBER = vaccinesFilled.length + 1;
            const elements = document.querySelectorAll('span[id="vaccine-number"]');
            elements.forEach( element => {
                element.innerText = '';
                element.innerText = "Vacuna " + VACCINENUMBER;
            });
        }, 300)
    }
    getVaccineNumber();

    function getVaccinesSelected(dataArray) {
        let form = document.querySelectorAll("form[name='outerDataEntryForm']");
        let newForm = validateForm(form) ? validateForm(form) : form[1];
        let $scope = angular.element(newForm).scope();
        let arrayData = [];
        dataArray.forEach(e => {
            //let valueText = $scope.currentEvent[e.text];
            let valueText = $scope.currentEvent[e.code];
            hasValue(valueText) ? arrayData.push(valueText) : null;
        });
        return arrayData;
    }

    window.ESAVI.dropdowns.abbreviationsDropdown = createRemoteDropDown({
        buttonId: 'drugDropdownBtn-Abbreviation',
        listId: 'drugDropdownList-Abbreviation',
        fetchFunction: fetchAbbreviations,
        mapItem: mapAbbreviationItem,
        cacheKey: 'abbreviationsCache',
        value: 'abbreviations',
        onSelect: (value, label) => {
            ABBPARAM = label;
            DRUGPARAM = null;
            MAHOLDERPARAM = null;
            FORMPARAM = null;
            STRENGTHPARAM = null;
            resetDropdown('drugDropdownBtn-Drugname', 'Seleccionar nombre comercial de la vacuna');
            resetDropdown('drugDropdownBtn-Maholder', 'Seleccionar titular de la vacuna');
            resetDropdown('drugDropdownBtn-Form', 'Seleccionar forma/presentación');
            resetDropdown('drugDropdownBtn-Strength', 'Seleccionar potencia');
            enableDropdown('drugDropdownBtn-Drugname');
            window.ESAVI.dropdowns.drugNamesDropdown.reset(() => fetchDrugNames());
            setTimeout(() => {
                window.ESAVI.dropdowns.drugNamesDropdown.open();
            }, 100);
        }
    });

    function enableDropdown(buttonId) {
        const elements = document.querySelectorAll(`#${buttonId}`);
        elements.forEach( element => {
            element.classList.remove('disabled');
        });
    }

    window.ESAVI.dropdowns.drugNamesDropdown = createRemoteDropDown({
        buttonId: 'drugDropdownBtn-Drugname',
        listId: 'drugDropdownList-Drugname',
        fetchFunction: fetchDrugNames,
        mapItem: mapDrugNameItem,
        cacheKey: 'drugNamesCache-',
        value: 'drugNames',
        onSelect: (value, label) => {
            DRUGPARAM = label;
            MAHOLDERPARAM = null;
            FORMPARAM = null;
            STRENGTHPARAM = null;
            resetDropdown('drugDropdownBtn-Maholder', 'Seleccionar titular de la vacuna');
            resetDropdown('drugDropdownBtn-Form', 'Seleccionar forma/presentación');
            resetDropdown('drugDropdownBtn-Strength', 'Seleccionar potencia');
            enableDropdown('drugDropdownBtn-Maholder');
            window.ESAVI.dropdowns.maHoldersDropDown.reset(() => fetchMAHolders());
            setTimeout(() => {
                window.ESAVI.dropdowns.maHoldersDropDown.open();
            }, 100)
        }
    })

    window.ESAVI.dropdowns.maHoldersDropDown = createRemoteDropDown({
        buttonId: 'drugDropdownBtn-Maholder',
        listId: 'drugDropdownList-Maholder',
        fetchFunction: fetchMAHolders,
        mapItem: mapMaHolderItem,
        cacheKey: 'maHoldersCache-',
        value: 'maHolders',
        onSelect: (value, label) => {
            MAHOLDERPARAM = label;
            FORMPARAM = null;
            STRENGTHPARAM = null;
            resetDropdown('drugDropdownBtn-Form', 'Seleccionar forma/presentación');
            resetDropdown('drugDropdownBtn-Strength', 'Seleccionar potencia');
            enableDropdown('drugDropdownBtn-Form');
            window.ESAVI.dropdowns.formsDropdown.reset(() => fetchForms());
            setTimeout(() => {
                window.ESAVI.dropdowns.formsDropdown.open();
            }, 100)
        }
    })

    window.ESAVI.dropdowns.formsDropdown = createRemoteDropDown({
        buttonId: 'drugDropdownBtn-Form',
        listId: 'drugDropdownList-Form',
        fetchFunction: fetchForms,
        mapItem: mapFormItem,
        cacheKey: 'formsCache-',
        value: 'forms',
        onSelect: (value, label) => {
            FORMPARAM = label;
            STRENGTHPARAM = null;
            resetDropdown('drugDropdownBtn-Strength', 'Seleccionar potencia');
            enableDropdown('drugDropdownBtn-Strength');
            window.ESAVI.dropdowns.strengthDropdown.reset(() => fetchStrengths());
            setTimeout(() => {
                window.ESAVI.dropdowns.strengthDropdown.open();
            }, 100)
        }
    })

    window.ESAVI.dropdowns.strengthDropdown = createRemoteDropDown({
        buttonId: 'drugDropdownBtn-Strength',
        listId: 'drugDropdownList-Strength',
        fetchFunction: fetchStrengths,
        mapItem: mapStrengthItem,
        cacheKey: 'strengthsCache-',
        value: 'strengths',
        onSelect: (value, label, id, abbreviation) => {
            STRENGTHPARAM = value;
            // Assign vaccine name to the data element
            setVaccineNameSelected( value, vaccineNameElements );
        }
    })

    function resetDropdown(selector, defaultText) {
        const elements = document.querySelectorAll(`${selector}`);
        elements.forEach( element => {
            element.innerText = defaultText;
        });
    }

    function resetList(selector) {
        const list = document.querySelectorAll(selector);
        list.forEach( element => {
            element.innerHTML = '';
        });
    }

    function enableDropdown(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.remove('disabled');
            button.innerText = 'Select...';
        }
    }

    function resetAllSelections() {
        ABBPARAM = null;
        DRUGPARAM = null;
        MAHOLDERPARAM = null;
        FORMPARAM = null;
        STRENGTHPARAM = null;
        RESETTING_DROPDOWNS = true;
        resetDropdown('div[id="drugDropdownBtn-Abbreviation"]', ' Seleccionar abreviatura');
        resetDropdown('div[id="drugDropdownBtn-Drugname"]', 'Seleccionar nombre comercial de la vacuna');
        resetDropdown('div[id="drugDropdownBtn-Maholder"]', 'Seleccionar titular de la vacuna');
        resetDropdown('div[id="drugDropdownBtn-Form"]', 'Seleccionar forma/presentación');
        resetDropdown('div[id="drugDropdownBtn-Strength"]', 'Seleccionar potencia');
        resetList('div[id="drugDropdownList-Drugname"]');
        resetList('div[id="drugDropdownList-Maholder"]');
        resetList('div[id="drugDropdownList-Form"]');
        resetList('div[id="drugDropdownList-Strength"]');
        window.ESAVI.dropdowns.drugNamesDropdown.reset(() => []);
        window.ESAVI.dropdowns.maHoldersDropDown.reset(() => []);
        window.ESAVI.dropdowns.formsDropdown.reset(() => []);
        window.ESAVI.dropdowns.strengthDropdown.reset(() => []);
        informationPopulation('div[id="whodrug-info"]', '');
        hideShow('div[id="whodrug-info"]', 'hide');
        hideShow('div[id="whodrug-drugNames"]', 'hide');
        hideShow('div[id="whodrug-maHolders"]', 'hide');
        hideShow('div[id="whodrug-forms"]', 'hide');
        hideShow('div[id="whodrug-strengths"]', 'hide');
        getVaccineNumber();
    }

    function initResetButton() {
        const resetButton = document.getElementById('whodrug-reset-selection');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                resetAllSelections();
            });
        }else {
            setTimeout(() => {
                initResetButton();
            }, 500);
        }
    }

    initResetButton();

    function initAssignVaccineButton() {
        const assignVaccineButton = document.getElementById('whodrug-assign-selection');
        if (assignVaccineButton) {
            assignVaccineButton.addEventListener('click', () => {
                console.log('Presiona botón de asignar', ABBPARAM);
                setVaccineAbbreviationSelected( ABBPARAM, vaccineNameElements );
            });
        }else {
            setTimeout(() => {
                initAssignVaccineButton();
            }, 500);
        }
    }
    initAssignVaccineButton();

    // Get DataElement value for modal
    async function getDataElementValue(dataElementId) {
        let deId = dataElementId.slice(12);
        const value = $(`#lSpdre0srBn-${deId}-val`).val();
        return value;
    }
    // Function to show vaccine info in a modal
    async function showVaccineInfo(dataElementId, index){
        const vaccineId = await getDataElementValue(dataElementId);
        if(!vaccineId) return;
        try {
            const { vaccineInfo } = await fetchVaccineInfoById(vaccineId);
            const data = vaccineInfo || {};
            alert(`
                        Información de la vacuna ${index}
                Abreviatura: ${data?.abbreviation || 'No existe información de abreviatura.'}
                Código del medicamento (WHODrug): ${data?.drugCode || 'No existe información del código del medicamento.'}
                Nombre comercial: ${data?.drugName || 'No existe información del nombre comercial.'}
                Titular: ${data?.maHolders || 'No existe información del titular de la vacuna.'}
                Forma/Presentación: ${data?.formTranslations || 'No existe información de la forma/presentación de la vacuna.'}
                Potencia: ${data?.strength || 'No existe información de la potencia.'}
            `);
        } catch (error) {
            alert(`Error al cargar la información de la vacuna: ${error.message}`);
        }
    }

    function initInfoButton(dataElementId, index) {
        hideShow(`div[id="delete-vaccine-${index}"]`, 'show');
        if (!dataElementId || !index) return;
        showVaccineInfo(dataElementId, index);
    }

    function deleteVaccineInfo( codeId, dataElementId, index) {
        const abbreviationId = vaccineNameElements[index - 1].code;
        deleteAction(codeId, dataElementId);
        deleteAction(`lSpdre0srBn-${ abbreviationId }-val`, `lSpdre0srBn-${ abbreviationId }-val`);
        hideShow(`div[id="delete-vaccine-${index}"]`, 'hide');
        getVaccineNumber();
    }

    showActiveVaccinesInformation();
    function showActiveVaccinesInformation() {
        setTimeout(() => {
            for(let i = 0; i <= vaccineNameElements.length; i++) {
                let dataElementId = vaccineNameElements[i]?.text;
                const value = $(`#lSpdre0srBn-${dataElementId}-val`).val();
                if( !hasValue(value) ) {
                    hideShow(`div[id="delete-vaccine-${i + 1}"]`, 'hide');
                } else {
                    hideShow(`div[id="delete-vaccine-${i + 1}"]`, 'show');
                }
            }
        }, 200);
    }