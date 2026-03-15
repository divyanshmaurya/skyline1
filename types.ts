
export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  description: string;
  image: string;
  features?: string[];
  price?: string;
  location?: string;
}

export enum PropertyType {
  TOWNHOUSE = 'Historic Townhouses',
  CONDO = 'Luxury Condos',
  PENTHOUSE = 'Skyline Penthouses',
  COMMERCIAL = 'Prime Commercial',
  COOP = 'Exclusive Co-ops'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum ChatStage {
  WELCOME = 'WELCOME',
  CORE_NEEDS = 'CORE_NEEDS',
  INTENT_SPECIFIC = 'INTENT_SPECIFIC',
  VALUE_EXCHANGE = 'VALUE_EXCHANGE',
  LEAD_CAPTURE_NAME = 'LEAD_CAPTURE_NAME',
  LEAD_CAPTURE_CONTACT = 'LEAD_CAPTURE_CONTACT',
  HANDOFF = 'HANDOFF',
  COMPLETE = 'COMPLETE'
}

export interface ChatSessionData {
  intent?: 'Buy' | 'Rent' | 'Sell';
  location?: string;
  budget?: string;
  timeline?: string;
  bedrooms?: string;
  financingStatus?: string;
  zipCode?: string;
  listingPreference?: string;
  name?: string;
  phone?: string;
  email?: string;
  contactPreference?: 'Text' | 'Call';
  bestTime?: string;
}

export interface ChatResponse {
  message: string;
  extractedData?: Partial<ChatSessionData>;
  nextStage?: ChatStage;
  fallback?: boolean;
}
