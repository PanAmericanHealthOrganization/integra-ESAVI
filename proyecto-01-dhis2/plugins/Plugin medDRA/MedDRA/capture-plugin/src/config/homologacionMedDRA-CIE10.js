import data from './MedDRA-CIE10.json' with { type: 'json' };

const meddraIndex = new Map();
for (const item of data) {
    const key = item["CÓDIGO LLT MEDDRA"];
    if (!meddraIndex.has(key)) {
        meddraIndex.set(key, []);
    }
    meddraIndex.get(key).push({
        codigoCIE10: item["CÓDIGO CIE10"],
        terminoCIE10: item["TERMINO CIE-10"]
    });
}

function compararRaiz(a, b) {
    const raizA = a.codigoCIE10.match(/^([A-Z])(\d+)/);
    const raizB = b.codigoCIE10.match(/^([A-Z])(\d+)/);
    const letraA = raizA[1];
    const letraB = raizB[1];

    if (letraA !== letraB) {
        return letraB.localeCompare(letraA);
    }

    const numeroA = Number(raizA[2]);
    const numeroB = Number(raizB[2]);

    if (numeroA !== numeroB) {
        return numeroB - numeroA;
    }

    return b.codigoCIE10.localeCompare(a.codigoCIE10, undefined, {
        numeric: true,
    });
}


export function buscarCIE10(codigo) {
    const candidatos = meddraIndex.get(Number(codigo)) ?? [];
    if (candidatos.length <= 1) {
        return candidatos;
    }
    candidatos.sort(compararRaiz);
    return [candidatos[0]];
}