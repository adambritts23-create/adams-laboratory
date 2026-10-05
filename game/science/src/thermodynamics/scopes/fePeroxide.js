import {freeze} from '../../solver/models.js'
// Source identity/composition contract only. No thermodynamic constants duplicated.
export const fePeroxideScope=freeze({
  "version": "closed-fe-peroxide-aqueous-scope-v1",
  "status": "conditional-internal-benchmark",
  "description": "Aqueous Fe/hydrolysis/chloride complexes plus peroxide, HO2-, dissolved H2/O2/O3. Chloride redox, solids and gases explicitly excluded; not complete experimental chemistry.",
  "electronId": "component:e-",
  "waterId": "component:H2O",
  "protonId": "component:H%2B",
  "inventoryDomain": [{"key":"Fe","weights":{"Fe":1},"min":0.000001,"max":0.000001},{"key":"Cl","weights":{"Cl":1},"min":0.010002,"max":0.010002},{"key":"H-2O","weights":{"H":1,"O":-2},"min":0.009998,"max":0.01}],
  "metadata": {
    "component:Fe%202%2B": {
      "id": "component:Fe%202%2B",
      "name": "Fe 2+",
      "charge": 2,
      "elements": {
        "Fe": 1
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "component:Fe%202%2B",
        "reference": "Explicit imported chemical identity; static audit atom/charge assignment",
        "record": {
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.elb",
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0"
        }
      },
      "allocation": {
        "element": "Fe",
        "states": [
          {
            "oxidationState": 2,
            "count": 1
          }
        ],
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
    },
    "component:Fe%203%2B": {
      "id": "component:Fe%203%2B",
      "name": "Fe 3+",
      "charge": 3,
      "elements": {
        "Fe": 1
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "component:Fe%203%2B",
        "reference": "Explicit imported chemical identity; static audit atom/charge assignment",
        "record": {
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.elb",
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0"
        }
      },
      "allocation": {
        "element": "Fe",
        "states": [
          {
            "oxidationState": 3,
            "count": 1
          }
        ],
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
    },
    "component:H2O2": {
      "id": "component:H2O2",
      "name": "H2O2",
      "charge": 0,
      "elements": {
        "H": 2,
        "O": 2
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "component:H2O2",
        "reference": "Explicit imported chemical identity; static audit atom/charge assignment",
        "record": {
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.elb",
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0"
        }
      }
    },
    "component:H%2B": {
      "id": "component:H%2B",
      "name": "H+",
      "charge": 1,
      "elements": {
        "H": 1
      },
      "phase": "aqueous",
      "role": "proton",
      "sourceIdentity": {
        "id": "component:H%2B",
        "reference": "Explicit imported chemical identity; static audit atom/charge assignment",
        "record": {
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.elb",
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0"
        }
      }
    },
    "component:H2O": {
      "id": "component:H2O",
      "name": "H2O",
      "charge": 0,
      "elements": {
        "H": 2,
        "O": 1
      },
      "phase": "liquid",
      "role": "water",
      "sourceIdentity": {
        "id": "component:H2O",
        "reference": "Explicit imported chemical identity; static audit atom/charge assignment",
        "record": {
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.elb",
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0"
        }
      }
    },
    "component:Cl-": {
      "id": "component:Cl-",
      "name": "Cl-",
      "charge": -1,
      "elements": {
        "Cl": 1
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "component:Cl-",
        "reference": "Explicit imported chemical identity; static audit atom/charge assignment",
        "record": {
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.elb",
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0"
        }
      }
    },
    "component:e-": {
      "id": "component:e-",
      "name": "e-",
      "charge": -1,
      "elements": {},
      "phase": "aqueous",
      "role": "electron",
      "sourceIdentity": {
        "id": "component:e-",
        "reference": "Explicit imported chemical identity; static audit atom/charge assignment",
        "record": {
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.elb",
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0"
        }
      }
    },
    "spana:2ac52a30213c9288:130813": {
      "id": "spana:2ac52a30213c9288:130813",
      "name": "Fe(OH)2",
      "charge": 0,
      "elements": {
        "Fe": 1,
        "O": 2,
        "H": 2
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:130813",
        "reference": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:130813",
          "originalRecordId": null,
          "originalSpeciesName": "Fe(OH)2",
          "originalReaction": {
            "product": "Fe(OH)2",
            "components": [
              {
                "name": "Fe 2+",
                "coefficient": 1
              },
              {
                "name": "H+",
                "coefficient": -2
              },
              {
                "name": "H2O",
                "coefficient": 2
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -20.6,
          "originalReferenceCode": "1996BP-Fe",
          "resolvedCitation": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 130813,
          "byteLength": 89,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "Fe(OH)2",
            "reaction": {
              "product": "Fe(OH)2",
              "components": [
                {
                  "name": "Fe 2+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -2
                },
                {
                  "name": "H2O",
                  "coefficient": 2
                }
              ],
              "separateProtonCount": null
            },
            "logK": -20.6,
            "citation": "1996BP-Fe",
            "raw": {
              "ordinal": 1464,
              "byteOffset": 130813,
              "byteLength": 89,
              "name": "Fe(OH)2",
              "logK": -20.6,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 66.99999999999997,
                "deltaCp": 529.9999999999999
              },
              "layout": "variable",
              "componentToken": "3",
              "components": [
                {
                  "name": "Fe 2+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -2
                },
                {
                  "name": "H2O",
                  "coefficient": 2
                }
              ],
              "protonCount": null,
              "reference": "1996BP-Fe",
              "comment": "",
              "rawBase64": "AAdGZShPSCkywDSZmZmZmZpAUL///////kCAj///////AAEzAAVGZSAyKz/wAAAAAAAAAAJIK8AAAAAAAAAAAANIMk9AAAAAAAAAAAAJMTk5NkJQLUZlAAA="
            }
          }
        }
      },
      "allocation": {
        "element": "Fe",
        "states": [
          {
            "oxidationState": 2,
            "count": 1
          }
        ],
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
      }
    },
    "spana:2ac52a30213c9288:131002": {
      "id": "spana:2ac52a30213c9288:131002",
      "name": "Fe(OH)2+",
      "charge": 1,
      "elements": {
        "Fe": 1,
        "O": 2,
        "H": 2
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:131002",
        "reference": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:131002",
          "originalRecordId": null,
          "originalSpeciesName": "Fe(OH)2+",
          "originalReaction": {
            "product": "Fe(OH)2+",
            "components": [
              {
                "name": "Fe 3+",
                "coefficient": 1
              },
              {
                "name": "H+",
                "coefficient": -2
              },
              {
                "name": "H2O",
                "coefficient": 2
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -4.8,
          "originalReferenceCode": "NEA-Fe,1996BP-Fe",
          "resolvedCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 131002,
          "byteLength": 97,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "Fe(OH)2+",
            "reaction": {
              "product": "Fe(OH)2+",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -2
                },
                {
                  "name": "H2O",
                  "coefficient": 2
                }
              ],
              "separateProtonCount": null
            },
            "logK": -4.8,
            "citation": "NEA-Fe,1996BP-Fe",
            "raw": {
              "ordinal": 1466,
              "byteOffset": 131002,
              "byteLength": 97,
              "name": "Fe(OH)2+",
              "logK": -4.8,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 63,
                "deltaCp": 200
              },
              "layout": "variable",
              "componentToken": "3",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -2
                },
                {
                  "name": "H2O",
                  "coefficient": 2
                }
              ],
              "protonCount": null,
              "reference": "NEA-Fe,1996BP-Fe",
              "comment": "",
              "rawBase64": "AAhGZShPSCkyK8ATMzMzMzMzQE+AAAAAAABAaQAAAAAAAAABMwAFRmUgMys/8AAAAAAAAAACSCvAAAAAAAAAAAADSDJPQAAAAAAAAAAAEE5FQS1GZSwxOTk2QlAtRmUAAA=="
            }
          }
        }
      },
      "allocation": {
        "element": "Fe",
        "states": [
          {
            "oxidationState": 3,
            "count": 1
          }
        ],
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
      }
    },
    "spana:2ac52a30213c9288:131099": {
      "id": "spana:2ac52a30213c9288:131099",
      "name": "Fe(OH)3",
      "charge": 0,
      "elements": {
        "Fe": 1,
        "O": 3,
        "H": 3
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:131099",
        "reference": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:131099",
          "originalRecordId": null,
          "originalSpeciesName": "Fe(OH)3",
          "originalReaction": {
            "product": "Fe(OH)3",
            "components": [
              {
                "name": "Fe 3+",
                "coefficient": 1
              },
              {
                "name": "H+",
                "coefficient": -3
              },
              {
                "name": "H2O",
                "coefficient": 3
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -12,
          "originalReferenceCode": "1996BP-Fe",
          "resolvedCitation": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 131099,
          "byteLength": 89,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "Fe(OH)3",
            "reaction": {
              "product": "Fe(OH)3",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -3
                },
                {
                  "name": "H2O",
                  "coefficient": 3
                }
              ],
              "separateProtonCount": null
            },
            "logK": -12,
            "citation": "1996BP-Fe",
            "raw": {
              "ordinal": 1467,
              "byteOffset": 131099,
              "byteLength": 89,
              "name": "Fe(OH)3",
              "logK": -12,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 107,
                "deltaCp": 210
              },
              "layout": "variable",
              "componentToken": "3",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -3
                },
                {
                  "name": "H2O",
                  "coefficient": 3
                }
              ],
              "protonCount": null,
              "reference": "1996BP-Fe",
              "comment": "",
              "rawBase64": "AAdGZShPSCkzwCgAAAAAAABAWsAAAAAAAEBqQAAAAAAAAAEzAAVGZSAzKz/wAAAAAAAAAAJIK8AIAAAAAAAAAANIMk9ACAAAAAAAAAAJMTk5NkJQLUZlAAA="
            }
          }
        }
      },
      "allocation": {
        "element": "Fe",
        "states": [
          {
            "oxidationState": 3,
            "count": 1
          }
        ],
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
      }
    },
    "spana:2ac52a30213c9288:131406": {
      "id": "spana:2ac52a30213c9288:131406",
      "name": "Fe(OH)3-",
      "charge": -1,
      "elements": {
        "Fe": 1,
        "O": 3,
        "H": 3
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:131406",
        "reference": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:131406",
          "originalRecordId": null,
          "originalSpeciesName": "Fe(OH)3-",
          "originalReaction": {
            "product": "Fe(OH)3-",
            "components": [
              {
                "name": "Fe 2+",
                "coefficient": 1
              },
              {
                "name": "H+",
                "coefficient": -3
              },
              {
                "name": "H2O",
                "coefficient": 3
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -34.2,
          "originalReferenceCode": "1996BP-Fe",
          "resolvedCitation": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 131406,
          "byteLength": 90,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "Fe(OH)3-",
            "reaction": {
              "product": "Fe(OH)3-",
              "components": [
                {
                  "name": "Fe 2+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -3
                },
                {
                  "name": "H2O",
                  "coefficient": 3
                }
              ],
              "separateProtonCount": null
            },
            "logK": -34.2,
            "citation": "1996BP-Fe",
            "raw": {
              "ordinal": 1470,
              "byteOffset": 131406,
              "byteLength": 90,
              "name": "Fe(OH)3-",
              "logK": -34.2,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 138.99999999999997,
                "deltaCp": 529.9999999999999
              },
              "layout": "variable",
              "componentToken": "3",
              "components": [
                {
                  "name": "Fe 2+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -3
                },
                {
                  "name": "H2O",
                  "coefficient": 3
                }
              ],
              "protonCount": null,
              "reference": "1996BP-Fe",
              "comment": "",
              "rawBase64": "AAhGZShPSCkzLcBBGZmZmZmaQGFf//////9AgI///////wABMwAFRmUgMis/8AAAAAAAAAACSCvACAAAAAAAAAADSDJPQAgAAAAAAAAACTE5OTZCUC1GZQAA"
            }
          }
        }
      },
      "allocation": {
        "element": "Fe",
        "states": [
          {
            "oxidationState": 2,
            "count": 1
          }
        ],
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
      }
    },
    "spana:2ac52a30213c9288:131496": {
      "id": "spana:2ac52a30213c9288:131496",
      "name": "Fe(OH)4-",
      "charge": -1,
      "elements": {
        "Fe": 1,
        "O": 4,
        "H": 4
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:131496",
        "reference": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:131496",
          "originalRecordId": null,
          "originalSpeciesName": "Fe(OH)4-",
          "originalReaction": {
            "product": "Fe(OH)4-",
            "components": [
              {
                "name": "Fe 3+",
                "coefficient": 1
              },
              {
                "name": "H+",
                "coefficient": -4
              },
              {
                "name": "H2O",
                "coefficient": 4
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -21.6,
          "originalReferenceCode": "1996BP-Fe",
          "resolvedCitation": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 131496,
          "byteLength": 90,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "Fe(OH)4-",
            "reaction": {
              "product": "Fe(OH)4-",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -4
                },
                {
                  "name": "H2O",
                  "coefficient": 4
                }
              ],
              "separateProtonCount": null
            },
            "logK": -21.6,
            "citation": "1996BP-Fe",
            "raw": {
              "ordinal": 1471,
              "byteOffset": 131496,
              "byteLength": 90,
              "name": "Fe(OH)4-",
              "logK": -21.6,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 134.99999999999997,
                "deltaCp": 139.99999999999997
              },
              "layout": "variable",
              "componentToken": "3",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -4
                },
                {
                  "name": "H2O",
                  "coefficient": 4
                }
              ],
              "protonCount": null,
              "reference": "1996BP-Fe",
              "comment": "",
              "rawBase64": "AAhGZShPSCk0LcA1mZmZmZmaQGDf//////9AYX///////wABMwAFRmUgMys/8AAAAAAAAAACSCvAEAAAAAAAAAADSDJPQBAAAAAAAAAACTE5OTZCUC1GZQAA"
            }
          }
        }
      },
      "allocation": {
        "element": "Fe",
        "states": [
          {
            "oxidationState": 3,
            "count": 1
          }
        ],
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
      }
    },
    "spana:2ac52a30213c9288:131586": {
      "id": "spana:2ac52a30213c9288:131586",
      "name": "Fe(OH)4-2",
      "charge": -2,
      "elements": {
        "Fe": 1,
        "O": 4,
        "H": 4
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:131586",
        "reference": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:131586",
          "originalRecordId": null,
          "originalSpeciesName": "Fe(OH)4-2",
          "originalReaction": {
            "product": "Fe(OH)4-2",
            "components": [
              {
                "name": "Fe 2+",
                "coefficient": 1
              },
              {
                "name": "H+",
                "coefficient": -4
              },
              {
                "name": "H2O",
                "coefficient": 4
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -46,
          "originalReferenceCode": "1996BP-Fe",
          "resolvedCitation": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 131586,
          "byteLength": 91,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "Fe(OH)4-2",
            "reaction": {
              "product": "Fe(OH)4-2",
              "components": [
                {
                  "name": "Fe 2+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -4
                },
                {
                  "name": "H2O",
                  "coefficient": 4
                }
              ],
              "separateProtonCount": null
            },
            "logK": -46,
            "citation": "1996BP-Fe",
            "raw": {
              "ordinal": 1472,
              "byteOffset": 131586,
              "byteLength": 91,
              "name": "Fe(OH)4-2",
              "logK": -46,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 155,
                "deltaCp": 230
              },
              "layout": "variable",
              "componentToken": "3",
              "components": [
                {
                  "name": "Fe 2+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -4
                },
                {
                  "name": "H2O",
                  "coefficient": 4
                }
              ],
              "protonCount": null,
              "reference": "1996BP-Fe",
              "comment": "",
              "rawBase64": "AAlGZShPSCk0LTLARwAAAAAAAEBjYAAAAAAAQGzAAAAAAAAAATMABUZlIDIrP/AAAAAAAAAAAkgrwBAAAAAAAAAAA0gyT0AQAAAAAAAAAAkxOTk2QlAtRmUAAA=="
            }
          }
        }
      },
      "allocation": {
        "element": "Fe",
        "states": [
          {
            "oxidationState": 2,
            "count": 1
          }
        ],
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
      }
    },
    "spana:2ac52a30213c9288:133463": {
      "id": "spana:2ac52a30213c9288:133463",
      "name": "Fe2(OH)2+4",
      "charge": 4,
      "elements": {
        "Fe": 2,
        "O": 2,
        "H": 2
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:133463",
        "reference": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:133463",
          "originalRecordId": null,
          "originalSpeciesName": "Fe2(OH)2+4",
          "originalReaction": {
            "product": "Fe2(OH)2+4",
            "components": [
              {
                "name": "Fe 3+",
                "coefficient": 2
              },
              {
                "name": "H+",
                "coefficient": -2
              },
              {
                "name": "H2O",
                "coefficient": 2
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -2.82,
          "originalReferenceCode": "NEA-Fe",
          "resolvedCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 133463,
          "byteLength": 89,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "Fe2(OH)2+4",
            "reaction": {
              "product": "Fe2(OH)2+4",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 2
                },
                {
                  "name": "H+",
                  "coefficient": -2
                },
                {
                  "name": "H2O",
                  "coefficient": 2
                }
              ],
              "separateProtonCount": null
            },
            "logK": -2.82,
            "citation": "NEA-Fe",
            "raw": {
              "ordinal": 1492,
              "byteOffset": 133463,
              "byteLength": 89,
              "name": "Fe2(OH)2+4",
              "logK": -2.82,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 44,
                "deltaCp": 200
              },
              "layout": "variable",
              "componentToken": "3",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 2
                },
                {
                  "name": "H+",
                  "coefficient": -2
                },
                {
                  "name": "H2O",
                  "coefficient": 2
                }
              ],
              "protonCount": null,
              "reference": "NEA-Fe",
              "comment": "",
              "rawBase64": "AApGZTIoT0gpMis0wAaPXCj1wo9ARgAAAAAAAEBpAAAAAAAAAAEzAAVGZSAzK0AAAAAAAAAAAAJIK8AAAAAAAAAAAANIMk9AAAAAAAAAAAAGTkVBLUZlAAA="
            }
          }
        }
      },
      "allocation": {
        "element": "Fe",
        "states": [
          {
            "oxidationState": 3,
            "count": 2
          }
        ],
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
    },
    "spana:2ac52a30213c9288:135482": {
      "id": "spana:2ac52a30213c9288:135482",
      "name": "FeCl+",
      "charge": 1,
      "elements": {
        "Fe": 1,
        "Cl": 1
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:135482",
        "reference": "SmithMart: NIST Standard Reference Database 46 Version 8.\nNIST Critically Selected Stability Constants of Metal Complexes Database\nhttp://www.nist.gov/srd/nist46.cfm\nNational Institute of Standards and Technology, 100 Bureau Dr., Stop 2300, Gaithersburg, MD",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:135482",
          "originalRecordId": null,
          "originalSpeciesName": "FeCl+",
          "originalReaction": {
            "product": "FeCl+",
            "components": [
              {
                "name": "Fe 2+",
                "coefficient": 1
              },
              {
                "name": "Cl-",
                "coefficient": 1
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -0.3,
          "originalReferenceCode": "SmithMart",
          "resolvedCitation": "SmithMart: NIST Standard Reference Database 46 Version 8.\nNIST Critically Selected Stability Constants of Metal Complexes Database\nhttp://www.nist.gov/srd/nist46.cfm\nNational Institute of Standards and Technology, 100 Bureau Dr., Stop 2300, Gaithersburg, MD",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 135482,
          "byteLength": 75,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "FeCl+",
            "reaction": {
              "product": "FeCl+",
              "components": [
                {
                  "name": "Fe 2+",
                  "coefficient": 1
                },
                {
                  "name": "Cl-",
                  "coefficient": 1
                }
              ],
              "separateProtonCount": null
            },
            "logK": -0.3,
            "citation": "SmithMart",
            "raw": {
              "ordinal": 1512,
              "byteOffset": 135482,
              "byteLength": 75,
              "name": "FeCl+",
              "logK": -0.3,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": -999999.9,
                "deltaCp": -999999.9
              },
              "layout": "variable",
              "componentToken": "2",
              "components": [
                {
                  "name": "Fe 2+",
                  "coefficient": 1
                },
                {
                  "name": "Cl-",
                  "coefficient": 1
                }
              ],
              "protonCount": null,
              "reference": "SmithMart",
              "comment": "",
              "rawBase64": "AAVGZUNsK7/TMzMzMzMzwS6Ef8zMzM3BLoR/zMzMzQABMgAFRmUgMis/8AAAAAAAAAADQ2wtP/AAAAAAAAAACVNtaXRoTWFydAAA"
            }
          }
        }
      },
      "allocation": {
        "element": "Fe",
        "states": [
          {
            "oxidationState": 2,
            "count": 1
          }
        ],
        "provenance": {
          "statement": "Static source-specific iron chloride identity: chloride is Cl(-I) in these admitted non-redox complexes; Fe valence explicitly assigned. No runtime formula parsing.",
          "sourceCitation": "SmithMart: NIST Standard Reference Database 46 Version 8.\nNIST Critically Selected Stability Constants of Metal Complexes Database\nhttp://www.nist.gov/srd/nist46.cfm\nNational Institute of Standards and Technology, 100 Bureau Dr., Stop 2300, Gaithersburg, MD"
        }
      }
    },
    "spana:2ac52a30213c9288:135557": {
      "id": "spana:2ac52a30213c9288:135557",
      "name": "FeCl+2",
      "charge": 2,
      "elements": {
        "Fe": 1,
        "Cl": 1
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:135557",
        "reference": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:135557",
          "originalRecordId": null,
          "originalSpeciesName": "FeCl+2",
          "originalReaction": {
            "product": "FeCl+2",
            "components": [
              {
                "name": "Fe 3+",
                "coefficient": 1
              },
              {
                "name": "Cl-",
                "coefficient": 1
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": 1.52,
          "originalReferenceCode": "NEA-Fe",
          "resolvedCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 135557,
          "byteLength": 73,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "FeCl+2",
            "reaction": {
              "product": "FeCl+2",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "Cl-",
                  "coefficient": 1
                }
              ],
              "separateProtonCount": null
            },
            "logK": 1.52,
            "citation": "NEA-Fe",
            "raw": {
              "ordinal": 1513,
              "byteOffset": 135557,
              "byteLength": 73,
              "name": "FeCl+2",
              "logK": 1.52,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 22.5,
                "deltaCp": -999999.9
              },
              "layout": "variable",
              "componentToken": "2",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "Cl-",
                  "coefficient": 1
                }
              ],
              "protonCount": null,
              "reference": "NEA-Fe",
              "comment": "",
              "rawBase64": "AAZGZUNsKzI/+FHrhR64UkA2gAAAAAAAwS6Ef8zMzM0AATIABUZlIDMrP/AAAAAAAAAAA0NsLT/wAAAAAAAAAAZORUEtRmUAAA=="
            }
          }
        }
      },
      "allocation": {
        "element": "Fe",
        "states": [
          {
            "oxidationState": 3,
            "count": 1
          }
        ],
        "provenance": {
          "statement": "Static source-specific iron chloride identity: chloride is Cl(-I) in these admitted non-redox complexes; Fe valence explicitly assigned. No runtime formula parsing.",
          "sourceCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013"
        }
      }
    },
    "spana:2ac52a30213c9288:135630": {
      "id": "spana:2ac52a30213c9288:135630",
      "name": "FeCl2+",
      "charge": 1,
      "elements": {
        "Fe": 1,
        "Cl": 2
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:135630",
        "reference": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n2006LEa: Liu W, Etschmann B, Brugger J, Spiccia L, Foran G, McInnes B; Chem. Geol. 231 (2006) 326-349",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:135630",
          "originalRecordId": null,
          "originalSpeciesName": "FeCl2+",
          "originalReaction": {
            "product": "FeCl2+",
            "components": [
              {
                "name": "Fe 3+",
                "coefficient": 1
              },
              {
                "name": "Cl-",
                "coefficient": 2
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": 2.22,
          "originalReferenceCode": "NEA-Fe,2006LEa",
          "resolvedCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n2006LEa: Liu W, Etschmann B, Brugger J, Spiccia L, Foran G, McInnes B; Chem. Geol. 231 (2006) 326-349",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 135630,
          "byteLength": 81,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "FeCl2+",
            "reaction": {
              "product": "FeCl2+",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "Cl-",
                  "coefficient": 2
                }
              ],
              "separateProtonCount": null
            },
            "logK": 2.22,
            "citation": "NEA-Fe,2006LEa",
            "raw": {
              "ordinal": 1514,
              "byteOffset": 135630,
              "byteLength": 81,
              "name": "FeCl2+",
              "logK": 2.22,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 135,
                "deltaCp": -999999.9
              },
              "layout": "variable",
              "componentToken": "2",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "Cl-",
                  "coefficient": 2
                }
              ],
              "protonCount": null,
              "reference": "NEA-Fe,2006LEa",
              "comment": "",
              "rawBase64": "AAZGZUNsMitAAcKPXCj1w0Bg4AAAAAAAwS6Ef8zMzM0AATIABUZlIDMrP/AAAAAAAAAAA0NsLUAAAAAAAAAAAA5ORUEtRmUsMjAwNkxFYQAA"
            }
          }
        }
      },
      "allocation": {
        "element": "Fe",
        "states": [
          {
            "oxidationState": 3,
            "count": 1
          }
        ],
        "provenance": {
          "statement": "Static source-specific iron chloride identity: chloride is Cl(-I) in these admitted non-redox complexes; Fe valence explicitly assigned. No runtime formula parsing.",
          "sourceCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n2006LEa: Liu W, Etschmann B, Brugger J, Spiccia L, Foran G, McInnes B; Chem. Geol. 231 (2006) 326-349"
        }
      }
    },
    "spana:2ac52a30213c9288:135711": {
      "id": "spana:2ac52a30213c9288:135711",
      "name": "FeCl3",
      "charge": 0,
      "elements": {
        "Fe": 1,
        "Cl": 3
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:135711",
        "reference": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n2006LEa: Liu W, Etschmann B, Brugger J, Spiccia L, Foran G, McInnes B; Chem. Geol. 231 (2006) 326-349",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:135711",
          "originalRecordId": null,
          "originalSpeciesName": "FeCl3",
          "originalReaction": {
            "product": "FeCl3",
            "components": [
              {
                "name": "Fe 3+",
                "coefficient": 1
              },
              {
                "name": "Cl-",
                "coefficient": 3
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": 1.02,
          "originalReferenceCode": "NEA-Fe,2006LEa",
          "resolvedCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n2006LEa: Liu W, Etschmann B, Brugger J, Spiccia L, Foran G, McInnes B; Chem. Geol. 231 (2006) 326-349",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 135711,
          "byteLength": 80,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "FeCl3",
            "reaction": {
              "product": "FeCl3",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "Cl-",
                  "coefficient": 3
                }
              ],
              "separateProtonCount": null
            },
            "logK": 1.02,
            "citation": "NEA-Fe,2006LEa",
            "raw": {
              "ordinal": 1515,
              "byteOffset": 135711,
              "byteLength": 80,
              "name": "FeCl3",
              "logK": 1.02,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 212,
                "deltaCp": -999999.9
              },
              "layout": "variable",
              "componentToken": "2",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "Cl-",
                  "coefficient": 3
                }
              ],
              "protonCount": null,
              "reference": "NEA-Fe,2006LEa",
              "comment": "",
              "rawBase64": "AAVGZUNsMz/wUeuFHrhSQGqAAAAAAADBLoR/zMzMzQABMgAFRmUgMys/8AAAAAAAAAADQ2wtQAgAAAAAAAAADk5FQS1GZSwyMDA2TEVhAAA="
            }
          }
        }
      },
      "allocation": {
        "element": "Fe",
        "states": [
          {
            "oxidationState": 3,
            "count": 1
          }
        ],
        "provenance": {
          "statement": "Static source-specific iron chloride identity: chloride is Cl(-I) in these admitted non-redox complexes; Fe valence explicitly assigned. No runtime formula parsing.",
          "sourceCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n2006LEa: Liu W, Etschmann B, Brugger J, Spiccia L, Foran G, McInnes B; Chem. Geol. 231 (2006) 326-349"
        }
      }
    },
    "spana:2ac52a30213c9288:135791": {
      "id": "spana:2ac52a30213c9288:135791",
      "name": "FeCl4-",
      "charge": -1,
      "elements": {
        "Fe": 1,
        "Cl": 4
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:135791",
        "reference": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n2006LEa: Liu W, Etschmann B, Brugger J, Spiccia L, Foran G, McInnes B; Chem. Geol. 231 (2006) 326-349",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:135791",
          "originalRecordId": null,
          "originalSpeciesName": "FeCl4-",
          "originalReaction": {
            "product": "FeCl4-",
            "components": [
              {
                "name": "Fe 3+",
                "coefficient": 1
              },
              {
                "name": "Cl-",
                "coefficient": 4
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -0.98,
          "originalReferenceCode": "NEA-Fe,2006LEa",
          "resolvedCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n2006LEa: Liu W, Etschmann B, Brugger J, Spiccia L, Foran G, McInnes B; Chem. Geol. 231 (2006) 326-349",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 135791,
          "byteLength": 81,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "FeCl4-",
            "reaction": {
              "product": "FeCl4-",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "Cl-",
                  "coefficient": 4
                }
              ],
              "separateProtonCount": null
            },
            "logK": -0.98,
            "citation": "NEA-Fe,2006LEa",
            "raw": {
              "ordinal": 1516,
              "byteOffset": 135791,
              "byteLength": 81,
              "name": "FeCl4-",
              "logK": -0.98,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 94,
                "deltaCp": -999999.9
              },
              "layout": "variable",
              "componentToken": "2",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "Cl-",
                  "coefficient": 4
                }
              ],
              "protonCount": null,
              "reference": "NEA-Fe,2006LEa",
              "comment": "",
              "rawBase64": "AAZGZUNsNC2/71wo9cKPXEBXgAAAAAAAwS6Ef8zMzM0AATIABUZlIDMrP/AAAAAAAAAAA0NsLUAQAAAAAAAAAA5ORUEtRmUsMjAwNkxFYQAA"
            }
          }
        }
      },
      "allocation": {
        "element": "Fe",
        "states": [
          {
            "oxidationState": 3,
            "count": 1
          }
        ],
        "provenance": {
          "statement": "Static source-specific iron chloride identity: chloride is Cl(-I) in these admitted non-redox complexes; Fe valence explicitly assigned. No runtime formula parsing.",
          "sourceCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n2006LEa: Liu W, Etschmann B, Brugger J, Spiccia L, Foran G, McInnes B; Chem. Geol. 231 (2006) 326-349"
        }
      }
    },
    "spana:2ac52a30213c9288:138672": {
      "id": "spana:2ac52a30213c9288:138672",
      "name": "FeO4-2",
      "charge": -2,
      "elements": {
        "Fe": 1,
        "O": 4
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:138672",
        "reference": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:138672",
          "originalRecordId": null,
          "originalSpeciesName": "FeO4-2",
          "originalReaction": {
            "product": "FeO4-2",
            "components": [
              {
                "name": "Fe 3+",
                "coefficient": 1
              },
              {
                "name": "H+",
                "coefficient": -8
              },
              {
                "name": "e-",
                "coefficient": -3
              },
              {
                "name": "H2O",
                "coefficient": 4
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -112.6,
          "originalReferenceCode": "1996BP-Fe",
          "resolvedCitation": "1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 138672,
          "byteLength": 100,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "FeO4-2",
            "reaction": {
              "product": "FeO4-2",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -8
                },
                {
                  "name": "e-",
                  "coefficient": -3
                },
                {
                  "name": "H2O",
                  "coefficient": 4
                }
              ],
              "separateProtonCount": null
            },
            "logK": -112.6,
            "citation": "1996BP-Fe",
            "raw": {
              "ordinal": 1550,
              "byteOffset": 138672,
              "byteLength": 100,
              "name": "FeO4-2",
              "logK": -112.6,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 713,
                "deltaCp": -360
              },
              "layout": "variable",
              "componentToken": "4",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -8
                },
                {
                  "name": "e-",
                  "coefficient": -3
                },
                {
                  "name": "H2O",
                  "coefficient": 4
                }
              ],
              "protonCount": null,
              "reference": "1996BP-Fe",
              "comment": "",
              "rawBase64": "AAZGZU80LTLAXCZmZmZmZkCGSAAAAAAAwHaAAAAAAAAAATQABUZlIDMrP/AAAAAAAAAAAkgrwCAAAAAAAAAAAmUtwAgAAAAAAAAAA0gyT0AQAAAAAAAAAAkxOTk2QlAtRmUAAA=="
            }
          }
        }
      },
      "allocation": {
        "element": "Fe",
        "states": [
          {
            "oxidationState": 6,
            "count": 1
          }
        ],
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
      }
    },
    "spana:2ac52a30213c9288:138873": {
      "id": "spana:2ac52a30213c9288:138873",
      "name": "FeOH 2+",
      "charge": 2,
      "elements": {
        "Fe": 1,
        "O": 1,
        "H": 1
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:138873",
        "reference": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:138873",
          "originalRecordId": null,
          "originalSpeciesName": "FeOH 2+",
          "originalReaction": {
            "product": "FeOH 2+",
            "components": [
              {
                "name": "Fe 3+",
                "coefficient": 1
              },
              {
                "name": "H+",
                "coefficient": -1
              },
              {
                "name": "H2O",
                "coefficient": 1
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -2.15,
          "originalReferenceCode": "NEA-Fe,1996BP-Fe",
          "resolvedCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 138873,
          "byteLength": 96,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "FeOH 2+",
            "reaction": {
              "product": "FeOH 2+",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -1
                },
                {
                  "name": "H2O",
                  "coefficient": 1
                }
              ],
              "separateProtonCount": null
            },
            "logK": -2.15,
            "citation": "NEA-Fe,1996BP-Fe",
            "raw": {
              "ordinal": 1552,
              "byteOffset": 138873,
              "byteLength": 96,
              "name": "FeOH 2+",
              "logK": -2.15,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 35.99999999999999,
                "deltaCp": 119.99999999999999
              },
              "layout": "variable",
              "componentToken": "3",
              "components": [
                {
                  "name": "Fe 3+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -1
                },
                {
                  "name": "H2O",
                  "coefficient": 1
                }
              ],
              "protonCount": null,
              "reference": "NEA-Fe,1996BP-Fe",
              "comment": "",
              "rawBase64": "AAdGZU9IIDIrwAEzMzMzMzNAQf///////0Bd////////AAEzAAVGZSAzKz/wAAAAAAAAAAJIK7/wAAAAAAAAAANIMk8/8AAAAAAAAAAQTkVBLUZlLDE5OTZCUC1GZQAA"
            }
          }
        }
      },
      "allocation": {
        "element": "Fe",
        "states": [
          {
            "oxidationState": 3,
            "count": 1
          }
        ],
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
      }
    },
    "spana:2ac52a30213c9288:138969": {
      "id": "spana:2ac52a30213c9288:138969",
      "name": "FeOH+",
      "charge": 1,
      "elements": {
        "Fe": 1,
        "O": 1,
        "H": 1
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:138969",
        "reference": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:138969",
          "originalRecordId": null,
          "originalSpeciesName": "FeOH+",
          "originalReaction": {
            "product": "FeOH+",
            "components": [
              {
                "name": "Fe 2+",
                "coefficient": 1
              },
              {
                "name": "H+",
                "coefficient": -1
              },
              {
                "name": "H2O",
                "coefficient": 1
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -9.1,
          "originalReferenceCode": "NEA-Fe,1996BP-Fe",
          "resolvedCitation": "NEA-Fe: Lemire R J, Berner U, Musikas C, Palmer D A, Taylor P, Tochiyama O, Chemical Thermodynamics of Iron. Part 1. Paris: OECD Nuclear Energy Agency (NEA), 2013\n\n1996BP-Fe: Beverskog B, Puigdomenech I; Corros. Sci. 38 (1996) 2121-2135",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 138969,
          "byteLength": 94,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "FeOH+",
            "reaction": {
              "product": "FeOH+",
              "components": [
                {
                  "name": "Fe 2+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -1
                },
                {
                  "name": "H2O",
                  "coefficient": 1
                }
              ],
              "separateProtonCount": null
            },
            "logK": -9.1,
            "citation": "NEA-Fe,1996BP-Fe",
            "raw": {
              "ordinal": 1553,
              "byteOffset": 138969,
              "byteLength": 94,
              "name": "FeOH+",
              "logK": -9.1,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 21.000000000000014,
                "deltaCp": 370
              },
              "layout": "variable",
              "componentToken": "3",
              "components": [
                {
                  "name": "Fe 2+",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -1
                },
                {
                  "name": "H2O",
                  "coefficient": 1
                }
              ],
              "protonCount": null,
              "reference": "NEA-Fe,1996BP-Fe",
              "comment": "",
              "rawBase64": "AAVGZU9IK8AiMzMzMzMzQDUAAAAAAARAdyAAAAAAAAABMwAFRmUgMis/8AAAAAAAAAACSCu/8AAAAAAAAAADSDJPP/AAAAAAAAAAEE5FQS1GZSwxOTk2QlAtRmUAAA=="
            }
          }
        }
      },
      "allocation": {
        "element": "Fe",
        "states": [
          {
            "oxidationState": 2,
            "count": 1
          }
        ],
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
      }
    },
    "spana:2ac52a30213c9288:151381": {
      "id": "spana:2ac52a30213c9288:151381",
      "name": "H2",
      "charge": 0,
      "elements": {
        "H": 2
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:151381",
        "reference": "82NBS: Wagman D D, Evans W H, Parker V B, Schumm R H, Halow I, Bailey S M, Churney K L, Nuttall R L; The NBS tables of chemical thermodynamic properties: Selected values for inorganic and C1 and C2 organic substances in SI units. J. Phys. Chem. Ref. Data 11, Suppl. No.2, 1982\n\n89Sho/Hel: Shock E L, Helgeson H C, Sverjensky D A; Geochim. Cosmochim. Acta 53 (1989) 2157-2183",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:151381",
          "originalRecordId": null,
          "originalSpeciesName": "H2",
          "originalReaction": {
            "product": "H2",
            "components": [
              {
                "name": "H+",
                "coefficient": 2
              },
              {
                "name": "e-",
                "coefficient": 2
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -3.083,
          "originalReferenceCode": "82NBS,89Sho/Hel",
          "resolvedCitation": "82NBS: Wagman D D, Evans W H, Parker V B, Schumm R H, Halow I, Bailey S M, Churney K L, Nuttall R L; The NBS tables of chemical thermodynamic properties: Selected values for inorganic and C1 and C2 organic substances in SI units. J. Phys. Chem. Ref. Data 11, Suppl. No.2, 1982\n\n89Sho/Hel: Shock E L, Helgeson H C, Sverjensky D A; Geochim. Cosmochim. Acta 53 (1989) 2157-2183",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 151381,
          "byteLength": 74,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "H2",
            "reaction": {
              "product": "H2",
              "components": [
                {
                  "name": "H+",
                  "coefficient": 2
                },
                {
                  "name": "e-",
                  "coefficient": 2
                }
              ],
              "separateProtonCount": null
            },
            "logK": -3.083,
            "citation": "82NBS,89Sho/Hel",
            "raw": {
              "ordinal": 1691,
              "byteOffset": 151381,
              "byteLength": 74,
              "name": "H2",
              "logK": -3.083,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": -4.200000000000006,
                "deltaCp": 138
              },
              "layout": "variable",
              "componentToken": "2",
              "components": [
                {
                  "name": "H+",
                  "coefficient": 2
                },
                {
                  "name": "e-",
                  "coefficient": 2
                }
              ],
              "protonCount": null,
              "reference": "82NBS,89Sho/Hel",
              "comment": "",
              "rawBase64": "AAJIMsAIqfvnbItEwBDMzMzMzNRAYUAAAAAAAAABMgACSCtAAAAAAAAAAAACZS1AAAAAAAAAAAAPODJOQlMsODlTaG8vSGVsAAA="
            }
          }
        }
      }
    },
    "spana:2ac52a30213c9288:159033": {
      "id": "spana:2ac52a30213c9288:159033",
      "name": "HCl",
      "charge": 0,
      "elements": {
        "H": 1,
        "Cl": 1
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:159033",
        "reference": "1997Tag: Tagirov B R, Zotov A V, Akinfiev N N; Geochim. Cosmochim. Acta, 61 (1997) 4267-4280",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:159033",
          "originalRecordId": null,
          "originalSpeciesName": "HCl",
          "originalReaction": {
            "product": "HCl",
            "components": [
              {
                "name": "H+",
                "coefficient": 1
              },
              {
                "name": "Cl-",
                "coefficient": 1
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -0.7,
          "originalReferenceCode": "1997Tag",
          "resolvedCitation": "1997Tag: Tagirov B R, Zotov A V, Akinfiev N N; Geochim. Cosmochim. Acta, 61 (1997) 4267-4280",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 159033,
          "byteLength": 68,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "HCl",
            "reaction": {
              "product": "HCl",
              "components": [
                {
                  "name": "H+",
                  "coefficient": 1
                },
                {
                  "name": "Cl-",
                  "coefficient": 1
                }
              ],
              "separateProtonCount": null
            },
            "logK": -0.7,
            "citation": "1997Tag",
            "raw": {
              "ordinal": 1783,
              "byteOffset": 159033,
              "byteLength": 68,
              "name": "HCl",
              "logK": -0.7,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": -16.339999999999996,
                "deltaCp": 354
              },
              "layout": "variable",
              "componentToken": "2",
              "components": [
                {
                  "name": "H+",
                  "coefficient": 1
                },
                {
                  "name": "Cl-",
                  "coefficient": 1
                }
              ],
              "protonCount": null,
              "reference": "1997Tag",
              "comment": "",
              "rawBase64": "AANIQ2y/5mZmZmZmZsAwVwo9cKPWQHYgAAAAAAAAATIAAkgrP/AAAAAAAAAAA0NsLT/wAAAAAAAAAAcxOTk3VGFnAAA="
            }
          }
        }
      }
    },
    "spana:2ac52a30213c9288:175307": {
      "id": "spana:2ac52a30213c9288:175307",
      "name": "HO2-",
      "charge": -1,
      "elements": {
        "H": 1,
        "O": 2
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:175307",
        "reference": "SmithMart: NIST Standard Reference Database 46 Version 8.\nNIST Critically Selected Stability Constants of Metal Complexes Database\nhttp://www.nist.gov/srd/nist46.cfm\nNational Institute of Standards and Technology, 100 Bureau Dr., Stop 2300, Gaithersburg, MD\n\n88Sho/Hel: Shock E L, Helgeson H C; Geochim. Cosmochim. Acta 52 (1988) 2009-2036; and \"ERRATA\", ibid, 53 (1989) p.215",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:175307",
          "originalRecordId": null,
          "originalSpeciesName": "HO2-",
          "originalReaction": {
            "product": "HO2-",
            "components": [
              {
                "name": "H2O2",
                "coefficient": 1
              },
              {
                "name": "H+",
                "coefficient": -1
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -11.65,
          "originalReferenceCode": "SmithMart+88Sho/Hel",
          "resolvedCitation": "SmithMart: NIST Standard Reference Database 46 Version 8.\nNIST Critically Selected Stability Constants of Metal Complexes Database\nhttp://www.nist.gov/srd/nist46.cfm\nNational Institute of Standards and Technology, 100 Bureau Dr., Stop 2300, Gaithersburg, MD\n\n88Sho/Hel: Shock E L, Helgeson H C; Geochim. Cosmochim. Acta 52 (1988) 2009-2036; and \"ERRATA\", ibid, 53 (1989) p.215",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 175307,
          "byteLength": 82,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "HO2-",
            "reaction": {
              "product": "HO2-",
              "components": [
                {
                  "name": "H2O2",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -1
                }
              ],
              "separateProtonCount": null
            },
            "logK": -11.65,
            "citation": "SmithMart+88Sho/Hel",
            "raw": {
              "ordinal": 1976,
              "byteOffset": 175307,
              "byteLength": 82,
              "name": "HO2-",
              "logK": -11.65,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 30.799999999999997,
                "deltaCp": -105
              },
              "layout": "variable",
              "componentToken": "2",
              "components": [
                {
                  "name": "H2O2",
                  "coefficient": 1
                },
                {
                  "name": "H+",
                  "coefficient": -1
                }
              ],
              "protonCount": null,
              "reference": "SmithMart+88Sho/Hel",
              "comment": "",
              "rawBase64": "AARITzItwCdMzMzMzM1APszMzMzMzMBaQAAAAAAAAAEyAARIMk8yP/AAAAAAAAAAAkgrv/AAAAAAAAAAE1NtaXRoTWFydCs4OFNoby9IZWwAAA=="
            }
          }
        }
      }
    },
    "spana:2ac52a30213c9288:249989": {
      "id": "spana:2ac52a30213c9288:249989",
      "name": "O2",
      "charge": 0,
      "elements": {
        "O": 2
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:249989",
        "reference": "89Sho/Hel: Shock E L, Helgeson H C, Sverjensky D A; Geochim. Cosmochim. Acta 53 (1989) 2157-2183",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:249989",
          "originalRecordId": null,
          "originalSpeciesName": "O2",
          "originalReaction": {
            "product": "O2",
            "components": [
              {
                "name": "H+",
                "coefficient": -4
              },
              {
                "name": "e-",
                "coefficient": -4
              },
              {
                "name": "H2O",
                "coefficient": 2
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -85.988,
          "originalReferenceCode": "89Sho/Hel",
          "resolvedCitation": "89Sho/Hel: Shock E L, Helgeson H C, Sverjensky D A; Geochim. Cosmochim. Acta 53 (1989) 2157-2183",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 249989,
          "byteLength": 81,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "O2",
            "reaction": {
              "product": "O2",
              "components": [
                {
                  "name": "H+",
                  "coefficient": -4
                },
                {
                  "name": "e-",
                  "coefficient": -4
                },
                {
                  "name": "H2O",
                  "coefficient": 2
                }
              ],
              "separateProtonCount": null
            },
            "logK": -85.988,
            "citation": "89Sho/Hel",
            "raw": {
              "ordinal": 2819,
              "byteOffset": 249989,
              "byteLength": 81,
              "name": "O2",
              "logK": -85.988,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 559.5,
                "deltaCp": 141
              },
              "layout": "variable",
              "componentToken": "3",
              "components": [
                {
                  "name": "H+",
                  "coefficient": -4
                },
                {
                  "name": "e-",
                  "coefficient": -4
                },
                {
                  "name": "H2O",
                  "coefficient": 2
                }
              ],
              "protonCount": null,
              "reference": "89Sho/Hel",
              "comment": "",
              "rawBase64": "AAJPMsBVfztkWhysQIF8AAAAAABAYaAAAAAAAAABMwACSCvAEAAAAAAAAAACZS3AEAAAAAAAAAADSDJPQAAAAAAAAAAACTg5U2hvL0hlbAAA"
            }
          }
        }
      }
    },
    "spana:2ac52a30213c9288:250161": {
      "id": "spana:2ac52a30213c9288:250161",
      "name": "O3",
      "charge": 0,
      "elements": {
        "O": 3
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:250161",
        "reference": "82NBS: Wagman D D, Evans W H, Parker V B, Schumm R H, Halow I, Bailey S M, Churney K L, Nuttall R L; The NBS tables of chemical thermodynamic properties: Selected values for inorganic and C1 and C2 organic substances in SI units. J. Phys. Chem. Ref. Data 11, Suppl. No.2, 1982",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:250161",
          "originalRecordId": null,
          "originalSpeciesName": "O3",
          "originalReaction": {
            "product": "O3",
            "components": [
              {
                "name": "H+",
                "coefficient": -6
              },
              {
                "name": "e-",
                "coefficient": -6
              },
              {
                "name": "H2O",
                "coefficient": 3
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -155.14,
          "originalReferenceCode": "82NBS",
          "resolvedCitation": "82NBS: Wagman D D, Evans W H, Parker V B, Schumm R H, Halow I, Bailey S M, Churney K L, Nuttall R L; The NBS tables of chemical thermodynamic properties: Selected values for inorganic and C1 and C2 organic substances in SI units. J. Phys. Chem. Ref. Data 11, Suppl. No.2, 1982",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 250161,
          "byteLength": 104,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "O3",
            "reaction": {
              "product": "O3",
              "components": [
                {
                  "name": "H+",
                  "coefficient": -6
                },
                {
                  "name": "e-",
                  "coefficient": -6
                },
                {
                  "name": "H2O",
                  "coefficient": 3
                }
              ],
              "separateProtonCount": null
            },
            "logK": -155.14,
            "citation": "82NBS",
            "raw": {
              "ordinal": 2821,
              "byteOffset": 250161,
              "byteLength": 104,
              "name": "O3",
              "logK": -155.14,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 983.4000000000001,
                "deltaCp": 212
              },
              "layout": "variable",
              "componentToken": "3",
              "components": [
                {
                  "name": "H+",
                  "coefficient": -6
                },
                {
                  "name": "e-",
                  "coefficient": -6
                },
                {
                  "name": "H2O",
                  "coefficient": 3
                }
              ],
              "protonCount": null,
              "reference": "82NBS",
              "comment": "Cp(O3(aq)) = 1.5xCp(O2(aq))",
              "rawBase64": "AAJPM8BjZHrhR64UQI67MzMzMzRAaoAAAAAAAAABMwACSCvAGAAAAAAAAAACZS3AGAAAAAAAAAADSDJPQAgAAAAAAAAABTgyTkJTABtDcChPMyhhcSkpID0gMS41eENwKE8yKGFxKSk="
            }
          }
        }
      }
    },
    "spana:2ac52a30213c9288:250448": {
      "id": "spana:2ac52a30213c9288:250448",
      "name": "OH-",
      "charge": -1,
      "elements": {
        "O": 1,
        "H": 1
      },
      "phase": "aqueous",
      "role": "ordinary",
      "sourceIdentity": {
        "id": "spana:2ac52a30213c9288:250448",
        "reference": "Codata: Cox J D, Wagman D D, Medvedev V A, CODATA Key Values for Thermodynamics. Hemisphere Publ. Co., New York, 1989\n\n88Sho/Hel: Shock E L, Helgeson H C; Geochim. Cosmochim. Acta 52 (1988) 2009-2036; and \"ERRATA\", ibid, 53 (1989) p.215",
        "record": {
          "kind": "imported",
          "sourceDatabase": "spana:2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "sourceFile": "Eq-Diagr/Reactions.db",
          "sourceRecordId": "byte:250448",
          "originalRecordId": null,
          "originalSpeciesName": "OH-",
          "originalReaction": {
            "product": "OH-",
            "components": [
              {
                "name": "H+",
                "coefficient": -1
              },
              {
                "name": "H2O",
                "coefficient": 1
              }
            ],
            "separateProtonCount": null
          },
          "originalLogK": -14.0015,
          "originalReferenceCode": "Codata+88Sho/Hel",
          "resolvedCitation": "Codata: Cox J D, Wagman D D, Medvedev V A, CODATA Key Values for Thermodynamics. Hemisphere Publ. Co., New York, 1989\n\n88Sho/Hel: Shock E L, Helgeson H C; Geochim. Cosmochim. Acta 52 (1988) 2009-2036; and \"ERRATA\", ibid, 53 (1989) p.215",
          "referenceSourceFile": "Eq-Diagr/References.txt",
          "dbSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
          "byteOffset": 250448,
          "byteLength": 77,
          "importDate": "2026-09-05T16:23:16.736Z",
          "importerVersion": "spana-readonly-1.0.0",
          "comments": [
            "Element links describe source components, not product atom counts. Oxidation states are not supplied."
          ],
          "qualityFlags": [
            "imported",
            "not-solver-validated",
            "composition-unknown"
          ],
          "original": {
            "speciesName": "OH-",
            "reaction": {
              "product": "OH-",
              "components": [
                {
                  "name": "H+",
                  "coefficient": -1
                },
                {
                  "name": "H2O",
                  "coefficient": 1
                }
              ],
              "separateProtonCount": null
            },
            "logK": -14.0015,
            "citation": "Codata+88Sho/Hel",
            "raw": {
              "ordinal": 2824,
              "byteOffset": 250448,
              "byteLength": 77,
              "name": "OH-",
              "logK": -14.0015,
              "thermal": {
                "kind": "deltaH-deltaCp",
                "deltaH": 55.82000000000001,
                "deltaCp": -212.99999999999997
              },
              "layout": "variable",
              "componentToken": "2",
              "components": [
                {
                  "name": "H+",
                  "coefficient": -1
                },
                {
                  "name": "H2O",
                  "coefficient": 1
                }
              ],
              "protonCount": null,
              "reference": "Codata+88Sho/Hel",
              "comment": "",
              "rawBase64": "AANPSC3ALADEm6XjVEBL6PXCj1wqwGqf//////8AATIAAkgrv/AAAAAAAAAAA0gyTz/wAAAAAAAAABBDb2RhdGErODhTaG8vSGVsAAA="
            }
          }
        }
      }
    }
  },
  "bases": [
    [
      "component:Fe%202%2B",
      "component:H2O2",
      "component:H%2B",
      "component:Cl-",
      "component:H2O"
    ],
    [
      "component:Fe%203%2B",
      "component:H2O2",
      "component:H%2B",
      "component:Cl-",
      "component:H2O"
    ]
  ],
  "excludedReactionIds": [
    "spana:2ac52a30213c9288:82236",
    "spana:2ac52a30213c9288:82394",
    "spana:2ac52a30213c9288:82497",
    "spana:2ac52a30213c9288:82605",
    "spana:2ac52a30213c9288:82715",
    "spana:2ac52a30213c9288:159101",
    "spana:2ac52a30213c9288:159212"
  ],
  "reactions": {
    "spana:2ac52a30213c9288:126513": {
      "digest": "3b44644125baaccb932232a9d0bf6efd604165b5e1ee5d4f7440ed79b298120a",
      "canonicalId": "component:Fe%202%2B"
    },
    "spana:2ac52a30213c9288:126584": {
      "digest": "6cc2b7472a74b95d6898ec25b8d023ef630e818d216aacb6baa7f865ff0b181a",
      "canonicalId": "component:Fe%203%2B"
    },
    "spana:2ac52a30213c9288:130813": {
      "digest": "64eca1bcee88a69d0d98126be937641813546c5b555395fdec75586c66b1f949",
      "canonicalId": "spana:2ac52a30213c9288:130813"
    },
    "spana:2ac52a30213c9288:131002": {
      "digest": "8c1cd59137a2e02a01ed021e3146d2a98cd14824658cc4a7d9b42d2b1b3efc8a",
      "canonicalId": "spana:2ac52a30213c9288:131002"
    },
    "spana:2ac52a30213c9288:131099": {
      "digest": "489e82eae300197b54e73c099ff9ac06b8c6921904c964e53d481c255290ff86",
      "canonicalId": "spana:2ac52a30213c9288:131099"
    },
    "spana:2ac52a30213c9288:131406": {
      "digest": "c8cab761f38471f5a1db0941f8de08a00cb4d333be4d1c5667a592d7b962f813",
      "canonicalId": "spana:2ac52a30213c9288:131406"
    },
    "spana:2ac52a30213c9288:131496": {
      "digest": "69374f16aefa8201b88034552f7b4113cc1b69fa5beff44dd1b8dc31f25bcda3",
      "canonicalId": "spana:2ac52a30213c9288:131496"
    },
    "spana:2ac52a30213c9288:131586": {
      "digest": "029b2c732eae700193c382712bb2adf32c1f7e63735ef3afd5f2bf36592f5a3e",
      "canonicalId": "spana:2ac52a30213c9288:131586"
    },
    "spana:2ac52a30213c9288:133463": {
      "digest": "244454c5a39fff0eec383829b62adf84164f55e57a3e72219cc184ccea70ec68",
      "canonicalId": "spana:2ac52a30213c9288:133463"
    },
    "spana:2ac52a30213c9288:135482": {
      "digest": "9ad6869df0487bdf24db4b88768d467b99a845dd64cea29dafa0974c3e559763",
      "canonicalId": "spana:2ac52a30213c9288:135482"
    },
    "spana:2ac52a30213c9288:135557": {
      "digest": "c6b4c21e25ef72cecf3b682450ac08eadb91825ec25aaf63443c44534f24f31c",
      "canonicalId": "spana:2ac52a30213c9288:135557"
    },
    "spana:2ac52a30213c9288:135630": {
      "digest": "cd830aeadb4b9d8a8e2602b5c3bf91925e87eaf524ac816946e0a84bd8f75888",
      "canonicalId": "spana:2ac52a30213c9288:135630"
    },
    "spana:2ac52a30213c9288:135711": {
      "digest": "735623434a16858b6c11725586d859db8f4f2a9e4fcaa87a589d77bb1a07524c",
      "canonicalId": "spana:2ac52a30213c9288:135711"
    },
    "spana:2ac52a30213c9288:135791": {
      "digest": "e1094fa1021b505c97ee5be468ba6ab2a4d9e6ec45d504baf15111c4eb755d2b",
      "canonicalId": "spana:2ac52a30213c9288:135791"
    },
    "spana:2ac52a30213c9288:138672": {
      "digest": "396d40642231dee9d198a5ce942ae9e06b9539f869d8d7e6bb51da938e739afc",
      "canonicalId": "spana:2ac52a30213c9288:138672"
    },
    "spana:2ac52a30213c9288:138873": {
      "digest": "7166cb6ad235cc4d56c6b4f98396c8925f3999e45f120c0e9d110bbd441bfc9c",
      "canonicalId": "spana:2ac52a30213c9288:138873"
    },
    "spana:2ac52a30213c9288:138969": {
      "digest": "fa672fd2ed72ecd196036200926dffe2a5b852b4db273a62ad4c312902aaa1e3",
      "canonicalId": "spana:2ac52a30213c9288:138969"
    },
    "spana:2ac52a30213c9288:151381": {
      "digest": "642121fd39cdec4efe06525e6aa4703a41bd1e797bf5c40a3f3f5935ff042ffa",
      "canonicalId": "spana:2ac52a30213c9288:151381"
    },
    "spana:2ac52a30213c9288:152743": {
      "digest": "c14cf58182489186c6ac2ebcb8900d0b8c7fa035aaecfaba9e6e6bb807578749",
      "canonicalId": "component:H2O2"
    },
    "spana:2ac52a30213c9288:159033": {
      "digest": "1a78adaeb8ee363c2d7dab9ba152e3e52a08de6a98e15e06d18dc3619e0dd64e",
      "canonicalId": "spana:2ac52a30213c9288:159033"
    },
    "spana:2ac52a30213c9288:175307": {
      "digest": "883649dea1b21c967c6eaab5e114967a63eff3b2ad76d7dc196202f195235c3d",
      "canonicalId": "spana:2ac52a30213c9288:175307"
    },
    "spana:2ac52a30213c9288:249989": {
      "digest": "2e17c2616b886e82f21b90b0e9c817523bb72b8a3d800dd01bfe7d7c97f43213",
      "canonicalId": "spana:2ac52a30213c9288:249989"
    },
    "spana:2ac52a30213c9288:250161": {
      "digest": "666b3d9bd18b456bcc3ce43c3f5066c01215291702a54cedc75e4a5bbc846ea2",
      "canonicalId": "spana:2ac52a30213c9288:250161"
    },
    "spana:2ac52a30213c9288:250448": {
      "digest": "8e0891028ef1d0eaa2084dfaff88a4b62fe8d350c71e76598ab2a06138532a96",
      "canonicalId": "spana:2ac52a30213c9288:250448"
    }
  },
  "componentDigests": {
    "component:Fe%202%2B": "8454a2b5f269c7e622816b297763c7cd25280f07e52810f1870a56fff15f007c",
    "component:Fe%203%2B": "c5420f44f3d61ad604e35d50b98dfc56a698da509b7501a8fbb135192b8c8b3f",
    "component:H2O2": "f75ab52c5f521835368ad614ecce217a110fd9aa4dbd21d00b14dcb4d871fdbd",
    "component:H%2B": "2da5dab5e8e60e3e4fa4123752ecafcf9561b3a085085f4f5276fab7eb4cc827",
    "component:H2O": "79e0284ad6b9ac1d04863204551ab5f62244ed724fcaaac8ca587a7342c91b50",
    "component:Cl-": "7c2c9547366635b0b4837037dd59353e7223456401995c185ded4f358ad125f8",
    "component:e-": "df7b8f0a9900ec2450a1431e49bda255b26f5cc30b5b789c8c0a299968adde80"
  }
})
