import TextRecognition from '@react-native-ml-kit/text-recognition';
import type { MediaUri } from '@core/types/media';
import {
  extractCustomerLicenseAutofill,
  type CustomerLicenseExtraction,
} from './customerLicenseAutofillService';

interface ReadCustomerLicenseInput {
  imageUri: MediaUri;
}

export const readCustomerLicenseImage = async ({
  imageUri,
}: ReadCustomerLicenseInput): Promise<CustomerLicenseExtraction> => {
  const result = await TextRecognition.recognize(imageUri);

  return extractCustomerLicenseAutofill({
    ocrText: result.text,
  });
};
