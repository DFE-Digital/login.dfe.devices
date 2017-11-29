# DfE Login Devices
[![Build Status](https://travis-ci.org/DFE-Digital/login.dfe.devices.svg?branch=master)](https://travis-ci.org/DFE-Digital/login.dfe.devices)
[![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest)

API for managing devices and validating user entered codes for devices

## Contents
- [Api Resources](#api-resources)
  - [Authentication](#authentication)
  - [Digipass](#digipass)
    - [Add Digipass devices](#add-digipass-devices)
    - [Verify user code](#verify-user-code)
    
## Api Resources

### Authentication

All Api resources require a bearer token to be provided in the authorization header, in the format

```
Bearer <YOUR-TOKEN>
```

There are authorization methods available for tokens.

#### JWT Authentication

If you config setting `auth.type` is `secret` then a JWT token is expected as the bearer token, using the secret stored in `config.auth.secret`

#### Azure Active Directory Auth

If you config setting `auth.type` is `aad` then a JWT token issued by AAD is require.


###  Digipass

This is the resource collection for Digipass devices

#### Add Digipass devices

You can add one or more digipass devices to the system

```
POST /digipass
content-type: application/json
 
{
  "devices": [
    {
      "serialNumber": 54321546,
      "secret": "some-secret-in-base32",
      "counter": 123
    }
  ]
}
```

#### Verify user code

When using a device to authenticate a user, use this method to verify the code they entered against the device

```
POST /digipass/:serial_number/verify
content-type: application/json
 
{
  "code": "12345678"
}
```