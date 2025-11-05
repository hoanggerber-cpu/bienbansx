export interface Confirmation {
  id: string;
  productCodeName: string;
  customerName: string;
  sampleSewingDate: string;
  productionDate: string;
  sampleEditDetails: string;
  originalForm: string;
  sampleImage: string | null; // base64 string
  patternImage: string | null; // base64 string
  agreedToTerms: boolean;
  signature: string | null; // base64 string
  confirmationDate: string;
  reportCreator: string;
}
