export interface ExtendRentalInput {
  rentalId: string;
  /** New contract end date (must be after the current rental end). */
  newEndDate: string;
  /** Mark the first installment of the extension as received when true. */
  collectFirstPaymentOnExtension?: boolean;
}
