/**
 * Type of payment address in PaymentInformation.
 */
import { JWS } from 'jose'

import GeneralJWS = JWS.GeneralJWS

export enum AddressDetailsType {
  CryptoAddress = 'CryptoAddressDetails',
  AchAddress = 'AchAddressDetails',
}

/**
 * Matching schema for AddressDetailsType.CryptoAddress.
 */
export interface CryptoAddressDetails {
  readonly address: string
  readonly tag?: string
}

/**
 * Matching schema for AddressDetailsType.AchAddress.
 */
export interface AchAddressDetails {
  readonly accountNumber: string
  readonly routingNumber: string
}

/**
 * Payment information included in a PaymentSetupDetails or by itself (in the
 * case of a GET request to the base path /).
 */
export interface PaymentInformation {
  readonly addresses: Address[]
  readonly payId?: string
  readonly memo?: string
  readonly verifiedAddress: GeneralJWS[]
}

/**
 * Address information included inside of a PaymentInformation object.
 */
export interface Address {
  readonly paymentNetwork: string
  readonly environment?: string
  readonly addressDetailsType: AddressDetailsType
  readonly addressDetails: CryptoAddressDetails | AchAddressDetails
}