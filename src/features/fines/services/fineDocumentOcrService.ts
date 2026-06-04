import TextRecognition from '@react-native-ml-kit/text-recognition';
import type { Car, Customer, Rental } from '@core/types/domain';
import type { MediaUri } from '@core/types/media';
import {
  extractFineDocumentAutofill,
  type FineDocumentExtraction,
} from './fineDocumentAutofillService';

interface ReadFineDocumentInput {
  imageUri: MediaUri;
  cars: Car[];
  customers: Customer[];
  rentals: Rental[];
}

export const readFineDocumentImage = async ({
  imageUri,
  cars,
  customers,
  rentals,
}: ReadFineDocumentInput): Promise<FineDocumentExtraction> => {
  const result = await TextRecognition.recognize(imageUri);

  return extractFineDocumentAutofill({
    ocrText: result.text,
    cars,
    customers,
    rentals,
  });
};
