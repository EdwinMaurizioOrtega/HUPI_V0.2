import type { CustomerProfile } from '@/domain/profile';

export type ProviderEntityType = 'natural' | 'legal';
export type ProviderVerificationStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'changes_requested'
  | 'approved'
  | 'rejected'
  | 'suspended';
export type ProviderVerificationSectionStatus =
  | 'pending'
  | 'complete'
  | 'under_review'
  | 'approved'
  | 'changes_requested';

export type ProviderVerificationSectionKey =
  | 'account'
  | 'personal'
  | 'identity'
  | 'address'
  | 'contact'
  | 'bank'
  | 'general'
  | 'company'
  | 'company_documents'
  | 'legal_representative';

export type ProviderAddress = {
  address: string;
  city: string;
  sector: string;
  houseNumber: string;
  locationType: 'house' | 'building';
  buildingName: string;
  unitNumber: string;
};

export type ProviderContact = {
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  email: string;
};

export type ProviderBankDetails = {
  bank: string;
  accountType: string;
  accountNumber: string;
  accountHolder: string;
  holderTaxId: string;
};

export type ProviderIdentity = {
  nationalId: string;
  birthDate: string;
  nationality: string;
  selfieUri: string;
  idFrontUri: string;
  idBackUri: string;
};

export type ProviderCompany = {
  legalName: string;
  tradeName: string;
  ruc: string;
  companyType: string;
  incorporationDate: string;
  fiscalAddress: string;
  city: string;
  sector: string;
  houseNumber: string;
  locationType: 'house' | 'building';
  buildingName: string;
  officeNumber: string;
  phone: string;
  email: string;
  website: string;
};

export type ProviderCompanyDocuments = {
  rucDocumentUri: string;
  incorporationDocumentUri: string;
  legalRepresentativeAppointmentUri: string;
};

