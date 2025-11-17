'use client';

import { useLocale, useRoute, Link } from 'next-globe-gen';

import { Dropdown } from 'src/components';

const languages: { code: 'en' | 'ru' | 'pl'; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
];

const LanguageSwitcher = () => {
  const route = useRoute();
  const activeLocale = useLocale();
  const currentLanguage = languages.find(
    (language) => language.code === activeLocale,
  );

  return (
    <Dropdown.Root>
      <Dropdown.Trigger asChild>
        <button className='flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none'>
          <span>{currentLanguage?.flag}</span>
          <span>{currentLanguage?.name}</span>
        </button>
      </Dropdown.Trigger>

      <Dropdown.Content align='end' className='w-[160px]'>
        {languages.map((language) => (
          <Dropdown.Item key={language.code} className='cursor-pointer' asChild>
            <Link href={route} locale={language.code}>
              <span className='mr-2'>{language.flag}</span>
              <span>{language.name}</span>
            </Link>
          </Dropdown.Item>
        ))}
      </Dropdown.Content>
    </Dropdown.Root>
  );
};

export default LanguageSwitcher;
