import { LANGUAGE_OPTIONS, useLanguage } from '../../i18n/LanguageContext';
import { Language } from '../../i18n/translations';
import { SelectButton } from './SelectButton';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  return (
    <SelectButton<Language>
      options={LANGUAGE_OPTIONS}
      value={language}
      onChange={setLanguage}
    />
  );
}
