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

  "accommodations.title": "Accommodations",
  "accommodations.subtitle": "Find the stay that fits your plans.",

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

  "search.destination": "Where to?",
  "search.checkIn": "Check-in",
  "search.checkOut": "Check-out",
  "search.guests": "Guests",
  "search.submit": "Search",
  "search.dateError": "Choose both dates. Check-out must be after check-in.",

  "filters.title": "Filters",
  "filters.city": "City",
  "filters.type": "Type",
  "filters.price": "Price per night (RON)",
  "filters.min": "Min",
  "filters.max": "Max",
  "filters.apply": "Apply filters",
  "filters.reset": "Reset",

  "sort.label": "Sort by",
  "sort.priceAsc": "Price: low to high",
  "sort.priceDesc": "Price: high to low",

  "type.apartment": "Apartment",
  "type.house": "House",
  "type.cabin": "Cabin",
  "type.villa": "Villa",
  "type.hotel": "Hotel",
  "type.hostel": "Hostel",
  "type.room": "Room",

  "results.found": "{n} stays found",
  "results.foundOne": "1 stay found",
  "results.empty": "No stays match your filters. Try widening your search.",
  "results.error":
    "We couldn't load the stays. Check that the backend is running and try again.",
  "results.retry": "Try again",

  "card.perNight": "/ night",
  "card.guest": "guest",
  "card.guests": "guests",
  "card.bedroom": "bedroom",
  "card.bedrooms": "bedrooms",

  "pagination.prev": "Previous",
  "pagination.next": "Next",
  "pagination.page": "Page {page} of {total}",

  "map.viewList": "List",
  "map.viewMap": "Map",
  "map.viewDetails": "View details",
  "map.loading": "Loading map…",
  "map.error": "The map could not be displayed.",
  "map.retry": "Reload map",

  "details.back": "Back to results",
  "details.about": "About this stay",
  "details.amenities": "Amenities",
  "details.location": "Location",
  "details.noDescription": "No description available.",
  "details.photo": "Photo {n}",
  "details.bathroom": "bathroom",
  "details.bathrooms": "bathrooms",
  "details.book": "Book now",
  "details.bookSoon": "Booking will be available soon.",
  "details.notFoundTitle": "Stay not found",
  "details.notFoundText": "This accommodation does not exist or is no longer available.",

  "notFound.title": "Page not found",
  "notFound.text": "The page you are looking for does not exist.",
  "notFound.home": "Back to home",

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

  "accommodations.title": "Cazări",
  "accommodations.subtitle": "Găsește cazarea potrivită planurilor tale.",

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

  "search.destination": "Unde mergi?",
  "search.checkIn": "Check-in",
  "search.checkOut": "Check-out",
  "search.guests": "Oaspeți",
  "search.submit": "Caută",
  "search.dateError": "Alege ambele date. Check-out trebuie să fie după check-in.",

  "filters.title": "Filtre",
  "filters.city": "Oraș",
  "filters.type": "Tip",
  "filters.price": "Preț pe noapte (RON)",
  "filters.min": "Min",
  "filters.max": "Max",
  "filters.apply": "Aplică filtrele",
  "filters.reset": "Resetează",

  "sort.label": "Sortează după",
  "sort.priceAsc": "Preț: crescător",
  "sort.priceDesc": "Preț: descrescător",

  "type.apartment": "Apartament",
  "type.house": "Casă",
  "type.cabin": "Cabană",
  "type.villa": "Vilă",
  "type.hotel": "Hotel",
  "type.hostel": "Hostel",
  "type.room": "Cameră",

  "results.found": "{n} cazări găsite",
  "results.foundOne": "1 cazare găsită",
  "results.empty": "Nicio cazare nu corespunde filtrelor. Încearcă o căutare mai largă.",
  "results.error":
    "Nu am putut încărca cazările. Verifică dacă backend-ul rulează și încearcă din nou.",
  "results.retry": "Încearcă din nou",

  "card.perNight": "/ noapte",
  "card.guest": "oaspete",
  "card.guests": "oaspeți",
  "card.bedroom": "dormitor",
  "card.bedrooms": "dormitoare",

  "pagination.prev": "Anterior",
  "pagination.next": "Următoarea",
  "pagination.page": "Pagina {page} din {total}",

  "map.viewList": "Listă",
  "map.viewMap": "Hartă",
  "map.viewDetails": "Vezi detalii",
  "map.loading": "Se încarcă harta…",
  "map.error": "Harta nu a putut fi afișată.",
  "map.retry": "Reîncarcă harta",

  "details.back": "Înapoi la rezultate",
  "details.about": "Despre această cazare",
  "details.amenities": "Facilități",
  "details.location": "Locație",
  "details.noDescription": "Nicio descriere disponibilă.",
  "details.photo": "Fotografia {n}",
  "details.bathroom": "baie",
  "details.bathrooms": "băi",
  "details.book": "Rezervă acum",
  "details.bookSoon": "Rezervările vor fi disponibile în curând.",
  "details.notFoundTitle": "Cazarea nu a fost găsită",
  "details.notFoundText": "Această cazare nu există sau nu mai este disponibilă.",

  "notFound.title": "Pagina nu a fost găsită",
  "notFound.text": "Pagina căutată nu există.",
  "notFound.home": "Înapoi acasă",

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