export type ProviderLegalRepresentative = ProviderIdentity & {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

export type ProviderVerificationDraft = {
  website: string;
  identity: ProviderIdentity;
  address: ProviderAddress;
  contact: ProviderContact;
  bank: ProviderBankDetails;
  company: ProviderCompany;
  companyDocuments: ProviderCompanyDocuments;
  legalRepresentative: ProviderLegalRepresentative;
  contactIsLegalRepresentative: boolean;
  generalInformation: string;
};

export type LocalProviderEnrollment = {
  accountId: string;
  entityType: ProviderEntityType;
  status: ProviderVerificationStatus;
  emailValidated: boolean;
  draft: ProviderVerificationDraft;
  sectionOverrides: Partial<Record<ProviderVerificationSectionKey, ProviderVerificationSectionStatus>>;
  lastPendingSection: ProviderVerificationSectionKey;
  submittedAt?: string;
  updatedAt: string;
};

export type ProviderVerificationSection = {
  key: ProviderVerificationSectionKey;
  status: ProviderVerificationSectionStatus;
  complete: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const filled = (value: string) => Boolean(value.trim());
const validEmail = (value: string) => EMAIL_PATTERN.test(value.trim());

export const naturalVerificationSections: ProviderVerificationSectionKey[] = [
  'account', 'personal', 'identity', 'address', 'contact', 'bank', 'general',
];
export const legalVerificationSections: ProviderVerificationSectionKey[] = [
  'account', 'company', 'company_documents', 'legal_representative', 'address', 'contact', 'bank',
];

export function createEmptyProviderVerificationDraft(): ProviderVerificationDraft {
  return {
    website: '',
    identity: { nationalId: '', birthDate: '', nationality: '', selfieUri: '', idFrontUri: '', idBackUri: '' },
    address: { address: '', city: '', sector: '', houseNumber: '', locationType: 'house', buildingName: '', unitNumber: '' },
    contact: { firstName: '', lastName: '', role: '', phone: '', email: '' },
    bank: { bank: '', accountType: '', accountNumber: '', accountHolder: '', holderTaxId: '' },
    company: { legalName: '', tradeName: '', ruc: '', companyType: '', incorporationDate: '', fiscalAddress: '', city: '', sector: '', houseNumber: '', locationType: 'house', buildingName: '', officeNumber: '', phone: '', email: '', website: '' },
    companyDocuments: { rucDocumentUri: '', incorporationDocumentUri: '', legalRepresentativeAppointmentUri: '' },
    legalRepresentative: { firstName: '', lastName: '', nationalId: '', birthDate: '', nationality: '', phone: '', email: '', selfieUri: '', idFrontUri: '', idBackUri: '' },
    contactIsLegalRepresentative: false,
    generalInformation: '',
  };
}

export function createProviderEnrollment(
  accountId: string,
  entityType: ProviderEntityType,
  draft: ProviderVerificationDraft = createEmptyProviderVerificationDraft(),
): LocalProviderEnrollment {
  return {
    accountId,
    entityType,
    status: 'in_progress',
    emailValidated: false,
    draft,
    sectionOverrides: {},
    lastPendingSection: 'account',
    updatedAt: new Date().toISOString(),
  };
}

export function getProviderContact(enrollment: LocalProviderEnrollment) {
  if (enrollment.entityType === 'legal' && enrollment.draft.contactIsLegalRepresentative) {
    const representative = enrollment.draft.legalRepresentative;
    return {
      firstName: representative.firstName,
      lastName: representative.lastName,
      role: 'Representante legal',
      phone: representative.phone,
      email: representative.email,
    };
  }
  return enrollment.draft.contact;
}

export function isProviderSectionComplete(
  key: ProviderVerificationSectionKey,
  enrollment: LocalProviderEnrollment,
  profile: CustomerProfile,
  phoneVerified: boolean,
) {
  const { draft } = enrollment;
  switch (key) {
    case 'account':
      return filled(profile.firstName) && filled(profile.lastName) && filled(profile.phone)
        && validEmail(profile.email) && phoneVerified && enrollment.emailValidated;
    case 'personal':
      return filled(draft.identity.nationalId) && filled(draft.identity.birthDate)
        && filled(draft.identity.nationality);
    case 'identity':
      return filled(draft.identity.selfieUri) && filled(draft.identity.idFrontUri) && filled(draft.identity.idBackUri);
    case 'address': {
      const address = enrollment.entityType === 'legal'
        ? {
          address: draft.company.fiscalAddress,
          city: draft.company.city,
          sector: draft.company.sector,
          houseNumber: draft.company.houseNumber,
          locationType: draft.company.locationType,
          buildingName: draft.company.buildingName,
          unitNumber: draft.company.officeNumber,
        }
        : draft.address;
      return filled(address.address) && filled(address.city) && filled(address.sector)
        && filled(address.houseNumber)
        && (address.locationType === 'house' || (filled(address.buildingName) && filled(address.unitNumber)));
    }
    case 'contact': {
      const contact = getProviderContact(enrollment);
      return filled(contact.firstName) && filled(contact.lastName)
        && (enrollment.entityType === 'natural' || filled(contact.role))
        && filled(contact.phone) && validEmail(contact.email);
    }
    case 'bank':
      return filled(draft.bank.bank) && filled(draft.bank.accountType) && filled(draft.bank.accountNumber)
        && filled(draft.bank.accountHolder) && filled(draft.bank.holderTaxId);
    case 'general':
      return filled(draft.generalInformation);
    case 'company':
      return filled(draft.company.legalName) && filled(draft.company.tradeName) && filled(draft.company.ruc)
        && filled(draft.company.companyType) && filled(draft.company.incorporationDate)
        && filled(draft.company.phone) && validEmail(draft.company.email);
    case 'company_documents':
      return filled(draft.companyDocuments.rucDocumentUri)
        && filled(draft.companyDocuments.incorporationDocumentUri)
        && filled(draft.companyDocuments.legalRepresentativeAppointmentUri);
    case 'legal_representative': {
      const representative = draft.legalRepresentative;
      return filled(representative.firstName) && filled(representative.lastName)
        && filled(representative.nationalId) && filled(representative.phone) && validEmail(representative.email)
        && filled(representative.selfieUri) && filled(representative.idFrontUri) && filled(representative.idBackUri);
    }
  }
}

export function getProviderVerificationSections(
  enrollment: LocalProviderEnrollment,
  profile: CustomerProfile,
  phoneVerified: boolean,
): ProviderVerificationSection[] {
  const keys = enrollment.entityType === 'legal' ? legalVerificationSections : naturalVerificationSections;
  return keys.map((key) => {
    const complete = isProviderSectionComplete(key, enrollment, profile, phoneVerified);
    const overridden = enrollment.sectionOverrides[key];
    let status: ProviderVerificationSectionStatus = overridden ?? (complete ? 'complete' : 'pending');
    if (!overridden && complete && ['submitted', 'under_review'].includes(enrollment.status)) status = 'under_review';
    if (!overridden && complete && enrollment.status === 'approved') status = 'approved';
    return { key, complete, status };
  });
}

export function getProviderVerificationProgress(
  enrollment: LocalProviderEnrollment,
  profile: CustomerProfile,
  phoneVerified: boolean,
) {
  const sections = getProviderVerificationSections(enrollment, profile, phoneVerified);
  const complete = sections.filter((section) => section.complete).length;
  return sections.length ? Math.round((complete / sections.length) * 100) : 0;
}

export function getMissingProviderSections(
  enrollment: LocalProviderEnrollment,
  profile: CustomerProfile,
  phoneVerified: boolean,
) {
  return getProviderVerificationSections(enrollment, profile, phoneVerified)
    .filter((section) => !section.complete)
    .map((section) => section.key);
}

export function canSubmitProviderVerification(
  enrollment: LocalProviderEnrollment,
  profile: CustomerProfile,
  phoneVerified: boolean,
) {
  return getMissingProviderSections(enrollment, profile, phoneVerified).length === 0
    && ['in_progress', 'changes_requested'].includes(enrollment.status);
}

export function isProviderGenerallyApproved(status: ProviderVerificationStatus) {
  return status === 'approved';
}
