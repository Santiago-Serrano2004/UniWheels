import React from 'react';
import { LegalPage } from './LegalPage';
import { PrivacyContent } from './PrivacyContent';

export const PrivacyPage = () => (
  <LegalPage
    title="Tratamiento de datos personales"
    subtitle="Ley 1581 de 2012 y Decreto 1377 de 2013"
  >
    <PrivacyContent />
  </LegalPage>
);
