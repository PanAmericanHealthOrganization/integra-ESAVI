export const MOCK_LLT_RESULTS = [
    { pcode: '10000167', name: 'Nauseas' },
    { pcode: '10016558', name: 'Fiebre' },
    { pcode: '10027669', name: 'Fiebre Amarilla' },
    { pcode: '10037890', name: 'Fiebre Tifoidea' },
    { pcode: '10019252', name: 'Cefalea' },
    { pcode: '10000081', name: 'Dolor abdominal' },
    { pcode: '10037844', name: 'Erupcion cutanea' },
    { pcode: '10048955', name: 'Erupcion en la piel' },
    { pcode: '10013968', name: 'Edema facial' },
    { pcode: '10042434', name: 'Taquicardia' },
    { pcode: '10044221', name: 'Trombocitopenia' },
    { pcode: '10002855', name: 'Anafilaxia' },
    { pcode: '10011224', name: 'Convulsiones' },
]
{
    
}

export async function searchMedDRAMock(term) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const query = term.toLowerCase()
    return MOCK_LLT_RESULTS.filter((result) => (
        result.name.toLowerCase().includes(query) ||
        result.pcode.toLowerCase().includes(query)
    ))
}
