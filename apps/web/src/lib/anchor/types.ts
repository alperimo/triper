/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/triper.json`.
 */
export type Triper = {
  "address": "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS",
  "metadata": {
    "name": "triper",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Privacy-preserving travel companion matching using Arcium MPC"
  },
  "instructions": [
    {
      "name": "acceptMatch",
      "docs": [
        "Accept a match"
      ],
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
          "name": "matchRecord",
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
                "kind": "account",
                "path": "mxeDataAccount"
              }
            ]
          }
        },
        {
          "name": "mxeDataAccount"
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
      "name": "recordMatch",
      "docs": [
        "Record a match (called by backend after MXE computation)"
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
          "name": "matchRecord",
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
          "name": "tripA"
        },
        {
          "name": "tripB"
        },
        {
          "name": "payer",
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
          "name": "matchScore",
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
          "name": "matchRecord",
          "writable": true
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
    }
  ],
  "types": [
    {
      "name": "matchRecord",
      "docs": [
        "Match record - Stores match status and consent",
        "Actual match computation happens in triper-mxe program"
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
            "name": "matchScore",
            "docs": [
              "Match score (0-100)"
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
      "name": "trip",
      "docs": [
        "Public trip metadata - NO SENSITIVE DATA",
        "All sensitive data (encrypted route, dates, interests) is stored in triper-mxe program"
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
            "name": "mxeDataAccount",
            "docs": [
              "Reference to the MXE account that holds encrypted trip data"
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
            "name": "bump",
            "docs": [
              "Bump seed for PDA derivation"
            ],
            "type": "u8"
          }
        ]
      }
    }
  ]
};
