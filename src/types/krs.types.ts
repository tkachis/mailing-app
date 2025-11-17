import { DateTime } from 'luxon';
import { z } from 'zod';

export enum KRSRegistry {
  P = 'P',
  S = 'S',
}

const mapRegistry: Record<string, KRSRegistry> = {
  RejP: KRSRegistry.P,
  RejS: KRSRegistry.S,
};

// Zod Schemas for validation
const AdresSchema = z.object({
  ulica: z.string().optional(),
  nrDomu: z.string().optional(),
  miejscowosc: z.string().optional(),
  kodPocztowy: z.string().optional(),
  poczta: z.string().optional(),
  kraj: z.string().optional(),
});

const SiedzibaSchema = z.object({
  kraj: z.string().optional(),
  wojewodztwo: z.string().optional(),
  powiat: z.string().optional(),
  gmina: z.string().optional(),
  miejscowosc: z.string().optional(),
});

const SiedzibaIAdresSchema = z.object({
  siedziba: SiedzibaSchema.optional(),
  adres: AdresSchema.optional(),
  adresPocztyElektronicznej: z.string().nullable().optional(),
  adresStronyInternetowej: z.string().nullable().optional(),
});

const DanePodmiotuSchema = z.object({
  formaPrawna: z.string().optional(),
  identyfikatory: z
    .object({
      regon: z.string().optional(),
      nip: z.string().optional(),
    })
    .optional(),
  nazwa: z.string().optional(),
});

const JednostkaTerenowaOddzialSchema = z.object({
  nazwa: z.string().optional(),
  siedziba: SiedzibaSchema.optional(),
  adres: AdresSchema.optional(),
});

const Dzial1Schema = z.object({
  danePodmiotu: DanePodmiotuSchema.optional(),
  siedzibaIAdres: SiedzibaIAdresSchema.optional(),
  jednostkiTerenoweOddzialy: z.array(JednostkaTerenowaOddzialSchema).optional(),
});

const PkdSchema = z.object({
  opis: z.string().optional(),
  kodDzial: z.string().optional(),
  kodKlasa: z.string().optional(),
  kodPodklasa: z.string().optional(),
});

const PrzedmiotDzialalnosciSchema = z.object({
  przedmiotPrzewazajacejDzialalnosci: z.array(PkdSchema).optional(),
  przedmiotPozostalejDzialalnosci: z.array(PkdSchema).optional(),
});

const Dzial3Schema = z.object({
  przedmiotDzialalnosci: PrzedmiotDzialalnosciSchema.optional(),
});

const NaglowekASchema = z.object({
  rejestr: z.string().optional(),
  numerKRS: z.string().optional(),
  dataCzasOdpisu: z.string().optional(),
  stanZDnia: z.string().optional(),
  dataRejestracjiWKRS: z.string().optional(),
  numerOstatniegoWpisu: z.number().optional(),
  dataOstatniegoWpisu: z.string().optional(),
  sygnaturaAktSprawyDotyczacejOstatniegoWpisu: z.string().optional(),
  oznaczenieSaduDokonujacegoOstatniegoWpisu: z.string().optional(),
  stanPozycji: z.number().optional(),
});

const OdpisSchema = z.looseObject({
  rodzaj: z.string().optional(),
  naglowekA: NaglowekASchema.optional(),
  dane: z
    .looseObject({
      dzial1: Dzial1Schema.optional(),
      dzial3: Dzial3Schema.optional(),
    })
    .optional(),
});

export const KRSInfoSchema = z.object({
  odpis: OdpisSchema.optional(),
});

export type KRSInfo = z.infer<typeof KRSInfoSchema>;

// New RawDataForExtractionSchema, assembled from parts of KRSInfoSchema
const RawDataForExtractionSchema = z.looseObject({
  odpis: z
    .looseObject({
      naglowekA: NaglowekASchema.pick({
        rejestr: true,
        dataRejestracjiWKRS: true,
        numerKRS: true,
      }),
      dane: z
        .looseObject({
          dzial1: Dzial1Schema.pick({
            danePodmiotu: true,
            siedzibaIAdres: true,
          }).extend({
            danePodmiotuZagranicznego: DanePodmiotuSchema.optional(),
          }),
          dzial3: Dzial3Schema.optional(),
        })
        .optional(),
    })
    .optional(),
});

export const KRSCompanySchema = RawDataForExtractionSchema.transform(
  ({ odpis }) => {
    if (!odpis) {
      return null;
    }

    const { dane, naglowekA } = odpis || {};

    const { danePodmiotu, danePodmiotuZagranicznego, siedzibaIAdres } =
      dane?.dzial1 || {};
    const { przedmiotDzialalnosci } = dane?.dzial3 || {};

    const registry = naglowekA.rejestr ? mapRegistry[naglowekA.rejestr] : null;

    const krsRegistrationDate = naglowekA.dataRejestracjiWKRS;
    const registrationDate = krsRegistrationDate
      ? DateTime.fromFormat(krsRegistrationDate, 'dd.MM.yyyy', {
          zone: 'utc',
        }).toJSDate()
      : new Date();

    const mainPkds =
      przedmiotDzialalnosci?.przedmiotPrzewazajacejDzialalnosci || [];

    const pkdNumbers = mainPkds
      .map((pkd) => {
        const parts = [pkd.kodDzial, pkd.kodKlasa, pkd.kodPodklasa].filter(
          Boolean,
        );
        const pkdNumber = parts.join('.');
        const name = pkd.opis;

        // Skip PKD without code or name
        if (!pkdNumber || !name) {
          return null;
        }

        return {
          pkdNumber,
          name,
        };
      })
      .filter(
        (pkd): pkd is { pkdNumber: string; name: string } => pkd !== null,
      );

    const email = siedzibaIAdres?.adresPocztyElektronicznej
      ? siedzibaIAdres.adresPocztyElektronicznej.toLowerCase()
      : undefined;

    return {
      // Fields for NewCompany schema
      krsNumber: naglowekA.numerKRS,
      name: danePodmiotu?.nazwa ?? danePodmiotuZagranicznego?.nazwa,
      email,
      registrationDate,
      pkdNumbers,
      dataJson: odpis, // Store the raw JSON data

      // Extra fields (not in NewCompany, but can be useful)
      legalForm:
        danePodmiotu?.formaPrawna ?? danePodmiotuZagranicznego?.formaPrawna,
      registry,
      website: siedzibaIAdres?.adresStronyInternetowej,
      address:
        `${siedzibaIAdres?.adres?.ulica || ''} ${
          siedzibaIAdres?.adres?.nrDomu || ''
        }`.trim() || undefined,
      city: siedzibaIAdres?.siedziba?.miejscowosc,
      province: siedzibaIAdres?.siedziba?.wojewodztwo,
      postalCode: siedzibaIAdres?.adres?.kodPocztowy,
    };
  },
);

export type KRSCompany = z.infer<typeof KRSCompanySchema>;
