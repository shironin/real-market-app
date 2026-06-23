const ro = {
  welcome: {
    subtitle: 'Aveți mereu acces la cardul dvs. de reduceri — fără cozi și fără plastic.',
    start: 'Începe',
    disclaimerText: 'Continuând, acceptați',
    disclaimerLink: 'politica de confidențialitate',
  },
  enterNumber: {
    back: '← Înapoi',
    title: 'Numărul tău',
    subtitle: 'Introduceți numărul de telefon pentru a primi codul de confirmare.',
    phoneLabel: 'Număr de telefon',
    sendCode: 'Trimite codul',
  },
  otp: {
    back: '← Înapoi',
    title: 'Introduceți codul',
    subtitle: 'Am trimis un cod din 6 cifre la numărul',
    resend: 'Retrimite codul',
    resendIn: 'Retrimite codul în {{seconds}}s',
    verify: 'Confirmați',
  },
  profileEdit: {
    title: 'Profilul tău',
    subtitle: 'Cum vă numiți? Aceasta va apărea pe cardul dvs.',
    firstNameLabel: 'Prenume',
    firstNamePlaceholder: 'Ion',
    lastNameLabel: 'Nume de familie',
    lastNamePlaceholder: 'Ionescu',
    save: 'Salvați',
  },
  dashboard: {
    myCard: 'Cardul meu',
    cardSubtitle: 'Prezentați codul la casă pentru a primi reducerea',
    programMember: 'Membru al programului',
    discount: 'Reducere',
    access: 'Acces',
    validity: 'Valabilitate',
  },
  settings: {
    title: 'Setări',
    account: 'Cont',
    editProfile: 'Modificați profilul',
    myNumber: 'Numărul meu',
    card: 'Card',
    cardNumber: 'Număr card',
    discount: 'Reducere',
    other: 'Altele',
    appVersion: 'Versiunea aplicației',
    privacyPolicy: 'Politica de confidențialitate',
    terms: 'Termeni de utilizare',
    dangerZone: 'Zonă periculoasă',
    logout: 'Deconectare',
    deleteData: 'Ștergeți datele mele',
    deleteDataTitle: 'Ștergeți datele?',
    deleteDataMessage: 'Cardul și contul dvs. vor fi șterse definitiv. Această acțiune nu poate fi anulată.',
    deleteDataCancel: 'Anulează',
    deleteDataError: 'Nu am putut șterge datele. Încearcă din nou.',
  },
  tabs: {
    home: 'Acasă',
    settings: 'Setări',
  },
  policy: {
    title: 'Politica de confidențialitate',
  },
  errors: {
    generic: 'Ceva a mers greșit. Încearcă din nou.',
    invalidOtp: 'Cod incorect. Încearcă din nou.',
    invalidPhone: 'Număr de telefon invalid.',
    tooManyRequests: 'Prea multe încercări. Reîncercați mai târziu.',
    otpExpired: 'Codul a expirat. Solicitați un cod nou.',
    sessionNotFound: 'Sesiunea a expirat. Solicitați un cod nou.',
  },
  card: {
    title: 'CARD DE REDUCERE',
    defaultHolder: 'Participant',
    loadError: 'Nu am putut încărca cardul.',
    retry: 'Încearcă din nou',
  },
} as const;

const ru: typeof ro = {
  welcome: {
    subtitle: 'Всегда имейте доступ к вашей дисконтной карте — без очередей и пластика.',
    start: 'Начать',
    disclaimerText: 'Продолжая, вы принимаете',
    disclaimerLink: 'политику конфиденциальности',
  },
  enterNumber: {
    back: '← Назад',
    title: 'Ваш номер',
    subtitle: 'Введите номер телефона, чтобы получить код подтверждения.',
    phoneLabel: 'Номер телефона',
    sendCode: 'Отправить код',
  },
  otp: {
    back: '← Назад',
    title: 'Введите код',
    subtitle: 'Мы отправили 6-значный код на номер',
    resend: 'Отправить код повторно',
    resendIn: 'Отправить код повторно через {{seconds}}с',
    verify: 'Подтвердить',
  },
  profileEdit: {
    title: 'Ваш профиль',
    subtitle: 'Как вас зовут? Это отобразится на вашей карте.',
    firstNameLabel: 'Имя',
    firstNamePlaceholder: 'Иван',
    lastNameLabel: 'Фамилия',
    lastNamePlaceholder: 'Иванов',
    save: 'Сохранить',
  },
  dashboard: {
    myCard: 'Моя карта',
    cardSubtitle: 'Покажите код на кассе для получения скидки',
    programMember: 'Участник программы',
    discount: 'Скидка',
    access: 'Доступ',
    validity: 'Срок',
  },
  settings: {
    title: 'Настройки',
    account: 'Аккаунт',
    editProfile: 'Изменить профиль',
    myNumber: 'Мой номер',
    card: 'Карта',
    cardNumber: 'Номер карты',
    discount: 'Скидка',
    other: 'Прочее',
    appVersion: 'Версия приложения',
    privacyPolicy: 'Политика конфиденциальности',
    terms: 'Условия использования',
    dangerZone: 'Опасная зона',
    logout: 'Выйти из аккаунта',
    deleteData: 'Удалить мои данные',
    deleteDataTitle: 'Удалить данные?',
    deleteDataMessage: 'Ваша карта и аккаунт будут удалены навсегда. Это действие нельзя отменить.',
    deleteDataCancel: 'Отмена',
    deleteDataError: 'Не удалось удалить данные. Попробуйте снова.',
  },
  tabs: {
    home: 'Главная',
    settings: 'Настройки',
  },
  policy: {
    title: 'Политика конфиденциальности',
  },
  errors: {
    generic: 'Что-то пошло не так. Попробуйте снова.',
    invalidOtp: 'Неверный код. Попробуйте снова.',
    invalidPhone: 'Неверный формат номера телефона.',
    tooManyRequests: 'Слишком много попыток. Попробуйте позже.',
    otpExpired: 'Код истёк. Запросите новый код.',
    sessionNotFound: 'Сессия истекла. Запросите новый код.',
  },
  card: {
    title: 'КАРТА СКИДКИ',
    defaultHolder: 'Участник',
    loadError: 'Не удалось загрузить карту.',
    retry: 'Попробовать снова',
  },
};

export type Language = 'ro' | 'ru';

type TranslationMap = typeof ro;

type DotKeys<T> = {
  [K in keyof T & string]: T[K] extends Record<string, string>
    ? `${K}.${keyof T[K] & string}`
    : never;
}[keyof T & string];

export type TranslationKey = DotKeys<TranslationMap>;

export const translations: Record<Language, TranslationMap> = { ro, ru };

export function translate(lang: Language, key: TranslationKey): string {
  const [section, field] = key.split('.') as [keyof TranslationMap, string];
  return (translations[lang][section] as Record<string, string>)[field] ?? key;
}
