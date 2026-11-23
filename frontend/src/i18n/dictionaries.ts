/**
 * RO/EN dictionaries. English is the source of truth: its keys define
 * TranslationKey, and Romanian must provide every key (checked by TypeScript).
 * No UI string is hard-coded in components: they all go through t("key").
 */
export const en = {
  "nav.home": "Home",
  "nav.accommodations": "Accommodations",
  "nav.login": "Login",
  "nav.signup": "Sign Up",
  "nav.language": "Language",

  "home.title": "Find your next stay",
  "home.subtitle":
    "Search accommodation the classic way, or just tell our assistant what you are looking for.",
  "home.cta": "Browse accommodations",

  "accommodations.title": "Accommodations",
  "accommodations.subtitle": "Search results will appear here.",
  "accommodations.empty": "No accommodations to show yet.",

  "login.title": "Welcome back",
  "login.subtitle": "Log in to book stays and see your bookings.",
  "login.email": "Email",
  "login.password": "Password",
  "login.submit": "Login",
  "login.noAccount": "Don't have an account?",
  "login.comingSoon": "Authentication will be connected in a later step.",

  "signup.title": "Create your account",
  "signup.subtitle": "Sign up to book stays and manage your bookings.",
  "signup.submit": "Create account",
  "signup.haveAccount": "Already have an account?",

  "footer.tagline": "Find the right stay, faster.",
  "footer.explore": "Explore",
  "footer.account": "Account",
  "footer.about": "About",
  "footer.aboutText": "A university project: classic search plus a RO/EN chatbot.",
  "footer.rights": "All rights reserved.",
} as const

export type TranslationKey = keyof typeof en

export const ro: Record<TranslationKey, string> = {
  "nav.home": "Acasă",
  "nav.accommodations": "Cazări",
  "nav.login": "Autentificare",
  "nav.signup": "Înregistrare",
  "nav.language": "Limbă",

  "home.title": "Găsește următoarea ta cazare",
  "home.subtitle":
    "Caută cazare în mod clasic sau spune-i asistentului nostru ce îți dorești.",
  "home.cta": "Vezi cazările",

  "accommodations.title": "Cazări",
  "accommodations.subtitle": "Rezultatele căutării vor apărea aici.",
  "accommodations.empty": "Nu există încă cazări de afișat.",

  "login.title": "Bine ai revenit",
  "login.subtitle": "Autentifică-te pentru a rezerva și a-ți vedea rezervările.",
  "login.email": "Email",
  "login.password": "Parolă",
  "login.submit": "Autentificare",
  "login.noAccount": "Nu ai cont?",
  "login.comingSoon": "Autentificarea va fi conectată într-un pas ulterior.",

  "signup.title": "Creează-ți contul",
  "signup.subtitle": "Înregistrează-te pentru a rezerva și a-ți gestiona rezervările.",
  "signup.submit": "Creează cont",
  "signup.haveAccount": "Ai deja cont?",

  "footer.tagline": "Găsește cazarea potrivită, mai repede.",
  "footer.explore": "Explorează",
  "footer.account": "Cont",
  "footer.about": "Despre",
  "footer.aboutText": "Un proiect universitar: căutare clasică plus chatbot RO/EN.",
  "footer.rights": "Toate drepturile rezervate.",
}

export const dictionaries = { en, ro } as const
export type Locale = keyof typeof dictionaries
export const LOCALES: Locale[] = ["ro", "en"]
export const DEFAULT_LOCALE: Locale = "ro"
