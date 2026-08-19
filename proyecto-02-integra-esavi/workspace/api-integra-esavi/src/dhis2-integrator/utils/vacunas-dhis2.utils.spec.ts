import { VacunasDhis2Utils } from './vacunas-dhis2.utils';

describe('VacunasDhis2Utils', () => {
  describe('maHolderMedicinalProductId', () => {
    it('resuelve las 17 vacunas del esquema tal como llegan del option set', () => {
      const esperado: Record<string, number> = {
        '01. BCG': 6874880,
        '02. ROTAVIRUS': 5290879,
        '03. PENTAVALENTE': 6885173,
        '04. NEUMOCOCO': 6870680,
        '05. FIEBRE AMARILLA': 5290885,
        '06. VARICELA': 5946672,
        '07. SRP': 6874580,
        '08. VPH': 6870000,
        '09. DPT': 6873647,
        '10. DT ADULTO': 6883010,
        '11. SR': 5946689,
        '12. HB PEDIÁTRICA': 6885246,
        '13. HB ADULTO': 6885246,
        '14. HB CERO': 6874468,
        '15. FIPV': 6882989,
        '16. BOPV': 6874878,
        '17. INFLUENZA': 6867978,
      };

      for (const [nombre, mpid] of Object.entries(esperado)) {
        expect(VacunasDhis2Utils.maHolderMedicinalProductId(nombre)).toBe(mpid);
      }
    });

    it('resuelve igual con o sin el ordinal, porque no se sabe si DHIS2 lo entrega', () => {
      expect(VacunasDhis2Utils.maHolderMedicinalProductId('BCG')).toBe(6874880);
      expect(VacunasDhis2Utils.maHolderMedicinalProductId('01. BCG')).toBe(6874880);
      expect(VacunasDhis2Utils.maHolderMedicinalProductId('1) BCG')).toBe(6874880);
      expect(VacunasDhis2Utils.maHolderMedicinalProductId('01 - BCG')).toBe(6874880);
    });

    it('ignora tildes, mayúsculas y espacios sobrantes', () => {
      expect(VacunasDhis2Utils.maHolderMedicinalProductId('12. HB PEDIATRICA')).toBe(6885246);
      expect(VacunasDhis2Utils.maHolderMedicinalProductId('  hb   pediátrica  ')).toBe(6885246);
      expect(VacunasDhis2Utils.maHolderMedicinalProductId('Fiebre Amarilla')).toBe(5290885);
    });

    it('da el mismo MPID a HB PEDIÁTRICA y HB ADULTO: WHODrug no separa las presentaciones', () => {
      expect(VacunasDhis2Utils.maHolderMedicinalProductId('12. HB PEDIÁTRICA')).toBe(
        VacunasDhis2Utils.maHolderMedicinalProductId('13. HB ADULTO'),
      );
    });

    it('devuelve null para lo que no está en la tabla, sin lanzar', () => {
      expect(VacunasDhis2Utils.maHolderMedicinalProductId('COVID-19')).toBeNull();
      expect(VacunasDhis2Utils.maHolderMedicinalProductId('')).toBeNull();
      expect(VacunasDhis2Utils.maHolderMedicinalProductId(null)).toBeNull();
      expect(VacunasDhis2Utils.maHolderMedicinalProductId(undefined)).toBeNull();
    });

    it('no recorta cifras iniciales que no sean un ordinal con separador', () => {
      // Sin punto, paréntesis ni guion no hay ordinal que quitar: "13 VALENTE" no debe
      // convertirse en "VALENTE" y colarse como otra vacuna.
      expect(VacunasDhis2Utils.maHolderMedicinalProductId('13 ADULTO')).toBeNull();
    });
  });
});
