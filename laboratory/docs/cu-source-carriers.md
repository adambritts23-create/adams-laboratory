# Cu source carrier registry

Pinned source snapshot: 2ac52a30213c9288dd18fc6dd597411e5c3ca53173fa6d1fab5530b371c30a0a. All 14 compatible Cu/H/O source carriers are included. 153 other Cu-bearing source rows require components outside this scope; their exact IDs and excluded components are in cu-source-carriers.json. No compatible solid was suppressed.

| Source identity | Canonical identity | Display identity | Phase | Cu atoms | Explicit allocation | Thermodynamic provenance | Supported |
|---|---|---|---|---:|---|---|---|
| spana:2ac52a30213c9288:97858 | component:Cu%202%2B | Cu 2+ | aqueous | 1 | 1 Cu(2) | 1997BP-Cu | Yes |
| spana:2ac52a30213c9288:103398 | canonical-state:component:Cu%2B | Cu+ | aqueous | 1 | 1 Cu(1) | 1997BP-Cu | Yes |
| spana:2ac52a30213c9288:98874 | spana:2ac52a30213c9288:98874 | Cu(cr) | solid | 1 | 1 Cu(0) | 2000PT | Yes |
| spana:2ac52a30213c9288:102305 | spana:2ac52a30213c9288:102305 | Cu(OH)2 | aqueous | 1 | 1 Cu(2) | 1997BP-Cu | Yes |
| spana:2ac52a30213c9288:102394 | spana:2ac52a30213c9288:102394 | Cu(OH)2(cr) | solid | 1 | 1 Cu(2) | 2000PT | Yes |
| spana:2ac52a30213c9288:102484 | spana:2ac52a30213c9288:102484 | Cu(OH)2- | aqueous | 1 | 1 Cu(1) | 1997BP-Cu | Yes |
| spana:2ac52a30213c9288:102572 | spana:2ac52a30213c9288:102572 | Cu(OH)3- | aqueous | 1 | 1 Cu(2) | 1997BP-Cu | Yes |
| spana:2ac52a30213c9288:102662 | spana:2ac52a30213c9288:102662 | Cu(OH)4-2 | aqueous | 1 | 1 Cu(2) | 1997BP-Cu | Yes |
| spana:2ac52a30213c9288:104107 | spana:2ac52a30213c9288:104107 | Cu2(OH)2+2 | aqueous | 2 | 2 Cu(2) | 1997BP-Cu | Yes |
| spana:2ac52a30213c9288:104641 | spana:2ac52a30213c9288:104641 | Cu2O(cr) | solid | 2 | 2 Cu(1) | 2000PT | Yes |
| spana:2ac52a30213c9288:105296 | spana:2ac52a30213c9288:105296 | Cu3(OH)4+2 | aqueous | 3 | 3 Cu(2) | 1997BP-Cu | Yes |
| spana:2ac52a30213c9288:110778 | spana:2ac52a30213c9288:110778 | CuO(cr) | solid | 1 | 1 Cu(2) | 2000PT | Yes |
| spana:2ac52a30213c9288:110864 | spana:2ac52a30213c9288:110864 | CuOH | aqueous | 1 | 1 Cu(1) | 1997BP-Cu | Yes |
| spana:2ac52a30213c9288:110948 | spana:2ac52a30213c9288:110948 | CuOH+ | aqueous | 1 | 1 Cu(2) | 1997BP-Cu | Yes |

Allocations are identity-specific curated interpretations of monatomic, elemental and oxide/hydroxide carriers; H(+I)/O(-II) are redox-innocent in this scope. They are recorded explicitly and independently checked against canonical electron and atom balance. The importer itself does not supply oxidation-state allocations. Compound naming is never parsed at runtime.

1997BP-Cu: Beverskog and Puigdomenech, Journal of the Electrochemical Society 144 (1997), 3476–3483. 2000PT: Puigdomenech and Taxén, SKB TR-00-13 (2000). The source database retains original references and reaction records for every carrier. [SKB tabulation of the Cu data](https://www.skb.se/publikation/18994/TR-01-23.pdf), [IUPAC oxidation-state definition](https://goldbook.iupac.org/terms/view/O04365), and [ChEBI copper(II) oxide](https://www.ebi.ac.uk/chebi/CHEBI:75955) support the static curation; no runtime network dependency is introduced.

Registry version: cu-oxidation-state-metadata-v1. Scope: cu-oxide-hydroxide-source-snapshot-v1. To change a carrier, review its source identity, explicit allocation, independent atom counts and provenance; refresh its complete reaction fingerprint and the source-basis binding if required; issue a new metadata/evidence pin and rerun matched validation. Do not merely regenerate hashes to bypass a failed scientific check.
