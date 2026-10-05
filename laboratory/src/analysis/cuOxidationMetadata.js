import {freeze} from '../solver/models.js'
// Static identity-bound interpretation. No source constants or runtime name inference.
export const cuOxidationMetadata=freeze({
  "version": "cu-oxidation-state-metadata-v1",
  "scope": "cu-oxide-hydroxide-source-snapshot-v1",
  "sourceBindingSha256": "3fc43fadccbe8b047ced5feba13d0c9932bfb3d4cba3c74ac7c81a7ecef83fb5",
  "conservedComponent": "component:Cu%202%2B",
  "referenceOxidationState": 2,
  "basisIds": [
    "component:Cu%202%2B",
    "component:H%2B",
    "component:e-",
    "component:H2O"
  ],
  "rows": [
    {
      "id": "component:Cu%202%2B",
      "sourceSpeciesId": "spana:2ac52a30213c9288:97858",
      "sourceReactionId": "spana:2ac52a30213c9288:97858",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Cu 2+",
      "phase": "aqueous",
      "conservedComponent": "component:Cu%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Cu": 1,
        "H": 0,
        "O": 0
      },
      "allocation": [
        {
          "oxidationState": 2,
          "count": 1
        }
      ],
      "bindingSha256": "1c903b4c5ebc015aa623a6a6f646a33e81a8629d0cb5dfc1aeef4253cd487061",
      "provenance": {
        "statement": "Identity-specific curated monatomic, elemental or oxide/hydroxide carrier. Explicit Cu allocation; H(+I) and O(-II) are redox-innocent within this bounded composition. No ligand redox or mixed valence asserted. Stored allocation is checked against source electron balance; never inferred from a runtime name.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365",
          "https://www.skb.se/publikation/18994/TR-01-23.pdf"
        ],
        "sourceCitation": "1997BP-Cu: Beverskog B, Puigdomenech I; J. Electrochem. Soc., 144 (1997) 3476-3483",
        "sourceReferenceCode": "1997BP-Cu",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "cu-oxide-hydroxide-source-snapshot-v1"
      }
    },
    {
      "id": "canonical-state:component:Cu%2B",
      "sourceSpeciesId": "spana:2ac52a30213c9288:103398",
      "sourceReactionId": "spana:2ac52a30213c9288:103398",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Cu+",
      "phase": "aqueous",
      "conservedComponent": "component:Cu%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Cu": 1,
        "H": 0,
        "O": 0
      },
      "allocation": [
        {
          "oxidationState": 1,
          "count": 1
        }
      ],
      "bindingSha256": "71f6d6645399ae25b5e89c226d3f7afd0a875705b439684638d6eb06ad9b960a",
      "provenance": {
        "statement": "Identity-specific curated monatomic, elemental or oxide/hydroxide carrier. Explicit Cu allocation; H(+I) and O(-II) are redox-innocent within this bounded composition. No ligand redox or mixed valence asserted. Stored allocation is checked against source electron balance; never inferred from a runtime name.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365",
          "https://www.skb.se/publikation/18994/TR-01-23.pdf"
        ],
        "sourceCitation": "1997BP-Cu: Beverskog B, Puigdomenech I; J. Electrochem. Soc., 144 (1997) 3476-3483",
        "sourceReferenceCode": "1997BP-Cu",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "cu-oxide-hydroxide-source-snapshot-v1"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:98874",
      "sourceSpeciesId": "spana:2ac52a30213c9288:98874",
      "sourceReactionId": "spana:2ac52a30213c9288:98874",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Cu(cr)",
      "phase": "solid",
      "conservedComponent": "component:Cu%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Cu": 1,
        "H": 0,
        "O": 0
      },
      "allocation": [
        {
          "oxidationState": 0,
          "count": 1
        }
      ],
      "bindingSha256": "666699718bd6b2ab88609359e58cb7d129b31a1a722355068f3c526301db7c08",
      "provenance": {
        "statement": "Identity-specific curated monatomic, elemental or oxide/hydroxide carrier. Explicit Cu allocation; H(+I) and O(-II) are redox-innocent within this bounded composition. No ligand redox or mixed valence asserted. Stored allocation is checked against source electron balance; never inferred from a runtime name.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365",
          "https://www.skb.se/publikation/18994/TR-01-23.pdf"
        ],
        "sourceCitation": "2000PT: Puigdomenech I, Taxén C; Thermodynamic data for copper. Implications for the corrosion of copper under repository conditions. Report SKB-TR-00-13. Stockholm, Sweden: Swedish Nuclear Fuel and Waste Management Co. (SKB), 2000",
        "sourceReferenceCode": "2000PT",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "cu-oxide-hydroxide-source-snapshot-v1"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:102305",
      "sourceSpeciesId": "spana:2ac52a30213c9288:102305",
      "sourceReactionId": "spana:2ac52a30213c9288:102305",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Cu(OH)2",
      "phase": "aqueous",
      "conservedComponent": "component:Cu%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Cu": 1,
        "H": 2,
        "O": 2
      },
      "allocation": [
        {
          "oxidationState": 2,
          "count": 1
        }
      ],
      "bindingSha256": "d8354f7d233f6382c6d2ba0bfce7b0127394838d0302b4dd35b2d47d2b9a61dc",
      "provenance": {
        "statement": "Identity-specific curated monatomic, elemental or oxide/hydroxide carrier. Explicit Cu allocation; H(+I) and O(-II) are redox-innocent within this bounded composition. No ligand redox or mixed valence asserted. Stored allocation is checked against source electron balance; never inferred from a runtime name.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365",
          "https://www.skb.se/publikation/18994/TR-01-23.pdf"
        ],
        "sourceCitation": "1997BP-Cu: Beverskog B, Puigdomenech I; J. Electrochem. Soc., 144 (1997) 3476-3483",
        "sourceReferenceCode": "1997BP-Cu",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "cu-oxide-hydroxide-source-snapshot-v1"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:102394",
      "sourceSpeciesId": "spana:2ac52a30213c9288:102394",
      "sourceReactionId": "spana:2ac52a30213c9288:102394",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Cu(OH)2(cr)",
      "phase": "solid",
      "conservedComponent": "component:Cu%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Cu": 1,
        "H": 2,
        "O": 2
      },
      "allocation": [
        {
          "oxidationState": 2,
          "count": 1
        }
      ],
      "bindingSha256": "57a00fb20247436dbee44cd7189b4bab49647d8e3d998eeb695b539de5bed45a",
      "provenance": {
        "statement": "Identity-specific curated monatomic, elemental or oxide/hydroxide carrier. Explicit Cu allocation; H(+I) and O(-II) are redox-innocent within this bounded composition. No ligand redox or mixed valence asserted. Stored allocation is checked against source electron balance; never inferred from a runtime name.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365",
          "https://www.skb.se/publikation/18994/TR-01-23.pdf"
        ],
        "sourceCitation": "2000PT: Puigdomenech I, Taxén C; Thermodynamic data for copper. Implications for the corrosion of copper under repository conditions. Report SKB-TR-00-13. Stockholm, Sweden: Swedish Nuclear Fuel and Waste Management Co. (SKB), 2000",
        "sourceReferenceCode": "2000PT",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "cu-oxide-hydroxide-source-snapshot-v1"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:102484",
      "sourceSpeciesId": "spana:2ac52a30213c9288:102484",
      "sourceReactionId": "spana:2ac52a30213c9288:102484",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Cu(OH)2-",
      "phase": "aqueous",
      "conservedComponent": "component:Cu%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Cu": 1,
        "H": 2,
        "O": 2
      },
      "allocation": [
        {
          "oxidationState": 1,
          "count": 1
        }
      ],
      "bindingSha256": "b6113f90437301ecee0aa78268f1ca748e5c6b26737f752f75b3a203a1e281d6",
      "provenance": {
        "statement": "Identity-specific curated monatomic, elemental or oxide/hydroxide carrier. Explicit Cu allocation; H(+I) and O(-II) are redox-innocent within this bounded composition. No ligand redox or mixed valence asserted. Stored allocation is checked against source electron balance; never inferred from a runtime name.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365",
          "https://www.skb.se/publikation/18994/TR-01-23.pdf"
        ],
        "sourceCitation": "1997BP-Cu: Beverskog B, Puigdomenech I; J. Electrochem. Soc., 144 (1997) 3476-3483",
        "sourceReferenceCode": "1997BP-Cu",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "cu-oxide-hydroxide-source-snapshot-v1"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:102572",
      "sourceSpeciesId": "spana:2ac52a30213c9288:102572",
      "sourceReactionId": "spana:2ac52a30213c9288:102572",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Cu(OH)3-",
      "phase": "aqueous",
      "conservedComponent": "component:Cu%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Cu": 1,
        "H": 3,
        "O": 3
      },
      "allocation": [
        {
          "oxidationState": 2,
          "count": 1
        }
      ],
      "bindingSha256": "64c6f55e02f09e874e13f90c7b3cea29be197fcc032b0e9b20689667bd779371",
      "provenance": {
        "statement": "Identity-specific curated monatomic, elemental or oxide/hydroxide carrier. Explicit Cu allocation; H(+I) and O(-II) are redox-innocent within this bounded composition. No ligand redox or mixed valence asserted. Stored allocation is checked against source electron balance; never inferred from a runtime name.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365",
          "https://www.skb.se/publikation/18994/TR-01-23.pdf"
        ],
        "sourceCitation": "1997BP-Cu: Beverskog B, Puigdomenech I; J. Electrochem. Soc., 144 (1997) 3476-3483",
        "sourceReferenceCode": "1997BP-Cu",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "cu-oxide-hydroxide-source-snapshot-v1"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:102662",
      "sourceSpeciesId": "spana:2ac52a30213c9288:102662",
      "sourceReactionId": "spana:2ac52a30213c9288:102662",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Cu(OH)4-2",
      "phase": "aqueous",
      "conservedComponent": "component:Cu%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Cu": 1,
        "H": 4,
        "O": 4
      },
      "allocation": [
        {
          "oxidationState": 2,
          "count": 1
        }
      ],
      "bindingSha256": "73047eeb092a42453fa1d8b7e6d1fdc2332af9eb55cb545fdad5e7221092a272",
      "provenance": {
        "statement": "Identity-specific curated monatomic, elemental or oxide/hydroxide carrier. Explicit Cu allocation; H(+I) and O(-II) are redox-innocent within this bounded composition. No ligand redox or mixed valence asserted. Stored allocation is checked against source electron balance; never inferred from a runtime name.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365",
          "https://www.skb.se/publikation/18994/TR-01-23.pdf"
        ],
        "sourceCitation": "1997BP-Cu: Beverskog B, Puigdomenech I; J. Electrochem. Soc., 144 (1997) 3476-3483",
        "sourceReferenceCode": "1997BP-Cu",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "cu-oxide-hydroxide-source-snapshot-v1"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:104107",
      "sourceSpeciesId": "spana:2ac52a30213c9288:104107",
      "sourceReactionId": "spana:2ac52a30213c9288:104107",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Cu2(OH)2+2",
      "phase": "aqueous",
      "conservedComponent": "component:Cu%202%2B",
      "componentCount": 2,
      "independentAtoms": {
        "Cu": 2,
        "H": 2,
        "O": 2
      },
      "allocation": [
        {
          "oxidationState": 2,
          "count": 2
        }
      ],
      "bindingSha256": "db318a84de9790e93fc1c221d7382a68479629eccb25a2d985954d6339744ca0",
      "provenance": {
        "statement": "Identity-specific curated monatomic, elemental or oxide/hydroxide carrier. Explicit Cu allocation; H(+I) and O(-II) are redox-innocent within this bounded composition. No ligand redox or mixed valence asserted. Stored allocation is checked against source electron balance; never inferred from a runtime name.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365",
          "https://www.skb.se/publikation/18994/TR-01-23.pdf"
        ],
        "sourceCitation": "1997BP-Cu: Beverskog B, Puigdomenech I; J. Electrochem. Soc., 144 (1997) 3476-3483",
        "sourceReferenceCode": "1997BP-Cu",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "cu-oxide-hydroxide-source-snapshot-v1"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:104641",
      "sourceSpeciesId": "spana:2ac52a30213c9288:104641",
      "sourceReactionId": "spana:2ac52a30213c9288:104641",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Cu2O(cr)",
      "phase": "solid",
      "conservedComponent": "component:Cu%202%2B",
      "componentCount": 2,
      "independentAtoms": {
        "Cu": 2,
        "H": 0,
        "O": 1
      },
      "allocation": [
        {
          "oxidationState": 1,
          "count": 2
        }
      ],
      "bindingSha256": "7ddf829f31cf1f2683c438337d900d743396a96b9bc6fe639097195b18d9aecf",
      "provenance": {
        "statement": "Identity-specific curated monatomic, elemental or oxide/hydroxide carrier. Explicit Cu allocation; H(+I) and O(-II) are redox-innocent within this bounded composition. No ligand redox or mixed valence asserted. Stored allocation is checked against source electron balance; never inferred from a runtime name.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365",
          "https://www.skb.se/publikation/18994/TR-01-23.pdf"
        ],
        "sourceCitation": "2000PT: Puigdomenech I, Taxén C; Thermodynamic data for copper. Implications for the corrosion of copper under repository conditions. Report SKB-TR-00-13. Stockholm, Sweden: Swedish Nuclear Fuel and Waste Management Co. (SKB), 2000",
        "sourceReferenceCode": "2000PT",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "cu-oxide-hydroxide-source-snapshot-v1"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:105296",
      "sourceSpeciesId": "spana:2ac52a30213c9288:105296",
      "sourceReactionId": "spana:2ac52a30213c9288:105296",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "Cu3(OH)4+2",
      "phase": "aqueous",
      "conservedComponent": "component:Cu%202%2B",
      "componentCount": 3,
      "independentAtoms": {
        "Cu": 3,
        "H": 4,
        "O": 4
      },
      "allocation": [
        {
          "oxidationState": 2,
          "count": 3
        }
      ],
      "bindingSha256": "cc371d32237d02b45590de0b1393e1b8f13505a7a42de2468c4b48a02559ffcd",
      "provenance": {
        "statement": "Identity-specific curated monatomic, elemental or oxide/hydroxide carrier. Explicit Cu allocation; H(+I) and O(-II) are redox-innocent within this bounded composition. No ligand redox or mixed valence asserted. Stored allocation is checked against source electron balance; never inferred from a runtime name.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365",
          "https://www.skb.se/publikation/18994/TR-01-23.pdf"
        ],
        "sourceCitation": "1997BP-Cu: Beverskog B, Puigdomenech I; J. Electrochem. Soc., 144 (1997) 3476-3483",
        "sourceReferenceCode": "1997BP-Cu",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "cu-oxide-hydroxide-source-snapshot-v1"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:110778",
      "sourceSpeciesId": "spana:2ac52a30213c9288:110778",
      "sourceReactionId": "spana:2ac52a30213c9288:110778",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "CuO(cr)",
      "phase": "solid",
      "conservedComponent": "component:Cu%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Cu": 1,
        "H": 0,
        "O": 1
      },
      "allocation": [
        {
          "oxidationState": 2,
          "count": 1
        }
      ],
      "bindingSha256": "be36e1f28cadf352c84127842aec2d5e3522889997b6a62d66ef401d6a8de43e",
      "provenance": {
        "statement": "Identity-specific curated monatomic, elemental or oxide/hydroxide carrier. Explicit Cu allocation; H(+I) and O(-II) are redox-innocent within this bounded composition. No ligand redox or mixed valence asserted. Stored allocation is checked against source electron balance; never inferred from a runtime name.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365",
          "https://www.skb.se/publikation/18994/TR-01-23.pdf",
          "https://www.ebi.ac.uk/chebi/CHEBI:75955"
        ],
        "sourceCitation": "2000PT: Puigdomenech I, Taxén C; Thermodynamic data for copper. Implications for the corrosion of copper under repository conditions. Report SKB-TR-00-13. Stockholm, Sweden: Swedish Nuclear Fuel and Waste Management Co. (SKB), 2000",
        "sourceReferenceCode": "2000PT",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "cu-oxide-hydroxide-source-snapshot-v1"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:110864",
      "sourceSpeciesId": "spana:2ac52a30213c9288:110864",
      "sourceReactionId": "spana:2ac52a30213c9288:110864",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "CuOH",
      "phase": "aqueous",
      "conservedComponent": "component:Cu%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Cu": 1,
        "H": 1,
        "O": 1
      },
      "allocation": [
        {
          "oxidationState": 1,
          "count": 1
        }
      ],
      "bindingSha256": "763f85fb0f94b6949ac882f8283f391fd91b31a1827c5ed826ea400f1333de81",
      "provenance": {
        "statement": "Identity-specific curated monatomic, elemental or oxide/hydroxide carrier. Explicit Cu allocation; H(+I) and O(-II) are redox-innocent within this bounded composition. No ligand redox or mixed valence asserted. Stored allocation is checked against source electron balance; never inferred from a runtime name.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365",
          "https://www.skb.se/publikation/18994/TR-01-23.pdf"
        ],
        "sourceCitation": "1997BP-Cu: Beverskog B, Puigdomenech I; J. Electrochem. Soc., 144 (1997) 3476-3483",
        "sourceReferenceCode": "1997BP-Cu",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "cu-oxide-hydroxide-source-snapshot-v1"
      }
    },
    {
      "id": "spana:2ac52a30213c9288:110948",
      "sourceSpeciesId": "spana:2ac52a30213c9288:110948",
      "sourceReactionId": "spana:2ac52a30213c9288:110948",
      "sourceDatabaseSha256": "2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a",
      "displayIdentity": "CuOH+",
      "phase": "aqueous",
      "conservedComponent": "component:Cu%202%2B",
      "componentCount": 1,
      "independentAtoms": {
        "Cu": 1,
        "H": 1,
        "O": 1
      },
      "allocation": [
        {
          "oxidationState": 2,
          "count": 1
        }
      ],
      "bindingSha256": "0a439ddf5b0eda50741d7e41cb34b4831b0aba2d24f3b80a1242973976dd584c",
      "provenance": {
        "statement": "Identity-specific curated monatomic, elemental or oxide/hydroxide carrier. Explicit Cu allocation; H(+I) and O(-II) are redox-innocent within this bounded composition. No ligand redox or mixed valence asserted. Stored allocation is checked against source electron balance; never inferred from a runtime name.",
        "references": [
          "https://goldbook.iupac.org/terms/view/O04365",
          "https://www.skb.se/publikation/18994/TR-01-23.pdf"
        ],
        "sourceCitation": "1997BP-Cu: Beverskog B, Puigdomenech I; J. Electrochem. Soc., 144 (1997) 3476-3483",
        "sourceReferenceCode": "1997BP-Cu",
        "curatedAt": "2026-09-10",
        "method": "static-identity-specific-curation",
        "scope": "cu-oxide-hydroxide-source-snapshot-v1"
      }
    }
  ],
  "materiality": {
    "policy": "all-candidates-must-resolve",
    "unresolvedInventoryFloor": 0,
    "statement": "All candidate identities require explicit allocations, including zero amounts and absent solids. No trace waiver; existing component balance tolerance controls closure."
  }
})
