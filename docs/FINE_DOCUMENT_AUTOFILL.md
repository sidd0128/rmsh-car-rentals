# Fine document OCR autofill

The Add Fine screen can read a toll or fine photo and pre-fill fine details.

## Flow

1. `MediaUploader` reports newly added or replaced images through `onImagesAdded`.
2. `FineFormScreen` sends the first new image to `readFineDocumentImage`.
3. `readFineDocumentImage` uses `@react-native-ml-kit/text-recognition` to run on-device OCR.
4. `extractFineDocumentAutofill` parses the OCR text for:
   - amount, preferring values near amount/total/fine/toll labels
   - fine/offence/trip date, preferring labelled date lines
   - known car number plate by matching against saved cars
   - reason line from common fine/toll keywords
5. `resolveRentalForFineDate` assigns the customer and car when the detected fine date falls inside a rental window. If a plate is detected, the match is restricted to that car.

## Native setup

The OCR package autolinks on React Native 0.85. Rebuild the native app after installing it.

For iOS, run CocoaPods after dependency installation:

```sh
cd ios
pod install
```

For Android, rebuild the app so Gradle includes the ML Kit native module.

## User behavior

Autofill is intentionally assistive. The user can still manually edit customer, amount, reason, date, and paid status before saving. If OCR cannot find a reliable match, the screen keeps the uploaded proof image and asks the user to enter the remaining details manually.
