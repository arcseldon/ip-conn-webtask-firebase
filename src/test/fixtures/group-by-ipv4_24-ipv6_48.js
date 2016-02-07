// author arcseldon@icloud.com
'use strict';

/***************************************************
 * Some test fixture mappings with group by IPv4 24 bits,
 * and IPv6 48 bits characteristics.
 *
 * Not stored as JSON because Istanbul chokes, and
 * using require is easier than reading file from disk.
 ***************************************************/

module.exports = {
  "ipv4": {
    "83:29:4": [
      {
        "cidr": "83.29.4.2/16",
        "connection": "fabrikam-adfs"
      }
    ],
    "99:2:4": [
      {
        "cidr": "99.2.4.28/32",
        "connection": "contoso-ping"
      }
    ],
    "44:2:4": [
      {
        "cidr": "44.2.4.3/16",
        "connection": "ms-azuread"
      }
    ]
  },
  "ipv6": {
    "200b:af16:a83f": [
      {
        "cidr": "200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40",
        "connection": "fabrikam-adfs-6"
      }
    ],
    "60b9:0fd3:7e62": [
      {
        "cidr": "60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6/40",
        "connection": "contoso-ping-6"
      }
    ],
    "eaf5:59b7:ee1f": [
      {
        "cidr": "eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29/64",
        "connection": "ms-azuread-6"
      }
    ]
  }
}
