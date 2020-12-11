import { JWK, JWS } from 'jose'

import { toKey } from './keys'
import { verifySignedAddress } from './signatures'
import {
  Address,
  PaymentInformation,
  ProtectedHeaders,
  UnsignedVerifiedAddress,
  VerifiedAddress,
} from './verifiable-paystring'

/**
 * Service to inspect a PaymentInformation object's signatures and certificates.
 */
export default class PaymentInformationInspector {
  /**
   * Inspects the signatures and certificate for the given paymentInformation.
   *
   * @param paymentInfo - The object to inspect.
   * @returns The inspection result.
   * @throws Error - If paymentInfo is missing expected fields.
   */
  public inspect(
    paymentInfo: PaymentInformation,
  ): PaymentInformationInspectionResult {
    const payString = paymentInfo.payId
    if (!payString) {
      throw new Error('payString property is empty')
    }
    const verifiedAddressesResults = paymentInfo.verifiedAddresses.map(
      (address) => this.inspectVerifiedAddress(payString, address),
    )
    const isVerified = verifiedAddressesResults.every(
      (result) => result.isVerified,
    )
    return {
      payString,
      isVerified,
      verifiedAddressesResults,
    }
  }

  /**
   * Inspect signature on verified addresses.
   *
   * @param payString - The PayString this address belongs to.
   * @param verifiedAddress - The verified address to inspect.
   * @returns The inspection result.
   */
  private inspectVerifiedAddress(
    payString: string,
    verifiedAddress: VerifiedAddress,
  ): VerifiedAddressInspectionResult {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- because JSON
    const address: UnsignedVerifiedAddress = JSON.parse(verifiedAddress.payload)
    const signaturesResults = verifiedAddress.signatures.map((recipient) => {
      const jwsWithSingleSignature = {
        payload: verifiedAddress.payload,
        signatures: [
          {
            signature: recipient.signature,
            protected: recipient.protected,
          },
        ],
      }
      return this.inspectSignature(payString, jwsWithSingleSignature, recipient)
    })
    const isVerified = signaturesResults.every(
      (result) => result.isSignatureValid,
    )
    return {
      isVerified,
      address: address.payIdAddress,
      signaturesResults,
    }
  }

  /**
   * Inspects the signature.
   *
   * @param payString - The payString this signature belongs to.
   * @param jws - The JWS that contains the recipient.
   * @param recipient - The recipient signature to inspect.
   * @returns The inspection result.
   */
  // eslint-disable-next-line class-methods-use-this -- previously referenced a class field. could be refactored.
  private inspectSignature(
    payString: string,
    jws: JWS.GeneralJWS,
    recipient: JWS.JWSRecipient,
  ): SignatureInspectionResult {
    if (!recipient.protected) {
      return { isSignatureValid: false }
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- because JSON
    const headers: ProtectedHeaders = JSON.parse(
      Buffer.from(recipient.protected, 'base64').toString('utf-8'),
    )
    const jwk = toKey(headers.jwk)
    const isSignatureValid = verifySignedAddress(payString, jws)
    return { isSignatureValid, keyType: headers.name, jwk }
  }
}

interface PaymentInformationInspectionResult {
  payString: string
  // if all the addresses in the PaymentInformation object passed verification
  readonly isVerified: boolean
  verifiedAddressesResults: VerifiedAddressInspectionResult[]
}

interface VerifiedAddressInspectionResult {
  // if all the signatures in the PaymentInformation object passed verification
  readonly isVerified: boolean
  readonly address: Address
  signaturesResults: SignatureInspectionResult[]
}

export interface SignatureInspectionResult {
  // if the signature passed verification
  readonly isSignatureValid: boolean
  readonly keyType?: string
  readonly jwk?: JWK.RSAKey | JWK.ECKey | JWK.OKPKey | JWK.OctKey
}
