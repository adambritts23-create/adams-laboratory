import {freeze} from '../solver/models.js'

// Identity-bound scientific interpretation only; no thermodynamic constants.
export const feOxidationMetadata = freeze({
  "version": "oxidation-state-metadata-v1",
  "sourceBindingSha256": "65c2cdf7c251036784c3acde074d396cd11dc94ea5d8b665b1ac5f9d9e73fe8f",
  "scope": "fe-oxide-hydroxide-source-snapshot-v1",
  "conservedComponent": "component:Fe%202%2B",
  "referenceOxidationState": 2,
  "basisIds": [
    "component:Fe%202%2B",
    "component:H%2B",
    "component:e-",
    "component:H2O"
  ],
  "rows": [
    {
      "id": "component:Fe%202%2B",
      "sourceSpeciesId": "spana:2ac52a30213c9288:126513",
      "sourceReactionId": "spana:2ac52a30213c9288:126513",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Fe 2+",
      "phase": "aqueous",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Fe": 1,
        "H": 0,
        "O": 0
      },
      "allocation": [
        {
          "oxidationState": 2,
          "count": 1
        }
      ],
      "bindingSha256": "2b8721bc5d7f6cf9d56de14683102f27a78d6599c6b14f8d0ddebe97e9f16e87",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013",
        "sourceReferenceCode": "NEA-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "canonical-state:component:Fe%203%2B",
      "sourceSpeciesId": "spana:2ac52a30213c9288:126584",
      "sourceReactionId": "spana:2ac52a30213c9288:126513",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Fe 3+",
      "phase": "aqueous",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Fe": 1,
        "H": 0,
        "O": 0
      },
      "allocation": [
        {
          "oxidationState": 3,
          "count": 1
        }
      ],
      "bindingSha256": "e98be54b9fbbc127342157716215e4cd7dc650a293e970ce0d797c9a40b021ae",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013",
        "sourceReferenceCode": "NEA-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:130813",
      "sourceSpeciesId": "spana:2ac52a30213c9288:130813",
      "sourceReactionId": "spana:2ac52a30213c9288:130813",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Fe(OH)2",
      "phase": "aqueous",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Fe": 1,
        "H": 2,
        "O": 2
      },
      "allocation": [
        {
          "oxidationState": 2,
          "count": 1
        }
      ],
      "bindingSha256": "03eb53bc26ac4e64f144e5c9185de2ba65c4ee9d3f728eed923339078cc940cc",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "sourceReferenceCode": "1996BP-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:131002",
      "sourceSpeciesId": "spana:2ac52a30213c9288:131002",
      "sourceReactionId": "spana:2ac52a30213c9288:131002",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Fe(OH)2+",
      "phase": "aqueous",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Fe": 1,
        "H": 2,
        "O": 2
      },
      "allocation": [
        {
          "oxidationState": 3,
          "count": 1
        }
      ],
      "bindingSha256": "492778d6ac05ed63b7b04b742edc4cdd70288533de534cfabab20f220507816d",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "sourceReferenceCode": "NEA-Fe,1996BP-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:131099",
      "sourceSpeciesId": "spana:2ac52a30213c9288:131099",
      "sourceReactionId": "spana:2ac52a30213c9288:131099",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Fe(OH)3",
      "phase": "aqueous",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Fe": 1,
        "H": 3,
        "O": 3
      },
      "allocation": [
        {
          "oxidationState": 3,
          "count": 1
        }
      ],
      "bindingSha256": "564bcb42f19e9449036f182beb784841ee80046a72bcefe2dbf7b6b57c58aa4d",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "sourceReferenceCode": "1996BP-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:131406",
      "sourceSpeciesId": "spana:2ac52a30213c9288:131406",
      "sourceReactionId": "spana:2ac52a30213c9288:131406",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Fe(OH)3-",
      "phase": "aqueous",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Fe": 1,
        "H": 3,
        "O": 3
      },
      "allocation": [
        {
          "oxidationState": 2,
          "count": 1
        }
      ],
      "bindingSha256": "80a37d6c82143b519f91e91e7232724b7f40465ba339ab2b055c771166ef9435",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "sourceReferenceCode": "1996BP-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:131496",
      "sourceSpeciesId": "spana:2ac52a30213c9288:131496",
      "sourceReactionId": "spana:2ac52a30213c9288:131496",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Fe(OH)4-",
      "phase": "aqueous",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Fe": 1,
        "H": 4,
        "O": 4
      },
      "allocation": [
        {
          "oxidationState": 3,
          "count": 1
        }
      ],
      "bindingSha256": "d15f274b991aec94737c27967e3baa7a31650e198fe70eef6098a19f49df4a7d",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "sourceReferenceCode": "1996BP-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:131586",
      "sourceSpeciesId": "spana:2ac52a30213c9288:131586",
      "sourceReactionId": "spana:2ac52a30213c9288:131586",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Fe(OH)4-2",
      "phase": "aqueous",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Fe": 1,
        "H": 4,
        "O": 4
      },
      "allocation": [
        {
          "oxidationState": 2,
          "count": 1
        }
      ],
      "bindingSha256": "518d59e656c4ed7abd74f809852513f4c5b6c821278b708de6d552ceaeeb1ff3",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "sourceReferenceCode": "1996BP-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:133463",
      "sourceSpeciesId": "spana:2ac52a30213c9288:133463",
      "sourceReactionId": "spana:2ac52a30213c9288:133463",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Fe2(OH)2+4",
      "phase": "aqueous",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 2,
      "independentAtoms": {
        "Fe": 2,
        "H": 2,
        "O": 2
      },
      "allocation": [
        {
          "oxidationState": 3,
          "count": 2
        }
      ],
      "bindingSha256": "149e4fe3f1afe46bde68b960aba1f6628a701b828f015d6ee2692c81ab0a6625",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013",
        "sourceReferenceCode": "NEA-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:138672",
      "sourceSpeciesId": "spana:2ac52a30213c9288:138672",
      "sourceReactionId": "spana:2ac52a30213c9288:138672",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "FeO4-2",
      "phase": "aqueous",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Fe": 1,
        "H": 0,
        "O": 4
      },
      "allocation": [
        {
          "oxidationState": 6,
          "count": 1
        }
      ],
      "bindingSha256": "fdb68189cb3426dad46742dab2a99ecdb185054edfd16ea084d8e0ca8247caa3",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "sourceReferenceCode": "1996BP-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:138873",
      "sourceSpeciesId": "spana:2ac52a30213c9288:138873",
      "sourceReactionId": "spana:2ac52a30213c9288:138873",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "FeOH 2+",
      "phase": "aqueous",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Fe": 1,
        "H": 1,
        "O": 1
      },
      "allocation": [
        {
          "oxidationState": 3,
          "count": 1
        }
      ],
      "bindingSha256": "9aceead8489d51cbb2d1f0e4cd27312f7b228175bd7e8846a7bc32c08d124a60",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "sourceReferenceCode": "NEA-Fe,1996BP-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:138969",
      "sourceSpeciesId": "spana:2ac52a30213c9288:138969",
      "sourceReactionId": "spana:2ac52a30213c9288:138969",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "FeOH+",
      "phase": "aqueous",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Fe": 1,
        "H": 1,
        "O": 1
      },
      "allocation": [
        {
          "oxidationState": 2,
          "count": 1
        }
      ],
      "bindingSha256": "8234d323cb8d615b1d96cff351dd1d377041efdc67eecca1ab8e561275c57a14",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "sourceReferenceCode": "NEA-Fe,1996BP-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:127500",
      "sourceSpeciesId": "spana:2ac52a30213c9288:127500",
      "sourceReactionId": "spana:2ac52a30213c9288:127500",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Fe(cr)",
      "phase": "solid",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Fe": 1,
        "H": 0,
        "O": 0
      },
      "allocation": [
        {
          "oxidationState": 0,
          "count": 1
        }
      ],
      "bindingSha256": "09a56b0641116e32f1387c48de056968cb563fffa67c4beb7bf6b6cd72685f68",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013",
        "sourceReferenceCode": "NEA-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:130902",
      "sourceSpeciesId": "spana:2ac52a30213c9288:130902",
      "sourceReactionId": "spana:2ac52a30213c9288:130902",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Fe(OH)2(cr)",
      "phase": "solid",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Fe": 1,
        "H": 2,
        "O": 2
      },
      "allocation": [
        {
          "oxidationState": 2,
          "count": 1
        }
      ],
      "bindingSha256": "b1f94e83163939a4972e84bb440635fca1f02f72edad5b7c4d99c7f6cf27a186",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "2016BE: Brown P L, Ekberg C; Hydrolysis of Metal Ions. Weinheim, Germany: Wiley-VCH Verlag GmbH & Co. KGaA, 2016\n\n91Kna/Kub: Knacke O, Kubaschewski O, Hesselmann K; Thermochemical Properties of Inorganic Substances. Springer-Verlag, Berlin, 1991, 2 ed.",
        "sourceReferenceCode": "2016BE,91Kna/Kub",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:131188",
      "sourceSpeciesId": "spana:2ac52a30213c9288:131188",
      "sourceReactionId": "spana:2ac52a30213c9288:131188",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Fe(OH)3(am)",
      "phase": "solid",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Fe": 1,
        "H": 3,
        "O": 3
      },
      "allocation": [
        {
          "oxidationState": 3,
          "count": 1
        }
      ],
      "bindingSha256": "2611ccc50f6ffb97782c97eeadae9534c328e1e9c10848230b5a9ed7b4d71544",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "1990NP: Nordstrom D K, Plummer L N, Langmuir D, Busenberg E, May H M, Jones B F, Parkhurst D L; in \"Chemical Modeling Of Aqueous Systems II\" (D C Melchior and R L Basett, eds.). Washington, D.C.: A.C.S.Symp.Ser. 416, Amer.Chem.Soc., 1990, pp.398-413.\n\nNEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013",
        "sourceReferenceCode": "1990NP+NEA-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:131294",
      "sourceSpeciesId": "spana:2ac52a30213c9288:131294",
      "sourceReactionId": "spana:2ac52a30213c9288:131294",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Fe(OH)3(s)",
      "phase": "solid",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Fe": 1,
        "H": 3,
        "O": 3
      },
      "allocation": [
        {
          "oxidationState": 3,
          "count": 1
        }
      ],
      "bindingSha256": "7bd5deb02a07159e329648fcd91c3ab7ac843161c6d04cdc4817a8b4d44da8e4",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013",
        "sourceReferenceCode": "NEA-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:133739",
      "sourceSpeciesId": "spana:2ac52a30213c9288:133739",
      "sourceReactionId": "spana:2ac52a30213c9288:133739",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Fe2O3(cr)",
      "phase": "solid",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 2,
      "independentAtoms": {
        "Fe": 2,
        "H": 0,
        "O": 3
      },
      "allocation": [
        {
          "oxidationState": 3,
          "count": 2
        }
      ],
      "bindingSha256": "39404d1ffdc36a22b9af06f184634d58d84a9d1d530ea356f58493b8427fcf46",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013",
        "sourceReferenceCode": "NEA-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:134486",
      "sourceSpeciesId": "spana:2ac52a30213c9288:134486",
      "sourceReactionId": "spana:2ac52a30213c9288:134486",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Fe3O4(cr)",
      "phase": "solid",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 3,
      "independentAtoms": {
        "Fe": 3,
        "H": 0,
        "O": 4
      },
      "allocation": [
        {
          "oxidationState": 2,
          "count": 1
        },
        {
          "oxidationState": 3,
          "count": 2
        }
      ],
      "bindingSha256": "1bb182d579f38ea51d6dcf380f29f9b2f036b7e0c11baaa62dd61c853b5a9b15",
      "provenance": {
        "statement": "Explicit magnetite identity: one Fe(II) and two Fe(III) per formula unit, supported by ChEBI ferrosoferric oxide and magnetite identity. No average valence.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365",
          "https://www.ebi.ac.uk/chebi/CHEBI%3A50821",
          "https://www.ebi.ac.uk/chebi/CHEBI%3A46726"
        ],
        "sourceCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013",
        "sourceReferenceCode": "NEA-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:139276",
      "sourceSpeciesId": "spana:2ac52a30213c9288:139276",
      "sourceReactionId": "spana:2ac52a30213c9288:139276",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "FeOOH(cr)",
      "phase": "solid",
      "conservedComponent": "component:Fe%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Fe": 1,
        "H": 1,
        "O": 2
      },
      "allocation": [
        {
          "oxidationState": 3,
          "count": 1
        }
      ],
      "bindingSha256": "0d1b539e78d21ed10adc857a3d9fb5361d26c3d2a545b6b0de4dbf31306472f2",
      "provenance": {
        "statement": "Explicit curated identity of this monatomic/elemental or oxide/hydroxide source carrier. H(+I) and O(-II) are redox-innocent within this specified composition; allocation is stored explicitly, not inferred at runtime.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365"
        ],
        "sourceCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013",
        "sourceReferenceCode": "NEA-Fe",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "Fe oxide/hydroxide and monatomic carriers; no redox-active ligands"
      }
    }
  ],
  "materiality": {
    "policy": "all-candidates-must-resolve",
    "unresolvedInventoryFloor": 0,
    "statement": "No trace waiver: unresolved candidates invalidate allocation before solving, including absent solids. Solver tolerance is used only for closure of fully resolved inventory."
  }
})
