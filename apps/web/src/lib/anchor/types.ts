/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/triper.json`.
 */
export type Triper = {
  "address": "Fn6rAGhjUc45tQqfgsXCdNtNC3GSfNWdjHEjpHaUJMaY",
  "metadata": {
    "name": "triper",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Privacy-preserving travel companion matching using Arcium MPC"
  },
  "instructions": [
    {
      "name": "acceptMatch",
      "discriminator": [
        47,
        107,
        76,
        149,
        208,
        223,
        186,
        191
      ],
      "accounts": [
        {
          "name": "matchAccount",
          "writable": true
        },
        {
          "name": "trip",
          "docs": [
            "Trip account to verify ownership"
          ]
        },
        {
          "name": "user",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "computeTripMatch",
      "docs": [
        "Queue a confidential trip matching computation",
        "Encrypted data is sent to Arcium MPC network"
      ],
      "discriminator": [
        207,
        51,
        58,
        206,
        255,
        202,
        152,
        231
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "signPdaAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  83,
                  105,
                  103,
                  110,
                  101,
                  114,
                  65,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "mxeAccount"
        },
        {
          "name": "mempoolAccount",
          "writable": true
        },
        {
          "name": "executingPool",
          "writable": true
        },
        {
          "name": "computationAccount",
          "writable": true
        },
        {
          "name": "compDefAccount"
        },
        {
          "name": "clusterAccount",
          "writable": true
        },
        {
          "name": "poolAccount",
          "writable": true,
          "address": "7MGSS4iKNM4sVib7bDZDJhVqB6EcchPwVnTKenCY1jt3"
        },
        {
          "name": "clockAccount",
          "address": "FHriyvoZotYiFnbUzKFjzRSb2NiaC8RPWY7jtKuKhg65"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        }
      ],
      "args": [
        {
          "name": "computationOffset",
          "type": "u64"
        },
        {
          "name": "ciphertextA",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "ciphertextB",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "pubKey",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "nonce",
          "type": "u128"
        }
      ]
    },
    {
      "name": "computeTripMatchCallback",
      "docs": [
        "Callback handler - receives match results from MPC network"
      ],
      "discriminator": [
        54,
        121,
        20,
        113,
        29,
        143,
        102,
        131
      ],
      "accounts": [
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        },
        {
          "name": "compDefAccount"
        },
        {
          "name": "instructionsSysvar",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "computationAccount",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "output",
          "type": {
            "defined": {
              "name": "computationOutputs",
              "generics": [
                {
                  "kind": "type",
                  "type": {
                    "defined": {
                      "name": "computeTripMatchOutput"
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "createTrip",
      "docs": [
        "Create a new trip (public metadata only)"
      ],
      "discriminator": [
        52,
        111,
        109,
        110,
        255,
        25,
        133,
        204
      ],
      "accounts": [
        {
          "name": "trip",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  105,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "arg",
                "path": "routeHash"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "routeHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "deactivateTrip",
      "docs": [
        "Deactivate a trip"
      ],
      "discriminator": [
        195,
        147,
        215,
        89,
        103,
        18,
        151,
        164
      ],
      "accounts": [
        {
          "name": "trip",
          "writable": true
        },
        {
          "name": "user",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "initComputeTripMatchCompDef",
      "docs": [
        "Initialize the computation definition for match computation",
        "Must be called once after program deployment"
      ],
      "discriminator": [
        125,
        30,
        108,
        170,
        96,
        215,
        160,
        202
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "mxeAccount",
          "writable": true
        },
        {
          "name": "compDefAccount",
          "writable": true
        },
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "recordMatch",
      "docs": [
        "Record a match (called after decrypting scores on client)"
      ],
      "discriminator": [
        148,
        41,
        163,
        203,
        58,
        251,
        192,
        228
      ],
      "accounts": [
        {
          "name": "matchAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  116,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "tripA"
              },
              {
                "kind": "account",
                "path": "tripB"
              }
            ]
          }
        },
        {
          "name": "tripA",
          "writable": true
        },
        {
          "name": "tripB",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "routeScore",
          "type": "u8"
        },
        {
          "name": "dateScore",
          "type": "u8"
        },
        {
          "name": "interestScore",
          "type": "u8"
        },
        {
          "name": "totalScore",
          "type": "u8"
        }
      ]
    },
    {
      "name": "rejectMatch",
      "docs": [
        "Reject a match"
      ],
      "discriminator": [
        72,
        204,
        109,
        175,
        97,
        58,
        186,
        28
      ],
      "accounts": [
        {
          "name": "matchAccount",
          "writable": true
        },
        {
          "name": "trip",
          "docs": [
            "Trip account to verify ownership"
          ]
        },
        {
          "name": "user",
          "signer": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "clockAccount",
      "discriminator": [
        152,
        171,
        158,
        195,
        75,
        61,
        51,
        8
      ]
    },
    {
      "name": "cluster",
      "discriminator": [
        236,
        225,
        118,
        228,
        173,
        106,
        18,
        60
      ]
    },
    {
      "name": "computationDefinitionAccount",
      "discriminator": [
        245,
        176,
        217,
        221,
        253,
        104,
        172,
        200
      ]
    },
    {
      "name": "feePool",
      "discriminator": [
        172,
        38,
        77,
        146,
        148,
        5,
        51,
        242
      ]
    },
    {
      "name": "mxeAccount",
      "discriminator": [
        103,
        26,
        85,
        250,
        179,
        159,
        17,
        117
      ]
    },
    {
      "name": "matchRecord",
      "discriminator": [
        114,
        83,
        48,
        236,
        239,
        237,
        21,
        85
      ]
    },
    {
      "name": "signerAccount",
      "discriminator": [
        127,
        212,
        7,
        180,
        17,
        50,
        249,
        193
      ]
    },
    {
      "name": "trip",
      "discriminator": [
        181,
        162,
        236,
        3,
        69,
        140,
        211,
        173
      ]
    }
  ],
  "events": [
    {
      "name": "matchComputedEvent",
      "discriminator": [
        219,
        30,
        176,
        98,
        64,
        2,
        23,
        185
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidMatchStatus",
      "msg": "Invalid match status for this operation"
    },
    {
      "code": 6001,
      "name": "unauthorized",
      "msg": "User not authorized for this operation"
    },
    {
      "code": 6002,
      "name": "tripNotActive",
      "msg": "Trip is not active"
    },
    {
      "code": 6003,
      "name": "invalidMxeAccount",
      "msg": "Invalid MXE account reference"
    },
    {
      "code": 6004,
      "name": "computationFailed",
      "msg": "MPC computation failed or was aborted"
    },
    {
      "code": 6005,
      "name": "clusterNotSet",
      "msg": "Cluster not set"
    }
  ],
  "types": [
    {
      "name": "activation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "activationEpoch",
            "type": {
              "defined": {
                "name": "epoch"
              }
            }
          },
          {
            "name": "deactivationEpoch",
            "type": {
              "defined": {
                "name": "epoch"
              }
            }
          }
        ]
      }
    },
    {
      "name": "circuitSource",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "local",
            "fields": [
              {
                "defined": {
                  "name": "localCircuitSource"
                }
              }
            ]
          },
          {
            "name": "onChain",
            "fields": [
              {
                "defined": {
                  "name": "onChainCircuitSource"
                }
              }
            ]
          },
          {
            "name": "offChain",
            "fields": [
              {
                "defined": {
                  "name": "offChainCircuitSource"
                }
              }
            ]
          }
        ]
      }
    },
    {
      "name": "clockAccount",
      "docs": [
        "An account storing the current network epoch"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "startEpoch",
            "type": {
              "defined": {
                "name": "epoch"
              }
            }
          },
          {
            "name": "currentEpoch",
            "type": {
              "defined": {
                "name": "epoch"
              }
            }
          },
          {
            "name": "startEpochTimestamp",
            "type": {
              "defined": {
                "name": "timestamp"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "cluster",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "maxSize",
            "type": "u32"
          },
          {
            "name": "activation",
            "type": {
              "defined": {
                "name": "activation"
              }
            }
          },
          {
            "name": "maxCapacity",
            "type": "u64"
          },
          {
            "name": "cuPrice",
            "type": "u64"
          },
          {
            "name": "cuPriceProposals",
            "type": {
              "array": [
                "u64",
                32
              ]
            }
          },
          {
            "name": "lastUpdatedEpoch",
            "type": {
              "defined": {
                "name": "epoch"
              }
            }
          },
          {
            "name": "mxes",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "nodes",
            "type": {
              "vec": {
                "defined": {
                  "name": "nodeRef"
                }
              }
            }
          },
          {
            "name": "pendingNodes",
            "type": {
              "vec": {
                "defined": {
                  "name": "nodeRef"
                }
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "computationDefinitionAccount",
      "docs": [
        "An account representing a [ComputationDefinition] in a MXE."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "finalizationAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "finalizeDuringCallback",
            "type": "bool"
          },
          {
            "name": "cuAmount",
            "type": "u64"
          },
          {
            "name": "definition",
            "type": {
              "defined": {
                "name": "computationDefinitionMeta"
              }
            }
          },
          {
            "name": "circuitSource",
            "type": {
              "defined": {
                "name": "circuitSource"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "computationDefinitionMeta",
      "docs": [
        "A computation definition for execution in a MXE."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "circuitLen",
            "type": "u32"
          },
          {
            "name": "signature",
            "type": {
              "defined": {
                "name": "computationSignature"
              }
            }
          }
        ]
      }
    },
    {
      "name": "computationOutputs",
      "generics": [
        {
          "kind": "type",
          "name": "o"
        }
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "success",
            "fields": [
              {
                "generic": "o"
              }
            ]
          },
          {
            "name": "failure"
          }
        ]
      }
    },
    {
      "name": "computationSignature",
      "docs": [
        "The signature of a computation defined in a [ComputationDefinition]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "parameters",
            "type": {
              "vec": {
                "defined": {
                  "name": "parameter"
                }
              }
            }
          },
          {
            "name": "outputs",
            "type": {
              "vec": {
                "defined": {
                  "name": "output"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "computeTripMatchOutput",
      "docs": [
        "The output of the callback instruction. Provided as a struct with ordered fields",
        "as anchor does not support tuples and tuple structs yet."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "field0",
            "type": {
              "defined": {
                "name": "computeTripMatchOutputStruct0"
              }
            }
          }
        ]
      }
    },
    {
      "name": "computeTripMatchOutputStruct0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "field0",
            "type": "u8"
          },
          {
            "name": "field1",
            "type": "u8"
          },
          {
            "name": "field2",
            "type": "u8"
          },
          {
            "name": "field3",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "epoch",
      "docs": [
        "The network epoch"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          "u64"
        ]
      }
    },
    {
      "name": "feePool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "localCircuitSource",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "mxeKeygen"
          }
        ]
      }
    },
    {
      "name": "mxeAccount",
      "docs": [
        "A MPC Execution Environment."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "cluster",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "x25519Pubkey",
            "type": {
              "defined": {
                "name": "x25519Pubkey"
              }
            }
          },
          {
            "name": "fallbackClusters",
            "type": {
              "vec": "u32"
            }
          },
          {
            "name": "rejectedClusters",
            "type": {
              "vec": "u32"
            }
          },
          {
            "name": "computationDefinitions",
            "type": {
              "vec": "u32"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "matchComputedEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "computationAccount",
            "type": "pubkey"
          },
          {
            "name": "routeScore",
            "type": "u8"
          },
          {
            "name": "dateScore",
            "type": "u8"
          },
          {
            "name": "interestScore",
            "type": "u8"
          },
          {
            "name": "totalScore",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "matchRecord",
      "docs": [
        "Match record - Stores match status and detailed scores",
        "Computation happens via Arcium MXE confidential circuit"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tripA",
            "docs": [
              "First trip public key"
            ],
            "type": "pubkey"
          },
          {
            "name": "tripB",
            "docs": [
              "Second trip public key"
            ],
            "type": "pubkey"
          },
          {
            "name": "totalScore",
            "docs": [
              "Total match score (0-100)"
            ],
            "type": "u8"
          },
          {
            "name": "routeScore",
            "docs": [
              "Route similarity score (0-100)"
            ],
            "type": "u8"
          },
          {
            "name": "dateScore",
            "docs": [
              "Date overlap score (0-100)"
            ],
            "type": "u8"
          },
          {
            "name": "interestScore",
            "docs": [
              "Interest similarity score (0-100)"
            ],
            "type": "u8"
          },
          {
            "name": "status",
            "docs": [
              "Match status"
            ],
            "type": {
              "defined": {
                "name": "matchStatus"
              }
            }
          },
          {
            "name": "tripAAccepted",
            "docs": [
              "Whether trip_a owner accepted"
            ],
            "type": "bool"
          },
          {
            "name": "tripBAccepted",
            "docs": [
              "Whether trip_b owner accepted"
            ],
            "type": "bool"
          },
          {
            "name": "createdAt",
            "docs": [
              "Creation timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "computationId",
            "docs": [
              "Arcium computation ID (for tracking MXE execution)"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "matchStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "pending"
          },
          {
            "name": "mutual"
          },
          {
            "name": "rejected"
          }
        ]
      }
    },
    {
      "name": "nodeRef",
      "docs": [
        "A reference to a node in the cluster.",
        "The offset is to derive the Node Account.",
        "The current_total_rewards is the total rewards the node has received so far in the current",
        "epoch."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "offset",
            "type": "u32"
          },
          {
            "name": "currentTotalRewards",
            "type": "u64"
          },
          {
            "name": "vote",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "offChainCircuitSource",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "source",
            "type": "string"
          },
          {
            "name": "hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "onChainCircuitSource",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isCompleted",
            "type": "bool"
          },
          {
            "name": "uploadAuth",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "output",
      "docs": [
        "An output of a computation.",
        "We currently don't support encrypted outputs yet since encrypted values are passed via",
        "data objects."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "plaintextBool"
          },
          {
            "name": "plaintextU8"
          },
          {
            "name": "plaintextU16"
          },
          {
            "name": "plaintextU32"
          },
          {
            "name": "plaintextU64"
          },
          {
            "name": "plaintextU128"
          },
          {
            "name": "ciphertext"
          },
          {
            "name": "arcisPubkey"
          },
          {
            "name": "plaintextFloat"
          }
        ]
      }
    },
    {
      "name": "parameter",
      "docs": [
        "A parameter of a computation.",
        "We differentiate between plaintext and encrypted parameters and data objects.",
        "Plaintext parameters are directly provided as their value.",
        "Encrypted parameters are provided as an offchain reference to the data.",
        "Data objects are provided as a reference to the data object account."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "plaintextBool"
          },
          {
            "name": "plaintextU8"
          },
          {
            "name": "plaintextU16"
          },
          {
            "name": "plaintextU32"
          },
          {
            "name": "plaintextU64"
          },
          {
            "name": "plaintextU128"
          },
          {
            "name": "ciphertext"
          },
          {
            "name": "arcisPubkey"
          },
          {
            "name": "arcisSignature"
          },
          {
            "name": "plaintextFloat"
          },
          {
            "name": "manticoreAlgo"
          },
          {
            "name": "inputDataset"
          }
        ]
      }
    },
    {
      "name": "signerAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "timestamp",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timestamp",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "trip",
      "docs": [
        "Public trip metadata - NO SENSITIVE DATA",
        "Sensitive data (route, dates, interests) is encrypted and processed via Arcium MXE"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "docs": [
              "Owner's public key"
            ],
            "type": "pubkey"
          },
          {
            "name": "routeHash",
            "docs": [
              "Hash of the route for verification (non-sensitive)"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "createdAt",
            "docs": [
              "Creation timestamp"
            ],
            "type": "i64"
          },
          {
            "name": "isActive",
            "docs": [
              "Whether trip is active for matching"
            ],
            "type": "bool"
          },
          {
            "name": "computationCount",
            "docs": [
              "Number of match computations performed",
              "Used to track Arcium MXE usage"
            ],
            "type": "u32"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA derivation"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "x25519Pubkey",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "set",
            "fields": [
              {
                "array": [
                  "u8",
                  32
                ]
              }
            ]
          },
          {
            "name": "unset",
            "fields": [
              {
                "array": [
                  "u8",
                  32
                ]
              },
              {
                "vec": "bool"
              }
            ]
          }
        ]
      }
    }
  ]
};
